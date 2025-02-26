import { CommonModule } from '@angular/common';
import { Component, HostBinding, inject, Inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocalStorageService } from './services/local-storage/local-storage.service';
import { SideMenuComponent } from './components/side-menu/side-menu.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, SideMenuComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'], // Corrected property name
})
export class AppComponent implements OnInit {
  @HostBinding('class') className = '';

  isSideMenuOpen: boolean = false;

  private localStorageService = inject(LocalStorageService);
  currentYear: number = new Date().getFullYear();

  ngOnInit() {
    const savedTheme = this.localStorageService.getItem('theme');
    if (savedTheme) {
      this.className = savedTheme;
      document.documentElement.classList.add(savedTheme);
    }
  }

  toggleTheme() {
    const darkMode = document.documentElement.classList.toggle('dark');
    this.className = darkMode ? 'dark' : '';
    this.localStorageService.setItem('theme', this.className);
  }

  toggleSideMenu() {
    this.isSideMenuOpen = !this.isSideMenuOpen;
  }

  closeSideMenu() {
    this.isSideMenuOpen = false;
  }
}
