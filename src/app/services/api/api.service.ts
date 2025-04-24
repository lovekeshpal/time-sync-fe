import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { STORAGE_KEYS } from '../../constants';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  /**
   * Get auth headers for authorized requests
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.localStorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      const serverMessage = error.error?.msg || 'Unknown error occurred';
      errorMessage = `Error Code: ${error.status}\nMessage: ${serverMessage}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * GET request
   * @param path - API endpoint path
   * @param params - Optional query parameters
   * @param requiresAuth - Whether the request requires authentication
   */
  get<T>(
    path: string,
    params: HttpParams = new HttpParams(),
    requiresAuth: boolean = true
  ): Observable<T> {
    const options = {
      headers: requiresAuth ? this.getAuthHeaders() : undefined,
      params,
    };

    return this.http
      .get<T>(`${this.baseUrl}${path}`, options)
      .pipe(catchError(this.handleError));
  }

  /**
   * POST request
   * @param path - API endpoint path
   * @param body - Request body
   * @param requiresAuth - Whether the request requires authentication
   */
  post<T>(
    path: string,
    body: any,
    requiresAuth: boolean = true
  ): Observable<T> {
    const options = {
      headers: requiresAuth ? this.getAuthHeaders() : undefined,
    };

    return this.http
      .post<T>(`${this.baseUrl}${path}`, body, options)
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT request
   * @param path - API endpoint path
   * @param body - Request body
   */
  put<T>(path: string, body: any = {}): Observable<T> {
    const options = {
      headers: this.getAuthHeaders(),
    };

    return this.http
      .put<T>(`${this.baseUrl}${path}`, body, options)
      .pipe(catchError(this.handleError));
  }

  /**
   * DELETE request
   * @param path - API endpoint path
   */
  delete<T>(path: string): Observable<T> {
    const options = {
      headers: this.getAuthHeaders(),
    };

    return this.http
      .delete<T>(`${this.baseUrl}${path}`, options)
      .pipe(catchError(this.handleError));
  }
}
