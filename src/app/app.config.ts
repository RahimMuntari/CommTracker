import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { LogInService } from './services/log-in-service';

// Factory function to kick off initialization logic
export function initializeAppFactory(authService: LogInService) {
  return () => authService.initializeAuth();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
     // FIX: Using the modern, self-contained functional environment initializer
    provideAppInitializer(() => {
      const authService = inject(LogInService);
      authService.initializeAuth();
    })
    // {
    //   provide: 'APP_INITIALIZER',
    //   useFactory: initializeAppFactory,
    //   deps: [LogInService],
    //   multi: true
    // }
  ]
};
