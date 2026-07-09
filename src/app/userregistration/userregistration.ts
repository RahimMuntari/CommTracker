import { Component, inject, linkedSignal, Signal, signal } from '@angular/core';
import { FormField, submit, FormRoot } from "@angular/forms/signals";
import { ApplicationUser, createApplicationUserForm, createInitialUserSignal } from '../model/application-user';
import { ApplicationUserService } from '../services/application-user-service';
import { KeyValuePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-userregistration',
  imports: [FormField, KeyValuePipe, FormRoot],
  templateUrl: './userregistration.html',
  styleUrls: ['./userregistration.css'],
})
export class Userregistration {

  userRegistration = signal<ApplicationUser | null>(null);

  private userService = inject(ApplicationUserService);
  private applicationUserService = inject(ApplicationUserService);
  readonly applicationUserForm = createApplicationUserForm();
  protected readonly applicationUserModel = linkedSignal(createInitialUserSignal());
  protected errorMessage = signal<string | null>(null);
  protected validationErrors = signal<{ [key: string]: string[] } | null>(null);

  /**
   *
   */
  constructor() {
    
    const applicationUsers = signal<ApplicationUser[]>([]);

    console.log(this.applicationUserModel());
    this.applicationUserModel.update(currentUser => ({
      ...currentUser,
      role: 'User'
    }));
     
  }

  protected onKeyBoardDown(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Delete', 'Escape', 'Enter', 'Tab', 'ArrowLeft', 'ArrowRight'];
    if (!allowedKeys.includes(event.key) && !/^\d$/.test(event.key)) {
      //event.preventDefault();
    }
  }
  onSuccess: boolean = false;

 onSubmit() {
    submit(this.applicationUserForm, async (formData) => {
      const user = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobileNo: formData.phoneNumber,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role,
      };
      
      console.log('Submitting form with data:', this.applicationUserForm().value());
      try{
        this.onSuccess = false;  
          const resultFirstValue = await firstValueFrom(this.applicationUserService.createApplicationUser(this.applicationUserForm().value()));
          this.userRegistration.set(resultFirstValue);
          this.applicationUserForm().reset();
          this.onSuccess = true;  
      }
      catch(err: unknown){
          this.onSuccess = false;
          if(err instanceof HttpErrorResponse){ 
            
              // Catch exceptions and safely map API ValidationProblem (400) or NotFound (404)
              if (err?.status === 400 && err.error?.errors) {
                  this.validationErrors.set(err.error.errors); 
              } else {
                this.errorMessage.set(err.error || 'An unexpected error occurred.');
              }
              console.error('Error creating user:', err.message);
          }
      }
      finally{

      }
      

      // const resultUserResource = this.applicationUserService.createApplicationUserResource(this.applicationUserModel);
      // const resultUser = this.applicationUserService.createApplicationUser(this.applicationUserModel()).subscribe({
      //   next: (createdUser) => {
      //     this.applicationUserModel.set({
      //       ...createdUser,
      //       createdAt: new Date(),
      //       updatedAt: new Date(),
      //     });
      //     console.log('User created successfully:', createdUser)
      //   },
      //   error: (error) => {
      //     // Map backend responses to corresponding status signals
      //   if (error.status === 400 && error.error?.errors) {
      //     this.validationErrors.set(error.error.errors); 
      //   } else {
      //     this.errorMessage.set(error.error || 'An unexpected error occurred.');
      //   }
      //     console.error('Error creating user:', error);
      //   }
      // });
      
      // console.log('User Data:', user);
      
      //this.onSuccess = true;

      //return resultUser;
    });
  }

  resetForm() {
    this.applicationUserForm().reset({
      firstName: '',
      lastName: '',
      fullName: '',
      role: '',
      email: '',
      phoneNumber: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
  }
}
