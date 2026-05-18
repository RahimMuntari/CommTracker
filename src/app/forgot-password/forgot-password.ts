import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
email = signal('');
  submitted = signal(false);

  submitRequest() {
    this.submitted.set(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Password reset link sent to:', this.email());
    }, 1000);
  }
}
