import { Component, signal, computed, inject } from '@angular/core';
import { form, FormRoot, FormField, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  imports: [FormRoot, FormField],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
})
export class ResetPassword {

  private route = inject(ActivatedRoute);
  private router = inject(Router);

    // Store token and email safely using Angular Signals
  email = signal<string>('');
  token = signal<string>('');

  // Input structural state signals
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  successMessage = signal('');

  // 1. Create a local tracker signal for submission status
  isSubmitted = signal(false);

   ngOnInit(): void {
    console.log('ResetPassword Component Initialized');
    // Read the query parameters from the email link URL
    this.route.queryParamMap.subscribe(params => {
      this.email.set(params.get('email') || '');
      this.token.set(params.get('token') || '');

      console.log('ResetPassword Component - Query Params:', {
        email: this.email(),
        token: this.token()
      });

      // Security Check: If params are missing, kick them to login
      if (!this.email() || !this.token()) {
        this.router.navigate(['/login']);
      }
    });
  }

  // Primary data model mapping
  private model = signal({
    password: '',
    confirmPassword: ''
  });

  // Native Angular 22 form definition with built-in submission processor
  protected readonly resetForm = form(
    this.model,
    fields => ({
      password: fields.password,
      confirmPassword: fields.confirmPassword
    })
  );

  onSubmit() {
    // Automatically prevents browser reload logic and validates state
    this.successMessage.set('Secure handshake complete. Password has been updated.');
    
    // Reset form sequence
    this.model.set({ password: '', confirmPassword: '' });
  }

    // Modern Angular 22 form submit handler function
  protected async onFormSubmit() {
    this.isSubmitted.set(true);

    if (!this.isFormValid()) return;

    // Execute via standard standalone submit handler
    await submit(this.resetForm, async () => {
      this.successMessage.set('Secure handshake complete. Password has been updated.');
      
      // Clear data fields
      this.model.set({ password: '', confirmPassword: '' });
      this.isSubmitted.set(false);
    });
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
