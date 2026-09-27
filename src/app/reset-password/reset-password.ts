import { HttpParams } from '@angular/common/http';
import { Component, signal, computed, inject, DestroyRef } from '@angular/core';
import { ApplicationUserService } from '../services/application-user-service';
import { form, FormRoot, FormField, submit, validate, required, minLength } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { ValidateEmailToken } from '../services/validate-email-token';
import { LogInService } from '../services/log-in-service';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TokenValidationResponse } from '../token-validation-response';

// 1. Maintain your clear data model structure
interface PasswordFormModel { 
  id: string;
  password: string; 
  confirmPassword: string;
}

@Component({
  selector: 'app-reset-password',
  imports: [FormRoot, FormField],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
})
export class ResetPassword {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private validateEmailToken = inject(ValidateEmailToken);
  private applicationUserService = inject(ApplicationUserService); 
   private readonly destroyRef = inject(DestroyRef); 

    // Store token and email safely using Angular Signals
  email = signal<string>('');
  token = signal<string>('');
  userId = signal<string>('');

  // Input structural state signals
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  successMessage = signal('');

  // 1. Create a local tracker signal for submission status
  isSubmitted = signal(false);

  private triggerCount = signal(0);

  tokenStatus = signal<TokenValidationResponse>({ userId: null, isValid: false });

  // ✅ Initialized as an active class property with clear fallback parameters
  // ✅. This resource will be triggered by the user action to update the password
  passwordReset = rxResource({
    params: () => {
      const count = this.triggerCount();
      // Returns tracking parameters, passing an action count indicator
      return { 
        email: this.email(), 
        pass: this.model().password,
        count 
      };
    },
    stream: ({ params }) => {
      // 4. Guard condition: Prevent network call on initial page load (when count is 0)
      // if (params.count === 0) {
      //   return Promise.resolve(null as any); 
      // }
      return this.applicationUserService.updateApplicationUserPassword(params.email, params.pass);
    }
  });


   ngOnInit(): void {
    // Read the query parameters from the email link URL
    this.route.queryParamMap.subscribe(params => {
      this.email.set(params.get('email') || '');
      this.token.set(params.get('token') || '');

      console.log('ResetPassword Component - Query Params:', {
        email: this.email(),
        token: this.token()
      });

     
      var result = this.validateEmailToken.validateResetToken(this.email(), this.token());
      console.log('ResetPassword Component - Token validation result observable:', result); 

      this.tokenStatus.set({ userId: null, isValid: false }); // Reset token status before validation

      result.pipe(
        takeUntilDestroyed(this.destroyRef) 
      ).subscribe({
        next: (response: TokenValidationResponse) => {
          console.log('Server verification payload received:', response);

          // ✅ Update the signal state with both returned properties at once
          this.tokenStatus.set(response);

          // Handle application routing workflows based on the response status flag
          if (response.isValid) {
            console.log(`Reset link verified. Preparing form for User ID: ${response.userId }`);
            
            // Proactive: Patch the found userId straight into your resetForm tracking signal model
            this.model.update(current => ({ ...current, id: response.userId ?? '' }));
            this.userId.set(response.userId ?? '');
            console.log('ResetPassword Component - Form model updated with userId:', this.model().id);
            console.log('Form model updated with userId:', this.model().id);  
            console.log('ResetPassword Component - userId signal updated:', this.userId());
            
          } else {
            console.warn('Reset password link is invalid or expired.');
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          console.error('An error occurred during link validation:', err);
          this.router.navigate(['/login']);
        }
      });


      // result.subscribe({
      //   next: (isValid: boolean|string) => 
      //     {
      //       if (typeof isValid === 'boolean') {
      //         if (isValid) {
      //           console.log('Reset password link is valid.');
      //         }else {
      //           console.warn('Reset password link is not valid.');
      //           this.router.navigate(['/login']);
      //         }
      //         //console.log('Token validation result:', isValid);
      //       } else {
      //         //console.log('Token validation message:', isValid);
      //       }
      //     }});
      // // Security Check: If params are missing, kick them to login
      // if (!this.email() || !this.token()) {
      //   this.router.navigate(['/login']);
      // }
    });
  }

  // Primary data model mapping
  private model = signal<PasswordFormModel>({
    id: '',
    password: '',
    confirmPassword: ''
  });

  // Native Angular 22 form definition with built-in submission processor
  protected readonly resetForm = form<PasswordFormModel>(
    this.model,
    (fields) => {
      const idField = fields.id;
      const passwordField = fields.password;
      const confirmPasswordField = fields.confirmPassword;

      required(idField, { message: 'User Name is a required field' });
      required(passwordField, { message: 'Password is a required field' });
      minLength(passwordField, 6, { message: 'Password must be at least 6 characters long' });

      validate(passwordField, ({ value }) => {
        const password = value();
        const errors: string[] = [];

        if (!/\d/.test(password)) {
          errors.push('PasswordRequiresDigit');
        }

        if (!/[A-Z]/.test(password)) {
          errors.push('PasswordRequiresUpper');
        }

        if (!/[a-z]/.test(password)) {
          errors.push('PasswordRequiresLower');
        }

        if (!/[^a-zA-Z0-9]/.test(password)) {
          errors.push('PasswordRequiresNonAlphanumeric');
        }

        if (errors.length > 0) {
          const friendlyNames: Record<string, string> = {
            PasswordRequiresDigit: 'at least one number',
            PasswordRequiresUpper: 'an uppercase letter',
            PasswordRequiresLower: 'a lowercase letter',
            PasswordRequiresNonAlphanumeric: 'a special character',
          };

          const formattedErrors = errors.map((error) => friendlyNames[error] || error).join(', ');

          return {
            kind: 'password-strength',
            message: 'Password must include: ' + formattedErrors,
            details: errors,
          };
        }
        return undefined;
      });

      required(confirmPasswordField, { message: 'Confirm Password is a required field' });

      validate(confirmPasswordField, ({ value, valueOf }) => {
        const currentConfirm = value();
        const passwordValue = valueOf(passwordField);

        if (currentConfirm !== passwordValue) {
          return {
            kind: 'passwordMismatch',
            message: 'Passwords do not match',
          };
        }

        return null;
      });

      return {
        password: passwordField,
        confirmPassword: confirmPasswordField,
      };
    },
    {
      submission: {
        action: async (formRef) => {
          this.isSubmitted.set(true);

          try {
            const result = await firstValueFrom(this.applicationUserService.updateApplicationUserPassword(this.userId(), formRef.password().value()));
            console.log('Password update result:', result);
            this.successMessage.set('Secure handshake complete. Password has been updated.');
            formRef().reset(); // Reset the form fields to their initial state
            this.userId.set('');
            this.model.set({ id: '', password: '', confirmPassword: '' });
            this.isSubmitted.set(false);
          } catch (error) {
            console.error('Error resetting password:', error);
            this.successMessage.set('Failed to reset password. Please try again later.');
            this.isSubmitted.set(false);
          }
        }
      }
    }
);

  // onSubmit() {
  //   // Automatically prevents browser reload logic and validates state
  //   this.successMessage.set('Secure handshake complete. Password has been updated.');
    
  //   // Reset form sequence
  //   this.model.set({ password: '', confirmPassword: '' });
  // }

    // Modern Angular 22 form submit handler function
  protected async onSubmit() {
    this.isSubmitted.set(true);

    if (!this.isFormValid()) return;

    // Execute via standard standalone submit handler
    console.log('ResetPassword Component - Form submission initiated with model:', this.model());
    await submit(this.resetForm, async () => {
      var result = this.applicationUserService.updateApplicationUserPassword(this.tokenStatus().userId ?? '', this.model().password);
      result.subscribe({
        next: (updatedUser) => {
          console.log('Password updated successfully for user:', updatedUser);
        },
        error: (error) => {
          console.error('Error updating password:', error);
          this.successMessage.set('Failed to update password. Please try again later.');
        }
      });

      this.successMessage.set('Secure handshake complete. Password has been updated.');
      
      // Clear data fields
      this.model.set({ id: '', password: '', confirmPassword: '' });
      this.isSubmitted.set(false);
    });
  }

  /**
   * Action triggered by user button click to execute the update
   */
  triggerPasswordUpdate() {
    //this.triggerCall.set(true);
    // Force a re-fetch if they click the button a second time
    this.passwordReset.reload(); 
  }

  // Derived fine-grained validation metrics using computed signals
  protected readonly hasMinLength = computed(() => {
    return this.model().password.length >= 8;
  });

  protected readonly passwordsMatch = computed(() => {
    const data = this.model();
    if (!data.confirmPassword) return false;
    return data.password === data.confirmPassword;
  });

  protected readonly isFormValid = computed(() => {
    return this.hasMinLength() && this.passwordsMatch();
  });
}
