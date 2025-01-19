import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);

  canActivate(): boolean {
    const token = this.localStorageService.getItem('token');
    if (token) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
