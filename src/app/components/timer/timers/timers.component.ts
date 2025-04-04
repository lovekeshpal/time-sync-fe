import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalStorageService } from '../../../services/local-storage/local-storage.service';
import { STORAGE_KEYS } from '../../../constants/storage-keys.constants';
import { ROUTES } from '../../../constants/routes.constants';
import { environment } from '../../../../environment';

// Define Timer interface directly in component
interface Timer {
  id: string;
  name: string;
  description?: string;
  duration: number;
  isPublic: boolean;
  showMilliseconds: boolean;
  theme: string;
  createdAt: string;
  userId: string;
}

@Component({
  selector: 'app-timers',
  imports: [CommonModule, RouterModule],
  templateUrl: './timers.component.html',
  styleUrl: './timers.component.scss',
})
export class TimersComponent {
  timers: Timer[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  routes = ROUTES;

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.loadTimers();
  }

  loadTimers(): void {
    this.isLoading = true;
    this.error = null;

    const token = this.localStorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http
      .get<Timer[]>(`${environment.apiUrl}/api/timer`, { headers })
      .subscribe({
        next: (data) => {
          this.timers = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching timers:', err);
          this.error = err.message || 'An error occurred while loading timers';
          this.isLoading = false;
        },
      });
  }

  // Helper method to format duration from seconds to human-readable format
  formatDuration(durationInSeconds: number): string {
    const days = Math.floor(durationInSeconds / (24 * 60 * 60));
    const hours = Math.floor((durationInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((durationInSeconds % (60 * 60)) / 60);
    const seconds = durationInSeconds % 60;

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds > 0) result += `${seconds}s`;

    return result.trim() || '0s';
  }
}
