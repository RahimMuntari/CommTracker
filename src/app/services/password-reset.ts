import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';

// Define a context token with a default empty string
export const CLIENT_URL_TOKEN = new HttpContextToken<string>(() => '');

@Injectable({
  providedIn: 'root',
})

export class PasswordReset {
  http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;  

  constructor() {}

   forgotPassword(email: string, dynamicClientUrl: string): Observable<any> {
    console.log('PasswordReset Service - forgotPassword called with email:', email, 'and dynamicClientUrl:', dynamicClientUrl);
    return this.http.post(
      `${this.apiUrl}/applicationuser/passwordreset`, 
      { email }, // Body payload only contains email now
      {
        // Provide the ClientUrl via HttpContext
        context: new HttpContext().set(CLIENT_URL_TOKEN, dynamicClientUrl)
      }
    );
  }

}
