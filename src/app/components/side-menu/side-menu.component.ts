import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { ROUTES, STORAGE_KEYS, UI_CONSTANTS } from '../../constants';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-side-menu',
  imports: [CommonModule, RouterModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent {
  private localStorageService = inject(LocalStorageService);
  private authService = inject(AuthService);

  @Input() isOpen: boolean = false;
  @Output() closeMenu = new EventEmitter<void>();

  constructor(private router: Router) {}

  menuItems = [
    {
      name: UI_CONSTANTS.MENU.DASHBOARD,
      route: ROUTES.DASHBOARD,
      icon: 'bi-speedometer2',
      requiresAuth: true,
    },
    {
      name: UI_CONSTANTS.MENU.TIMERS,
      route: ROUTES.TIMERS,
      icon: 'bi-stopwatch',
      requiresAuth: true,
    },
  ];

  closeMenuHandler(): void {
    this.closeMenu.emit();
  }

  logout(): void {
    this.closeMenu.emit();
    this.authService.logout();
  }
}
