import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { Timer, TimerService } from '../../../services/timer/timer.service';
import { WebSocketService } from '../../../services/web-socket/web-socket.service';
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
  isWebSocketConnected = false;
  private countdownInterval: any;

  private subscriptions: Subscription[] = [];

  constructor(
    private timerService: TimerService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadTimers();

    // Subscribe to WebSocket connection status
    this.subscriptions.push(
      this.wsService.connectionStatus().subscribe((isConnected) => {
        this.isWebSocketConnected = isConnected;

        if (isConnected && this.timers.length > 0) {
          // Re-subscribe to user timers when connection is established
          this.wsService.subscribeToUserTimers();
        }
      })
    );

    // Subscribe to real-time timer updates from the service
    this.subscriptions.push(
      this.timerService.getTimersObservable().subscribe((timers) => {
        if (timers.length > 0) {
          this.timers = timers;
        }
      })
    );

    // Start local countdown interval
    this.startCountdownInterval();

    // Start millisecond counter for visual smoothness
    this.startMillisecondCounter();

    // Start server resync for consistency across clients
    // this.startServerResync();

    // Subscribe to explicit timer state changes
    this.subscriptions.push(
      this.wsService.onTimerStateChange().subscribe((stateChange) => {
        console.log('Timer state changed:', stateChange);

        // Force a refresh of all timers to ensure consistency
        this.loadTimers();
      })
    );

    // Add this to your ngOnInit
    this.subscriptions.push(
      this.wsService.onTimerPaused().subscribe((timerId) => {
        console.log('Timer paused event received for:', timerId);

        // Find and pause this timer immediately
        const index = this.timers.findIndex((t) => t._id === timerId);
        if (index !== -1 && this.timers[index].isRunning) {
          this.timers[index] = {
            ...this.timers[index],
            isRunning: false,
          };

          // Reset milliseconds
          this.milliseconds[timerId] = 0;

          // Force update
          this.timers = [...this.timers];
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions and intervals
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    if (this.millisecondsInterval) {
      clearInterval(this.millisecondsInterval);
    }
  }

  loadTimers(): void {
    this.isLoading = true;
    this.error = null;

    this.timerService.getAllTimers().subscribe({
      next: (data) => {
        // Process timers to calculate correct initial durations
        this.timers = data.map((timer) => {
          // Store original duration for future calculations
          const originalDuration = timer.duration;

          // For running timers, calculate the correct remaining time
          if (timer.isRunning) {
            const startTime = timer.startTime
              ? new Date(timer.startTime).getTime()
              : 0;
            const now = new Date().getTime();
            const elapsedSinceStart = Math.floor((now - startTime) / 1000);
            const totalElapsed = timer.pausedAt + elapsedSinceStart;

            return {
              ...timer,
              // Store original duration
              originalDuration: originalDuration,
              // Update remaining time
              duration: Math.max(0, originalDuration - totalElapsed),
            };
          }
          // For paused timers, subtract the pausedAt value
          else {
            return {
              ...timer,
              // Store original duration
              originalDuration: originalDuration,
              // Update remaining time
              duration: Math.max(0, originalDuration - timer.pausedAt),
            };
          }
        });

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

    // Show optimistic UI update
    const tempTimer = { ...timer, isRunning: true };
    const index = this.timers.findIndex((t) => t._id === timer._id);
    if (index !== -1) {
      this.timers[index] = tempTimer;
    }

    this.timerService.startTimer(timer._id).subscribe({
      error: (err) => {
        console.error('Error starting timer:', err);

        // Revert optimistic update on error
        if (index !== -1) {
          this.timers[index] = timer;
        }
      },
    });
  }

  pauseTimer(timer: Timer, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Add detailed logging
    console.log('Pausing timer:', timer._id, 'Current state:', timer.isRunning);

    // Skip if timer is already paused
    if (!timer.isRunning) {
      console.log('Timer already paused, skipping');
      return;
    }

    // Show optimistic UI update
    const tempTimer = {
      ...timer,
      isRunning: false,
    };

    const index = this.timers.findIndex((t) => t._id === timer._id);
    if (index !== -1) {
      this.timers[index] = tempTimer;
    }

    // Reset milliseconds for this timer
    this.milliseconds[timer._id] = 0;

    this.timerService.pauseTimer(timer._id).subscribe({
      next: () => {
        console.log('Timer paused successfully on server');

        // Force a quick resync to ensure all clients are updated
        setTimeout(() => {
          this.wsService.requestTimerUpdates();
        }, 100);
      },
      error: (err) => {
        console.error('Error pausing timer:', err);

        // Revert optimistic update on error
        if (index !== -1) {
          this.timers[index] = timer;
        }
      },
    });
  }

  resetTimer(timer: Timer, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.timerService.resetTimer(timer._id).subscribe({
      error: (err) => {
        console.error('Error resetting timer:', err);
      },
    });
  }

  /**
   * Start a local interval to update running timers every second
   */
  private startCountdownInterval(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      // Check if any timers are running before doing updates
      const hasRunningTimers = this.timers.some((timer) => timer.isRunning);

      if (!hasRunningTimers) {
        return; // Skip updates if no timers are running
      }

      this.timers = this.timers.map((timer) => {
        if (timer.isRunning) {
          // Simply decrement the current duration by 1 second
          const newDuration = Math.max(0, timer.duration - 1);

          return {
            ...timer,
            duration: newDuration,
            // Stop the timer if it reaches zero
            isRunning: newDuration > 0 ? true : false,
          };
        }
        return timer;
      });

      // Force change detection
      this.timers = [...this.timers];
    }, 1000);
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
        // The timer will be removed from the list via WebSocket event
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

  // Add these properties
  private millisecondsInterval: any;
  private milliseconds: Record<string, number> = {}; // Track milliseconds per timer

  // Add this method to get milliseconds for a specific timer
  getMilliseconds(timerId: string): string {
    return (this.milliseconds[timerId] || 0).toString().padStart(3, '0');
  }

  /**
   * Start a millisecond counter for smooth visual updates
   */
  private startMillisecondCounter(): void {
    if (this.millisecondsInterval) {
      clearInterval(this.millisecondsInterval);
    }

    this.millisecondsInterval = setInterval(() => {
      let updated = false;

      // Update milliseconds for each running timer
      this.timers.forEach((timer) => {
        if (timer.isRunning) {
          // Increment milliseconds (0-999)
          this.milliseconds[timer._id] =
            ((this.milliseconds[timer._id] || 0) + 100) % 1000;
          updated = true;
        } else {
          // Reset milliseconds for stopped timers
          this.milliseconds[timer._id] = 0;
        }
      });

      // Only trigger change detection if milliseconds were updated
      if (updated) {
        // Angular uses zone.js for change detection, so we don't need to do anything else
      }
    }, 100); // Update 10 times per second for smooth display
  }

  // /**
  //  * Periodically resync running timers with the server
  //  */
  // private startServerResync(): void {
  //   // More frequent resyncs for better real-time experience
  //   const RESYNC_INTERVAL = 1000; // Every second

  //   this.subscriptions.push(
  //     interval(RESYNC_INTERVAL).subscribe(() => {
  //       // Only resync if we have timers and are connected
  //       if (this.timers.length > 0 && this.isWebSocketConnected) {
  //         // Request latest timer states
  //         this.wsService.requestTimerUpdates();
  //       }
  //     })
  //   );
  // }
}
