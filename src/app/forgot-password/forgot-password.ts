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
  private passwordResetService = inject(PasswordReset);
  private readonly apiUrl = environment.apiUrl; // Replace with your actual API URL
  private readonly dynamicClientUrl = `localhost:4200/reset-password`; // Replace with your actual dynamic client URL
  constructor() {}
  submitRequest() {
    this.submitted.set(true);

    console.log('Submitting password reset request for email:', this.email());  
    // Simulate API call

    this.passwordResetService.forgotPassword(this.email(), this.dynamicClientUrl).subscribe(
      (response) => {
        console.log('Password reset request successful:', response);
        setTimeout(() => {
          console.log('Password reset link sent to:', this.email());
        }, 1000);
      }
    );
  }
}
