import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-menu',
  imports: [CommonModule, RouterModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent {
  @Input() isOpen: boolean = false;
  @Output() closeMenu = new EventEmitter<void>();

  menuItems = [
    { name: 'Dashboard', route: '/dashboard', icon: 'bi-speedometer2' },
    { name: 'Profile', route: '/profile', icon: 'bi-person' },
    { name: 'Settings', route: '/settings', icon: 'bi-gear' },
  ];

  closeMenuHandler(): void {
    this.closeMenu.emit();
  }
}
