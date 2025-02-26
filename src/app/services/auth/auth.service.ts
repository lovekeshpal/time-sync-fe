import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private localStorageService: LocalStorageService
  ) {}

  signup(username: string, email: string, password: string): Observable<any> {
    const url = 'http://localhost:3000/api/auth/signup';
    const body = { username, email, password };
    return this.http.post<any>(url, body);
  }

  login(email: string, password: string): Observable<any> {
    const url = 'http://localhost:3000/api/auth/login';
    const body = { email, password };
    return this.http.post<any>(url, body);
  }

  logout(): void {
    // Clear the token
    this.localStorageService.removeItem('token');
    // Navigate to login page
    this.router.navigate(['/login']);
  }
}
