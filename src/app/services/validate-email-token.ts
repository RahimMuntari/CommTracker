import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenValidationResponse } from '../token-validation-response';

@Injectable({
  providedIn: 'root',
})
export class ValidateEmailToken {
  
  private apiUrl = environment.apiUrl; // Replace with your actual API URL
  constructor(private http: HttpClient) {}

  validateResetToken(email: string, token: string): Observable<TokenValidationResponse> {
    // const params = new HttpParams().set('email', email).set('token', token);
      const payload = {
      Email: email,
      ResetToken: token
    };
    // console.log('Validating reset token for email:', email, 'with token:', token);
    return  this.http.post<TokenValidationResponse>(
      `${this.apiUrl}/applicationuser/verifyresettoken`, 
      payload // Body payload only contains email now
      );
  }
}
