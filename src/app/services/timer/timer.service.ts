import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

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
  constructor(private apiService: ApiService) {}

  /**
   * Get all timers
   */
  getAllTimers(): Observable<Timer[]> {
    return this.apiService.get<Timer[]>('/api/timer/list');
  }

  /**
   * Get a specific timer by ID
   */
  getTimerById(id: string): Observable<Timer> {
    return this.apiService.get<Timer>(`/api/timer/${id}`);
  }

  /**
   * Create a new timer
   */
  createTimer(timer: CreateTimerRequest): Observable<Timer> {
    return this.apiService.post<Timer>('/api/timer', timer);
  }

  /**
   * Update a timer
   */
  updateTimer(
    id: string,
    timer: Partial<CreateTimerRequest>
  ): Observable<Timer> {
    return this.apiService.put<Timer>(`/api/timer/${id}`, timer);
  }

  /**
   * Delete a timer
   */
  deleteTimer(id: string): Observable<any> {
    return this.apiService.delete(`/api/timer/${id}`);
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
}
