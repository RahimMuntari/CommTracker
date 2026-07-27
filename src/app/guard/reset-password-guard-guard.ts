import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const resetPasswordGuardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // 1. Extract query parameters from the target route snapshot
  const token = route.queryParamMap.get('token');
  const email = route.queryParamMap.get('email');
  console.log('ResetPasswordGuard - Query Params:', { token, email });  
  // 2. Validate that both properties exist in the link
  if (token && email) {
    return true; // Allow navigation to the reset-password page
  }

  // 3. If parameters are missing, intercept and redirect to login
  console.warn('Reset password link is missing token or email parameters.');
  return router.createUrlTree(['/login']);
};
