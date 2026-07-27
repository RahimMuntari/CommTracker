import { HttpInterceptorFn } from '@angular/common/http';
import { CLIENT_URL_TOKEN } from './services/password-reset';

export const authContextInterceptor: HttpInterceptorFn = (req, next) => {
  // Extract the client URL from the Angular HttpContext
  const clientUrl = req.context.get(CLIENT_URL_TOKEN);

  if (clientUrl) {
    // Clone the request to add it as a header for the ASP.NET backend
    req = req.clone({
      setHeaders: { 'X-Client-Url': clientUrl }
    });
  }

  return next(req);
};
