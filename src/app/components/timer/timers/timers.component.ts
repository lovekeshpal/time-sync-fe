import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalStorageService } from '../../../services/local-storage/local-storage.service';
import { STORAGE_KEYS } from '../../../constants/storage-keys.constants';
import { ROUTES } from '../../../constants/routes.constants';
import { environment } from '../../../../environment';

interface Timer {
  _id: string;
  name: string;
  description: string;
  creator: string;
  duration: number;
  isRunning: boolean;
  isPublic: boolean;
  theme: string;
  showMilliseconds: boolean;
  startTime: string | null;
  pausedAt: number;
  shareId: string;
  createdAt: string;
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
      .get<Timer[]>(`${environment.apiUrl}/api/timer/list`, { headers })
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

  // Format duration from seconds to human-readable format
  formatDuration(durationInSeconds: number): string {
    const days = Math.floor(durationInSeconds / (24 * 60 * 60));
    const hours = Math.floor((durationInSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((durationInSeconds % (60 * 60)) / 60);
    const seconds = durationInSeconds % 60;

    const parts: string[] = [];

    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

    if (parts.length === 0) return '0 seconds';

    return parts.join(', ');
  }

  shareTimer(timer: Timer): void {
    // Base URL for sharing
    const shareUrl = `${window.location.origin}/shared-timer/${timer.shareId}`;

    // Check if Web Share API is available
    if (navigator.share) {
      navigator
        .share({
          title: `${timer.name} - Timer`,
          text: `Check out this timer: ${timer.name}`,
          url: shareUrl,
        })
        .catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          // You might want to show a toast notification here
          alert('Share link copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
  }
}
