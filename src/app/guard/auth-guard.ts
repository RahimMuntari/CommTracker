import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LogInService } from '../services/log-in-service';

export const authGuard: CanActivateFn = (route, state) => {
  
  // Block entry and redirect if the login state check returns false
  const authService = inject(LogInService);
  const router = inject(Router);
  if (!authService.isLoggedIn()) {
    authService.logout(); // Clean out stale storage if any
    router.navigate(['/login']);
    return false; 
  }

  return true; // Allow navigation to HomeComponent
};
