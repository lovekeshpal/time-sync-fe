import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Timer, TimerService } from '../../../services/timer/timer.service';
import { ROUTES } from '../../../constants';

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
  showDeleteConfirmation = false;
  timerToDelete: Timer | null = null;

  constructor(private timerService: TimerService) {}

  ngOnInit(): void {
    this.loadTimers();
  }

  loadTimers(): void {
    this.isLoading = true;
    this.error = null;

    this.timerService.getAllTimers().subscribe({
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

    this.timerService.startTimer(timer._id).subscribe({
      next: (updatedTimer) => {
        // Update local timer state
        const index = this.timers.findIndex((t) => t._id === updatedTimer._id);
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

    this.timerService.pauseTimer(timer._id).subscribe({
      next: (updatedTimer) => {
        // Update local timer state
        const index = this.timers.findIndex((t) => t._id === updatedTimer._id);
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

    this.timerService.resetTimer(timer._id).subscribe({
      next: (updatedTimer) => {
        // Update local timer state
        const index = this.timers.findIndex((t) => t._id === updatedTimer._id);
        if (index !== -1) {
          this.timers[index] = updatedTimer;
        }
      },
      error: (err) => {
        console.error('Error resetting timer:', err);
      },
    });
  }

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

    this.timerService.deleteTimer(this.timerToDelete._id).subscribe({
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
          alert('Share link copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
  }

  // Format duration and other helper methods remain the same...
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
