import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { LogInRequest } from '../model/log-in-request';
import { Observable, tap } from 'rxjs';
import { LogInResponse } from '../model/log-in-response';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LogInService {
  
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl; 
  private readonly loginGenerateEndpoint = `${this.apiUrl}/jwt/generate`;  
  
   // Holds the current user's name (null if logged out)
  currentUser = signal<string | null>(null);

  readonly token = signal<string | null>(null);
  
  constructor(private router: Router, private route: ActivatedRoute) {}   

  loginUser(loginRequest: LogInRequest): Observable<LogInResponse> {

    var response =  this.http.post<LogInResponse>(this.loginGenerateEndpoint, loginRequest);

    response.pipe(
      tap({
        next: (response: LogInResponse) => {
          // This will now GUARANTEE execution upon subscription
          // console.log('Tap executed successfully:', response);
          // this.currentUser.set(response.userName);
          // this.token.set(response.token);
          // localStorage.setItem('auth_token', response.token);
        },
        error: (err) => {
          console.error('Tap caught error:', err);
        }
      })
    );

    response.subscribe({
      next: (res: LogInResponse) => {
        console.log('Login successful:', res);
        this.currentUser.set(res.fullName ? res.fullName : res.userName);
        this.token.set(res.token);
        localStorage.setItem('auth_token', res.token);
        console.log('Current user set to:', this.currentUser());  
        console.log('Token set to:', this.token()); 
      },
      error: (err) => {
        this.currentUser.set(null);
        this.token.set(null);
        localStorage.removeItem('auth_token');
        console.error('Error during login:', err.message); 
      }
    });
    return response;
  }

  validateResetToken(email: string, token: string): Observable<boolean|string> {
    const params = new HttpParams().set('email', email).set('token', token);
    console.log('Validating reset token for email:', email, 'with token:', token);
    return  this.http.get<boolean|string>(
      `${this.apiUrl}/applicationuser/verifyresettoken`, 
      { params } // Body payload only contains email now
      );
  }

   // Track the active timer subscription so we can clear it on logout
  private refreshTimeoutRef: any = null;

  /**
   * Reads storage on application startup. Restores session and sets up timers.
   */
  initializeAuth(): void {
    
    if (this.redirectToResetPasswordIfValidLink()) {
      console.log('Initializing authentication service...');
      this.currentUser.set(null);
      this.token.set(null);
      localStorage.removeItem('auth_token');
      return;
    }

    const savedToken = localStorage.getItem('auth_token');
    console.log('Initializing authentication. Retrieved token from localStorage:', savedToken);
    if (savedToken && !this.isTokenExpired(savedToken)) {
      try {
        const payloadBase64 = savedToken.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));

        this.token.set(savedToken);
        console.log('Decoded JWT payload USER NAME:', decodedPayload.FullName || decodedPayload.userName);
        // FIXED: Using your exact case-sensitive key 'userName'
        this.currentUser.set(decodedPayload.FullName || decodedPayload.userName || this.currentUser());
        
        // Start the countdown timer for the remaining token lifespan
        this.startAutoLogoutTimer(decodedPayload.exp);

         // Match the exact claims map key returned by your server (e.g. 'unique_name', 'sub', or 'name')
        const detectedName = decodedPayload.FullName || decodedPayload.userName;
        this.currentUser.set(decodedPayload.FullName || 'User');

        console.log('Session Detected for:', detectedName);
        console.log('Token restored:', this.token());
        console.log('Token expires at (exp claim):', decodedPayload.exp);
        
        console.log('Session restored for:', this.currentUser());
      } catch (e) {
        console.error('Initialization failed:', e);
        console.log('Token is invalid or malformed. Logging out.');
        this.logout();
      }
    } else {
      
      console.log('No valid token found during initialization. Logging out.');
      this.currentUser.set(null);
      this.token.set(null);
      localStorage.removeItem('auth_token');
    }
  }

  private redirectToResetPasswordIfValidLink(): boolean {
    const currentUrlTree = this.router.parseUrl(this.router.url || '/');
    const queryParams = currentUrlTree.queryParams;
    const email = this.normalizeQueryValue(
      queryParams['email'] ?? this.route.snapshot.queryParamMap.get('email')
    );
    const token = this.normalizeQueryValue(
      queryParams['token'] ?? this.route.snapshot.queryParamMap.get('token')
    );

    console.log('Current query params:', { email, token });

    if (!email || !token) {
      console.log(`Reset password route params are missing or invalid.{email: ${email}, token: ${token}}`);
      return false;
    }

    console.log('Reset password link detected with email:', email, 'and token:', token);

    // let isValidResetLink = false;
    // this.validateResetToken(email, token).subscribe({
    //   next: (result) => {
    //     isValidResetLink = result === true;
    //   }
    // });

    // if (!isValidResetLink) {
    // //   console.log('Reset password link is not valid.');
    // //   return false;
    // }

    if (!this.isValidEmail(email) || !this.isValidResetToken(token)) {
      console.warn('Reset password route params are not valid.');
      return false;
    }

    const currentPrimaryPath = currentUrlTree.root.children['primary']?.segments
      .map((segment) => segment.path)
      .join('/');
    if (currentPrimaryPath === 'reset-password') {
      return true;
    }

    this.router.navigate(['/reset-password'], {
      queryParams: { email, token },
    });
    return true;
  }

  private normalizeQueryValue(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidResetToken(token: string): boolean {
    return token.length >= 16 && !/\s/.test(token);
  }

  /**
   * Sets up a browser timeout to automatically kick the user out the moment the token expires.
   * @param expirationSec The 'exp' value from the JWT payload (in seconds)
   */
  private startAutoLogoutTimer(expirationSec: number): void {
    // Clear any existing active timer first
    if (this.refreshTimeoutRef) {
      clearTimeout(this.refreshTimeoutRef);
    }

    const expirationTimeMs = expirationSec * 1000;
    const timeLeftMs = expirationTimeMs - Date.now();

    if (timeLeftMs > 0) {
      this.refreshTimeoutRef = setTimeout(() => {
        console.warn('Session validity period reached. Automatically logging out.');
        this.logout();
        this.router.navigate(['/login']); // Force redirect to login page
      }, timeLeftMs);
    } else {
      // If time left is already negative, log out immediately
      this.logout();
      this.router.navigate(['/login']);
    }
  }


  /**
   * Evaluates if the current browser session has a valid, active login state.
   */
  isLoggedIn(): boolean {
    const activeToken = this.token() || localStorage.getItem('auth_token');
    
    // 1. If no token exists, the user is definitely not logged in
    if (!activeToken) {
      return false;
    }

    // 2. If a token exists, verify it has not expired yet
    return !this.isTokenExpired(activeToken);
  }

  // Checks if a token exists and is still structurally valid in time
  private isTokenExpired(token: string): boolean {
    try { 
      // Decode the middle payload segment of the JWT
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));

      if (decodedPayload && decodedPayload.exp) {
        const expirationTimeMs = decodedPayload.exp * 1000;
        return Date.now() >= expirationTimeMs; 
      }
    } catch (e) {
      console.error('Invalid token payload structural decoding:', e);
      return true; // Malformed tokens are treated as expired
    }
    return true;
  }

  login(username: string) {
    this.currentUser.set(username);
  }

  logout() {
    this.currentUser.set(null);
    this.token.set(null);
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }

}
