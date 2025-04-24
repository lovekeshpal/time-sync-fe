import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../api/api.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ROUTES, STORAGE_KEYS } from '../../constants';

interface AuthResponse {
  token: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private apiService: ApiService,
    private router: Router,
    private localStorageService: LocalStorageService
  ) {}

  /**
   * Register a new user
   */
  signup(
    username: string,
    email: string,
    password: string
  ): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>(
      '/api/auth/signup',
      { username, email, password },
      false // No auth required for signup
    );
  }

  /**
   * Log in a user
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.apiService
      .post<AuthResponse>(
        '/api/auth/login',
        { email, password },
        false // No auth required for login
      )
      .pipe(
        tap((response) => {
          if (response.token) {
            this.localStorageService.setItem(
              STORAGE_KEYS.AUTH_TOKEN,
              response.token
            );
          }
        })
      );
  }

  /**
   * Log out the current user
   */
  logout(): void {
    this.localStorageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    this.router.navigate([ROUTES.AUTH.LOGIN]);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.localStorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get the current user profile
   */
  getCurrentUser(): Observable<any> {
    return this.apiService.get('/api/user/profile');
  }
}
