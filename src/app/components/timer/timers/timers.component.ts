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
  showShareModal = false;
  currentShareUrl = '';

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

    // Note the route is "/api/timer/list" based on your backend
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

  startTimer(timer: Timer, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const token = this.localStorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http
      .put<Timer>(
        `${environment.apiUrl}/api/timer/start/${timer._id}`,
        {},
        { headers }
      )
      .subscribe({
        next: (updatedTimer) => {
          // Update local timer state
          const index = this.timers.findIndex(
            (t) => t._id === updatedTimer._id
          );
          if (index !== -1) {
            this.timers[index] = updatedTimer;
          }
        },
        error: (err) => {
          console.error('Error starting timer:', err);
        },
      });
  }

  pauseTimer(timer: Timer, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const token = this.localStorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http
      .put<Timer>(
        `${environment.apiUrl}/api/timer/pause/${timer._id}`,
        {},
        { headers }
      )
      .subscribe({
        next: (updatedTimer) => {
          // Update local timer state
          const index = this.timers.findIndex(
            (t) => t._id === updatedTimer._id
          );
          if (index !== -1) {
            this.timers[index] = updatedTimer;
          }
        },
        error: (err) => {
          console.error('Error pausing timer:', err);
        },
      });
  }

  resetTimer(timer: Timer, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const token = this.localStorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http
      .put<Timer>(
        `${environment.apiUrl}/api/timer/reset/${timer._id}`,
        {},
        { headers }
      )
      .subscribe({
        next: (updatedTimer) => {
          // Update local timer state
          const index = this.timers.findIndex(
            (t) => t._id === updatedTimer._id
          );
          if (index !== -1) {
            this.timers[index] = updatedTimer;
          }
        },
        error: (err) => {
          console.error('Error resetting timer:', err);
        },
      });
  }

  shareTimer(timer: Timer, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl = `${window.location.origin}/shared-timer/${timer.shareId}`;

    // Check if Web Share API is available (modern mobile browsers)
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
          // Show a toast notification
          alert('Share link copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
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

  // Add this property to the class
  showDeleteConfirmation = false;
  timerToDelete: Timer | null = null;

  // Add these methods to the class
  confirmDeleteTimer(timer: Timer, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.timerToDelete = timer;
    this.showDeleteConfirmation = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.timerToDelete = null;
  }

  deleteTimer(): void {
    if (!this.timerToDelete) return;

    const token = this.localStorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http
      .delete(`${environment.apiUrl}/api/timer/${this.timerToDelete._id}`, {
        headers,
      })
      .subscribe({
        next: () => {
          // Remove the timer from the local array
          this.timers = this.timers.filter(
            (t) => t._id !== this.timerToDelete?._id
          );

          // Close the confirmation dialog
          this.showDeleteConfirmation = false;
          this.timerToDelete = null;
        },
        error: (err) => {
          console.error('Error deleting timer:', err);
          // You may want to show an error message to the user
        },
      });
  }

  // Add these helper methods to extract days, hours, minutes, seconds
  getDays(durationInSeconds: number): string {
    const days = Math.floor(durationInSeconds / (24 * 60 * 60));
    return days.toString().padStart(2, '0');
  }

  getHours(durationInSeconds: number): string {
    const hours = Math.floor((durationInSeconds % (24 * 60 * 60)) / (60 * 60));
    return hours.toString().padStart(2, '0');
  }

  getMinutes(durationInSeconds: number): string {
    const minutes = Math.floor((durationInSeconds % (60 * 60)) / 60);
    return minutes.toString().padStart(2, '0');
  }

  getSeconds(durationInSeconds: number): string {
    const seconds = Math.floor(durationInSeconds % 60);
    return seconds.toString().padStart(2, '0');
  }
}
