import { Component } from '@angular/core';
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

    this.subscriptions.push(
      this.timerService.getTimersObservable().subscribe((newTimers) => {
        if (newTimers.length > 0) {
          // Update individual timers without replacing array reference
          newTimers.forEach((newTimer) => {
            const index = this.timers.findIndex((t) => t._id === newTimer._id);
            if (index !== -1) {
              // Update existing timer properties while preserving reference
              Object.assign(this.timers[index], newTimer);
            } else {
              // Add new timer if it doesn't exist
              this.timers.push(newTimer);
            }
          });

          // Remove timers that no longer exist
          for (let i = this.timers.length - 1; i >= 0; i--) {
            const timer = this.timers[i];
            if (!newTimers.some((newTimer) => newTimer._id === timer._id)) {
              this.timers.splice(i, 1);
            }
          }
        }
      })
    );

    // Start local countdown interval
    this.startCountdownInterval();

    // Start millisecond counter for visual smoothness
    this.startMillisecondCounter();

    // Start server resync for consistency across clients
    this.startServerResync();

    // Subscribe to explicit timer state changes
    this.subscriptions.push(
      this.wsService.onTimerStateChange().subscribe((stateChange) => {
        // console.log('Timer state changed:', stateChange);

        if (!stateChange || !stateChange._id) {
          return;
        }

        // Find the timer to update
        const index = this.timers.findIndex((t) => t._id === stateChange._id);

        if (index !== -1) {
          // Process the timer to calculate correct duration
          const processedTimer = this.processTimerData(stateChange);

          // Update properties in place
          Object.assign(this.timers[index], processedTimer);
        } else {
          // This is a new timer
          this.timers.push(this.processTimerData(stateChange));
        }
      })
    );

    this.subscriptions.push(
      this.wsService.onTimerPaused().subscribe((timerId) => {
        console.log('Timer paused event received for:', timerId);

        // Find and pause this timer immediately
        const index = this.timers.findIndex((t) => t._id === timerId);
        if (index !== -1 && this.timers[index].isRunning) {
          // Update properties directly instead of creating a new object
          this.timers[index].isRunning = false;

          // Reset milliseconds
          this.milliseconds[timerId] = 0;

          // Remove this line that forces a re-render:
          // this.timers = [...this.timers];
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
        if (this.timers.length === 0) {
          // Only create a new array when we have no timers (first load)
          this.timers = data.map((timer) => this.processTimerData(timer));
        } else {
          // Update existing timers or add new ones without replacing array
          const currentIds = this.timers.map((t) => t._id);

          // Process each timer from the server
          data.forEach((serverTimer) => {
            const existingIndex = this.timers.findIndex(
              (t) => t._id === serverTimer._id
            );
            const processedTimer = this.processTimerData(serverTimer);

            if (existingIndex !== -1) {
              // Update existing timer in place
              Object.assign(this.timers[existingIndex], processedTimer);
            } else {
              // Add new timer
              this.timers.push(processedTimer);
            }
          });

          // Remove timers that no longer exist on the server
          for (let i = this.timers.length - 1; i >= 0; i--) {
            if (
              !data.some(
                (serverTimer) => serverTimer._id === this.timers[i]._id
              )
            ) {
              this.timers.splice(i, 1);
            }
          }
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching timers:', err);
        this.error = err.message || 'An error occurred while loading timers';
        this.isLoading = false;
      },
    });
  }

  // Helper method to process timer data
  private processTimerData(timer: Timer): Timer {
    const originalDuration = timer.duration;

    if (timer.isRunning) {
      const startTime = timer.startTime
        ? new Date(timer.startTime).getTime()
        : 0;
      const now = new Date().getTime();
      const elapsedSinceStart = Math.floor((now - startTime) / 1000);
      const totalElapsed = timer.pausedAt + elapsedSinceStart;

      return {
        ...timer,
        originalDuration: originalDuration,
        duration: Math.max(0, originalDuration - totalElapsed),
      };
    } else {
      return {
        ...timer,
        originalDuration: originalDuration,
        duration: Math.max(0, originalDuration - timer.pausedAt),
      };
    }
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

      // Update timer properties in place without creating new objects
      this.timers.forEach((timer) => {
        if (timer.isRunning) {
          // Decrement duration directly
          timer.duration = Math.max(0, timer.duration - 1);

          // Stop the timer if it reaches zero
          if (timer.duration === 0) {
            timer.isRunning = false;
          }
        }
      });

      // No need for this line that forces a re-render:
      // this.timers = [...this.timers];
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

    const shareUrl = `${window.location.origin}/timer-screen/${timer.shareId}`;

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

  /**
   * Periodically resync running timers with the server
   */
  private startServerResync(): void {
    // More frequent resyncs for better real-time experience
    const RESYNC_INTERVAL = 1000; // Every second

    this.subscriptions.push(
      interval(RESYNC_INTERVAL).subscribe(() => {
        // Only resync if we have timers and are connected
        if (this.timers.length > 0 && this.isWebSocketConnected) {
          // Request latest timer states
          this.wsService.requestTimerUpdates();
        }
      })
    );
  }
}
