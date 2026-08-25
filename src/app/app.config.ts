import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { LogInService } from './services/log-in-service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authContextInterceptor } from './auth-context-interceptor';

// Ensure auth restoration runs before route guards evaluate on refresh.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(() => {
      const authService = inject(LogInService);
      authService.initializeAuth();
    }),
    // Register HttpClient along with your interceptor array
    provideHttpClient(
      withInterceptors([
        authContextInterceptor
      ])
    )
    // {
    //   provide: 'APP_INITIALIZER',
    //   useFactory: initializeAppFactory,
    //   deps: [LogInService],
    //   multi: true
    // }
  ]
};
