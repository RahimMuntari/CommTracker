import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LogInService } from '../services/log-in-service';

export const loginRedirectGuard: CanActivateFn = () => {
  const authService = inject(LogInService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
