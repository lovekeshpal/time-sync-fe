import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  constructor(private http: HttpClient) { }

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
  
}
