import { inject, Injectable, Signal } from '@angular/core';
import { ApplicationUser } from '../model/application-user';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApplicationUserService {
  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:44371/api/users'; 

  constructor() {}

  createApplicationUser(userData: ApplicationUser): Observable<ApplicationUser> {
    return this.http.post<ApplicationUser>(this.apiUrl, userData);
  }

  getApplicationUsers() : Observable<ApplicationUser[]> {
    return this.http.get<ApplicationUser[]>(this.apiUrl);
  }

  getApplicationUserById(userId: string) : Observable<ApplicationUser> {
    return this.http.get<ApplicationUser>(`${this.apiUrl}/${userId}`);
  }

  createApplicationUserResource(userDataSignal: Signal<ApplicationUser>) {
    
    return httpResource<ApplicationUser>(() => {
    const userData = userDataSignal();
    if (!userData) {
      throw new Error('User data is not available');
    }
      return {
        url: this.apiUrl,
        method: 'POST',
        body: userData,
      };  
    });
  }
}
