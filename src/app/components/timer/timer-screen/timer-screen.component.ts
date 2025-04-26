import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LayoutService } from '../../../services/layout/layout.service';
import { TimerService, Timer } from '../../../services/timer/timer.service';
import { WebSocketService } from '../../../services/web-socket/web-socket.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-timer-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer-screen.component.html',
  styleUrl: './timer-screen.component.scss',
})
export class TimerScreenComponent implements OnInit, OnDestroy {
  timer: Timer | null = null;
  isLoading = true;
  error: string | null = null;
  isWebSocketConnected = false;
  private timerId: string | null = null;
  private shareId: string | null = null;
  private subscriptions: Subscription[] = [];
  private countdownInterval: any;
  private millisecondsInterval: any;
  private milliseconds: number = 0;
  private refreshInterval: any;

  constructor(
    private route: ActivatedRoute,
    private layoutService: LayoutService,
    private webSocketService: WebSocketService,
    private timerService: TimerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Use setTimeout to delay the visibility change to the next change detection cycle
    setTimeout(() => {
      this.layoutService.setHeaderVisibility(false);
    });

    this.getShareId();
    this.fetchTimerData();
    this.startMillisecondCounter();

    // Start local countdown for smooth updates
    this.startCountdownInterval();

    // Add WebSocket connection status listener
    this.monitorWebSocketConnection();
  }

  ngOnDestroy(): void {
    // Restore header and footer when component is destroyed
    this.layoutService.setHeaderVisibility(true);

    // Clean up all subscriptions and intervals
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    if (this.millisecondsInterval) {
      clearInterval(this.millisecondsInterval);
    }

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Unsubscribe from timer updates
    if (this.timerId) {
      this.webSocketService.unsubscribeFromTimer(this.timerId);
    }
  }

  monitorWebSocketConnection(): void {
    this.subscriptions.push(
      this.webSocketService.connectionStatus().subscribe((isConnected) => {
        console.log('WebSocket connection status changed:', isConnected);
        this.isWebSocketConnected = isConnected;

        if (isConnected && this.timerId) {
          // When connection is established/reestablished, subscribe to updates
          console.log('WebSocket connected, subscribing to timer updates');
          this.subscribeToTimerUpdates();
        } else if (!isConnected && this.shareId) {
          // Set up polling as fallback when WebSocket isn't connected
          console.log('WebSocket disconnected, setting up polling fallback');
          this.setupPollingFallback();
        }
      })
    );
  }

  getShareId(): void {
    // Get the ID from the URL
    this.shareId = this.route.snapshot.paramMap.get('id');
    if (!this.shareId) {
      this.error = 'Timer ID not found in URL';
      this.isLoading = false;
      return;
    }
  }

  // Set up polling as fallback when WebSocket isn't available
  private setupPollingFallback(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Poll for timer updates every 10 seconds
    this.refreshInterval = setInterval(() => {
      if (this.shareId) {
        console.log('Polling for timer updates');
        this.timerService.getSharedTimer(this.shareId).subscribe({
          next: (timer) => {
            console.log('Received timer update from polling:', timer.isRunning);
            this.timer = this.processTimerData(timer);
            // Force change detection to update UI
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error refreshing timer:', err);
          },
        });
      }
    }, 10000);
  }

  // Process timer data to calculate correct duration based on server state
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

  // Countdown display methods
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

  getMilliseconds(): string {
    return this.milliseconds.toString().padStart(3, '0');
  }

  // Local countdown for smooth updates between server pushes
  private startCountdownInterval(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      if (this.timer?.isRunning) {
        this.timer.duration = Math.max(0, this.timer.duration - 1);

        // Stop the timer if it reaches zero
        if (this.timer.duration === 0) {
          this.timer.isRunning = false;
        }

        // Force change detection to update UI
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  // Millisecond counter for smooth visual feedback
  private startMillisecondCounter(): void {
    if (this.millisecondsInterval) {
      clearInterval(this.millisecondsInterval);
    }

    this.millisecondsInterval = setInterval(() => {
      if (this.timer?.isRunning) {
        // Increment milliseconds (0-999)
        this.milliseconds = (this.milliseconds + 100) % 1000;

        // Force change detection to update UI
        this.cdr.detectChanges();
      } else {
        // Reset milliseconds for stopped timer
        this.milliseconds = 0;
      }
    }, 100); // Update 10 times per second
  }

  subscribeToTimerUpdates(): void {
    if (!this.timerId) {
      console.warn('Cannot subscribe to timer updates: No timerId available');
      return;
    }

    try {
      console.log('Subscribing to timer updates for timer:', this.timerId);

      // First try to subscribe to the specific timer
      this.webSocketService.subscribeToTimer(this.timerId);

      // Then subscribe to all user timers as a fallback
      this.webSocketService.subscribeToUserTimers();

      // Listen for timer state changes - these are primarily start events
      this.subscriptions.push(
        this.webSocketService.onTimerStateChange().subscribe((updatedTimer) => {
          // Only process if we received a valid timer update
          if (!updatedTimer || !updatedTimer._id) {
            console.log('Received invalid timer update');
            return;
          }

          console.log(
            'Timer state change received:',
            updatedTimer._id,
            'Current timer:',
            this.timerId,
            'Running:',
            updatedTimer.isRunning
          );

          // Only process if it's our timer
          if (updatedTimer._id === this.timerId) {
            console.log('Updating timer state to:', updatedTimer.isRunning);

            // Process timer data to get the correct duration
            const processedTimer = this.processTimerData(updatedTimer);

            // Update timer properties without replacing the object
            if (this.timer) {
              Object.assign(this.timer, processedTimer);
            } else {
              this.timer = processedTimer;
            }

            // Force change detection to update UI immediately
            this.cdr.detectChanges();
          }
        })
      );

      // Listen specifically for pause events - this is handled separately in TimersComponent
      this.subscriptions.push(
        this.webSocketService.onTimerPaused().subscribe((pausedTimerId) => {
          if (!pausedTimerId) {
            console.log('Received invalid pause event (no timerId)');
            return;
          }

          console.log(
            'Timer paused event received for:',
            pausedTimerId,
            'Current timer:',
            this.timerId
          );

          // Process pause event if it's for our timer - without checking current state
          if (pausedTimerId === this.timerId && this.timer) {
            console.log('Pausing timer immediately');

            // Update properties directly without replacing the object
            this.timer.isRunning = false;

            // Reset milliseconds
            this.milliseconds = 0;

            // Force change detection to update UI immediately
            this.cdr.detectChanges();

            // Force a refresh from server to ensure we have the latest data
            if (this.shareId) {
              this.timerService.getSharedTimer(this.shareId).subscribe({
                next: (refreshedTimer) => {
                  console.log(
                    'Refreshed timer data after pause:',
                    refreshedTimer.isRunning
                  );

                  // Only update the timer if we still have one
                  if (this.timer) {
                    // Update in place to maintain the reference
                    Object.assign(
                      this.timer,
                      this.processTimerData(refreshedTimer)
                    );
                    this.cdr.detectChanges();
                  }
                },
                error: (err) =>
                  console.error('Error refreshing timer after pause:', err),
              });
            }
          }
        })
      );

      // Set up server resyncs - just like in TimersComponent
      this.setupServerResync();
    } catch (error) {
      console.warn(
        'Could not establish WebSocket connection for timer updates',
        error
      );
      this.setupPollingFallback();
    }
  }

  // Set up server resync exactly like in TimersComponent
  private setupServerResync(): void {
    const RESYNC_INTERVAL = 1000; // Every second - same as TimersComponent

    this.subscriptions.push(
      interval(RESYNC_INTERVAL).subscribe(() => {
        // Only resync if we have a timer and are connected
        if (this.timer && this.isWebSocketConnected && this.timerId) {
          // Request latest timer states
          this.webSocketService.requestTimerUpdates();
        }
      })
    );
  }

  // Fetch timer data and set up subscriptions
  fetchTimerData(): void {
    if (!this.shareId) {
      console.warn('Cannot fetch timer: No shareId available');
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.timerService.getSharedTimer(this.shareId).subscribe({
      next: (timer) => {
        console.log(
          'Fetched timer data:',
          timer._id,
          'Running:',
          timer.isRunning
        );

        // Set the timer ID for later use
        this.timerId = timer._id;

        // Process the timer to calculate correct duration
        this.timer = this.processTimerData(timer);
        this.isLoading = false;

        // If WebSocket is connected, subscribe to updates
        if (this.isWebSocketConnected && this.timerId) {
          this.subscribeToTimerUpdates();
        } else if (!this.isWebSocketConnected) {
          // Set up polling as a fallback
          this.setupPollingFallback();
        }

        // Force change detection to update UI
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching timer:', err);
        this.error = err.message || 'Failed to load timer';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
