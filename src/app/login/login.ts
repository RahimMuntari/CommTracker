import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LogInService } from '../services/log-in-service';
import { createInitialLogInRequestSignal, createLogInRequestForm } from '../model/log-in-request';
import { FormField, FormRoot, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { createInitialLogInResponseSignal } from '../model/log-in-response';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormRoot, FormField],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  constructor(private router: Router) {}

  private loginService = inject(LogInService);    
  readonly loginRequestCreateForm = createLogInRequestForm(); 
  readonly loginRequestModel = createInitialLogInRequestSignal(); 
  readonly loginResponseModel = createInitialLogInResponseSignal(); 

  protected errorMessage = signal<string | null>(null);
  protected validationErrors = signal<{ [key: string]: string[] } | null>(null);
  protected validationMessages = computed(() => {
    const errors = this.validationErrors();
    if (!errors) {
      return [];
    }

    return Object.values(errors)
      .flat()
      .filter((message): message is string => Boolean(message));
  });


  email = signal('');
  password = signal('');
  loading = signal(false);

   onSuccess: boolean = false;

 onSubmit() {
  this.errorMessage.set(null);
  this.validationErrors.set(null);
  console.log('Submitting form with data:', this.loginRequestCreateForm().value()); 
    submit(this.loginRequestCreateForm, async () => {
      this.loading.set(true);
      
      console.log('Submitting form with data:', this.loginRequestCreateForm().value());
      try{
          this.onSuccess = false;  
          const resultFirstValue = await firstValueFrom(this.loginService.loginUser(this.loginRequestCreateForm().value()));
          this.loginResponseModel.set(resultFirstValue);
          console.log('Login successful:', resultFirstValue); 
          console.log('*Token*:', resultFirstValue.token);
          // 1. Store the token string coming from your API response object
          localStorage.setItem('auth_token', resultFirstValue.token);
          this.loginService.token.set(resultFirstValue.token);
          this.loginService.currentUser.set(resultFirstValue.fullName ? resultFirstValue.fullName : resultFirstValue.userName); 
          // 2. Run initialization to extract the 'userName' and start the auto-logout timer
          this.loginService.initializeAuth();

          this.router.navigate(['/dashboard']); 
          this.loginRequestCreateForm().reset();
          this.onSuccess = true;  
        
      } 
      catch(err: unknown){
          this.onSuccess = false;
          if(err instanceof HttpErrorResponse){ 
            
              // Catch exceptions and safely map API ValidationProblem (400) or NotFound (404)
              if (err?.status === 400 && err.error?.errors) {
                  this.validationErrors.set(err.error.errors); 
              } else if (err?.status === 404) {
                  this.validationErrors.set({ general: ['Login Failed:'] });
              }
              else {
                this.errorMessage.set(err.error || 'An unexpected error occurred.');
              }
              console.error('Error creating user:', err.message);
              } else {
                this.errorMessage.set('An unexpected error occurred.');
          }
      }
      finally{
          this.loading.set(false);
      }
      
    });
  }
}
