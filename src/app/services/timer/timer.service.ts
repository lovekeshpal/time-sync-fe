import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { WebSocketService } from '../web-socket/web-socket.service';

export interface Timer {
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

export interface CreateTimerRequest {
  name: string;
  description: string;
  duration: number;
  isPublic: boolean;
  showMilliseconds: boolean;
  theme: string;
}

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private timers = new BehaviorSubject<Timer[]>([]);

  constructor(
    private apiService: ApiService,
    private wsService: WebSocketService
  ) {
    // Setup WebSocket listeners when the service is created
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    // Listen for individual timer updates
    this.wsService.onMessage<any>('timerUpdate').subscribe((data) => {
      console.log('Timer update received:', data);

      // Check if we have a single timer or array
      if (Array.isArray(data)) {
        // Multiple timers update
        const currentTimers = this.timers.getValue();

        // Update all timers that match
        data.forEach((updatedTimer) => {
          const index = currentTimers.findIndex(
            (t) => t._id === updatedTimer._id
          );
          if (index !== -1) {
            currentTimers[index] = { ...updatedTimer };
          }
        });

        this.timers.next([...currentTimers]);
      } else {
        // Single timer update
        this.updateTimerInList(data);
      }
    });

    // Listen for timer deletion events
    this.wsService
      .onMessage<{ timerId: string }>('timerDeleted')
      .subscribe((data) => {
        const currentTimers = this.timers.getValue();
        this.timers.next(currentTimers.filter((t) => t._id !== data.timerId));
      });
  }

  /**
   * Get all timers
   */
  getAllTimers(): Observable<Timer[]> {
    return this.apiService.get<Timer[]>('/api/timer/list').pipe(
      tap((timers) => {
        this.timers.next(timers);

        // Subscribe to WebSocket updates for all user timers
        this.wsService.subscribeToUserTimers();
      }),
      catchError((err) => {
        console.error('Error loading timers:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Get a specific timer by ID
   */
  getTimerById(id: string): Observable<Timer> {
    return this.apiService.get<Timer>(`/api/timer/${id}`).pipe(
      tap((timer) => {
        // Subscribe to WebSocket updates for this specific timer
        this.wsService.subscribeToTimer(timer._id);
      })
    );
  }

  /**
   * Get a shared timer by shareId
   */
  getSharedTimer(shareId: string): Observable<Timer> {
    return this.apiService
      .get<Timer>(`/api/timer/share/${shareId}`, undefined, false)
      .pipe(
        tap((timer) => {
          // Subscribe to WebSocket updates for this specific timer
          this.wsService.subscribeToTimer(timer._id);
        })
      );
  }

  /**
   * Create a new timer
   */
  createTimer(timer: CreateTimerRequest): Observable<Timer> {
    return this.apiService.post<Timer>('/api/timer', timer);
  }

  /**
   * Start a timer
   */
  startTimer(id: string): Observable<Timer> {
    return this.apiService.put<Timer>(`/api/timer/start/${id}`);
  }

  /**
   * Pause a timer
   */
  pauseTimer(id: string): Observable<Timer> {
    return this.apiService.put<Timer>(`/api/timer/pause/${id}`);
  }

  /**
   * Reset a timer
   */
  resetTimer(id: string): Observable<Timer> {
    return this.apiService.put<Timer>(`/api/timer/reset/${id}`);
  }

  /**
   * Delete a timer
   */
  deleteTimer(id: string): Observable<any> {
    return this.apiService.delete(`/api/timer/${id}`);
  }

  /**
   * Get the current list of timers as Observable
   */
  getTimersObservable(): Observable<Timer[]> {
    return this.timers.asObservable();
  }

  /**
   * Update a timer in the local list when receiving WebSocket updates
   */
  private updateTimerInList(updatedTimer: any): void {
    const currentTimers = this.timers.getValue();
    const index = currentTimers.findIndex((t) => t._id === updatedTimer._id);

    if (index !== -1) {
      // Calculate the correct remaining time from server data
      let calculatedDuration = updatedTimer.duration;

      // For running timers, adjust for time passed since the update was sent
      if (updatedTimer.isRunning && updatedTimer.startTime) {
        const startTime = new Date(updatedTimer.startTime).getTime();
        const now = new Date().getTime();
        const elapsedSinceStart = Math.floor((now - startTime) / 1000);

        calculatedDuration = Math.max(
          0,
          updatedTimer.duration - (updatedTimer.pausedAt + elapsedSinceStart)
        );
      } else if (!updatedTimer.isRunning) {
        // For paused timers
        calculatedDuration = Math.max(
          0,
          updatedTimer.duration - updatedTimer.pausedAt
        );
      }

      // Update the timer with server values + calculated duration
      currentTimers[index] = {
        ...updatedTimer,
        duration: calculatedDuration,
        originalDuration: updatedTimer.duration,
      };

      this.timers.next([...currentTimers]);
    }
  }
}
