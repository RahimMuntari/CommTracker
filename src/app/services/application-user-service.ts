import { inject, Injectable, resource, signal, Signal } from '@angular/core';
import { ApplicationUser } from '../model/application-user';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { rxResource } from '@angular/core/rxjs-interop';

export interface UpdatePasswordRequest {
  userId: string;
  newPassword: string;
}
  
@Injectable({
  providedIn: 'root',
})
export class ApplicationUserService {

  private http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl; 
  private readonly checkUsernameEndpoint = `${this.apiUrl}/applicationuser/CheckUserName`;
  private readonly getAllUsersEndpoint = `${this.apiUrl}/applicationuser/getall`;  
  private readonly createUserEndpoint = `${this.apiUrl}/applicationuser/create`;  
  applicationUsers = resource<ApplicationUser[], unknown>({
    loader: async () =>{
      // return fetch(this.apiUrl).then(response => response.json());
      const users = await fetch(this.getAllUsersEndpoint);
      return users.json();  
    }
  });

  // username = signal('');
  // checkUserNameAvailability = rxResource({
  //   params: () => {
  //     if (!this.username() || this.username().trim() === "") {
  //       return undefined;
  //     }
  //     return { username: this.username() }; 
  //   },
  //   stream:  ({params}) => {
  //       const response = this.http.get<boolean>(`${this.checkUsernameEndpoint}?username=${params?.username}`);
  //       return response;
  //     }
  // });

   /**
   * Checks username availability in the database.
   * Emits true if the username is already taken, false if available.
   */
  checkUserNameAvailability(username: string): Observable<boolean> {
    var result = this.http.get<boolean>(`${this.checkUsernameEndpoint}?username=${username}`);
    result.subscribe({
      next: (res: boolean) => {
        console.log('Username availability check result:', res);
      },
      error: (err) => console.error('Error checking username availability:', err.message),
    });
    return result;
  }

  constructor() {}

  createApplicationUser(userData: ApplicationUser): Observable<ApplicationUser> {
    console.log('Service- Creating user with data:', userData);
    var result = this.http.post<ApplicationUser>(this.createUserEndpoint, userData);
    // debugger;
    result.forEach((res: ApplicationUser) => {
      console.log('User created successfully - 1 :', res);
    });
    result.subscribe({
      next: (res: ApplicationUser) => {
        console.log('User created successfully - 2:', res);
      },
      error: (err) => console.error('Error creating user:', err.message),
    });
    return result;  
  }

  getApplicationUsers() : Observable<ApplicationUser[]> {
    return this.http.get<ApplicationUser[]>(this.getAllUsersEndpoint);
  }

  getApplicationUserById(userId: string) : Observable<ApplicationUser> {
    return this.http.get<ApplicationUser>(`${this.apiUrl}/applicationuser/${userId}`);
  }

  updateApplicationUserPassword(userId: string, newPassword: string) : Observable<ApplicationUser> {
    // const payload = {
    //   password: newPassword
    // };

    // return this.http.put<ApplicationUser>(`${this.apiUrl}/applicationuser/${userId}/updatepassword`, payload);

      const payload: UpdatePasswordRequest = { userId, newPassword };
    console.log('Updating password for userId:', userId, 'with new password:', newPassword);  
    // Depending on your minimal API route configuration, adjust the endpoint URL structure:
    // This assumes your route handles inputs via a POST body or query params.
    return this.http.put<ApplicationUser>(`${this.apiUrl}/applicationuser/updatepassword`, payload).pipe(
      catchError(this.handleError)
    );
  }

  createApplicationUserResource(userDataSignal: Signal<ApplicationUser>) {
    
    return httpResource<ApplicationUser>(() => {
    const userData = userDataSignal();
    if (!userData) {
      throw new Error('User data is not available');
    }
      return {
        url: this.createUserEndpoint,
        method: 'POST',
        body: userData,
      };  
    });
  }

   private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown database or server error occurred.';
    
    // Handles the custom string messages returned inside your backend TypedResults.NotFound("...")
    if (error.error && typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }

}
