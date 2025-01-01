import { CommonModule } from '@angular/common';
import { Component, HostBinding } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  @HostBinding('class') className = '';

  toggleTheme() {
    const darkMode = document.documentElement.classList.toggle('dark');
    this.className = darkMode ? 'dark' : '';
  }

}
