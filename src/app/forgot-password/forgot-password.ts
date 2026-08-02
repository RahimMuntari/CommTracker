import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PasswordReset } from '../services/password-reset';
import { environment } from '../../environments/environment';
import { FormField } from "@angular/forms/signals";

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, FormField],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPassword {
  email = signal('');
  submitted = signal(false);
  successMessage = signal('');
  private passwordResetService = inject(PasswordReset);
  private readonly apiUrl = environment.apiUrl;
  private readonly dynamicClientUrl = `localhost:4200/reset-password`; // Replace with your actual dynamic client URL
  constructor() {}
  submitRequest() {
    // this.submitted.set(true);

    console.log('Submitting password reset request for email:', this.email());  
    // Simulate API call

    this.passwordResetService.forgotPassword(this.email(), this.dynamicClientUrl).subscribe({
      next: (isSuccess: boolean) => {
        if (isSuccess) {
          this.submitted.set(true);
          console.log('Password reset request successful: Email sent.');
          setTimeout(() => {
            console.log('Password reset link sent to:', this.email());
          }, 1000);
        } else {
          this.submitted.set(false);
          this.successMessage.set ('Failed to send password reset link. Please try again later.');
          console.log('API returned false: Email could not be sent.');
          
        }
      },
      error: (error) => {
        this.submitted.set(false);
        this.successMessage.set('Failed to send password reset link. Please try again later.');
        console.error('HTTP Error occurred during password reset request:', error);
        // Handle network errors or server exceptions here
      }
    });

  }
}
