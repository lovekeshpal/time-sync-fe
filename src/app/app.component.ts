import { CommonModule } from '@angular/common';
import { Component, HostBinding, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocalStorageService } from './services/local-storage/local-storage.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'] // Corrected property name
})
export class AppComponent implements OnInit {

  @HostBinding('class') className = '';

  constructor(private localStorageService: LocalStorageService) { }

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
}
