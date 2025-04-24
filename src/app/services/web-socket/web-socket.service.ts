import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environment';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { STORAGE_KEYS } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket!: Socket;
  private messageSubject = new Subject<any>();
  private connectedSubject = new BehaviorSubject<boolean>(false);

  constructor(private localStorageService: LocalStorageService) {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    const token = this.localStorageService.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      console.warn('No auth token found for WebSocket connection');
      return;
    }

    // Connect to Socket.IO server with auth token
    const socketUrl = environment.apiUrl.replace(/\/api$/, '');
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connectedSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connectedSubject.next(false);
    });

    // Handle timer-specific events
    this.socket.on('timerUpdate', (timer) => {
      this.messageSubject.next({
        type: 'timerUpdate',
        data: timer,
      });
    });

    this.socket.on('timerDeleted', (data) => {
      this.messageSubject.next({
        type: 'timerDeleted',
        data,
      });
    });
  }

  /**
   * Get connection status as Observable
   */
  public connectionStatus(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  /**
   * Subscribe to a specific timer to receive updates
   */
  public subscribeToTimer(timerId: string): void {
    if (this.socket && this.connectedSubject.value) {
      this.socket.emit('subscribeToTimer', { timerId });
    }
  }

  /**
   * Subscribe to all user timers
   */
  public subscribeToUserTimers(): void {
    if (this.socket && this.connectedSubject.value) {
      this.socket.emit('subscribeToUserTimers');
    }
  }

  /**
   * Generic message handler
   */
  public onMessage<T>(eventName: string): Observable<T> {
    return new Observable<T>((observer) => {
      if (this.socket) {
        this.socket.on(eventName, (data: T) => {
          observer.next(data);
        });
      }

      return () => {
        if (this.socket) {
          this.socket.off(eventName);
        }
      };
    });
  }

  /**
   * Get timer updates as Observable
   */
  public onTimerUpdate(): Observable<any> {
    return this.messageSubject.pipe(
      filter((message) => message.type === 'timerUpdate'),
      map((message) => message.data)
    );
  }

  /**
   * Listen specifically for timer pause events
   */
  public onTimerPaused(): Observable<string> {
    return this.onMessage<{ timerId: string; event: string }>(
      'timerEvent'
    ).pipe(
      filter((data) => data.event === 'paused'),
      map((data) => data.timerId)
    );
  }

  /**
   * Get timer deletion events as Observable
   */
  public onTimerDeleted(): Observable<any> {
    return this.messageSubject.pipe(
      filter((message) => message.type === 'timerDeleted'),
      map((message) => message.data)
    );
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Request updated timer states from the server
   */
  public requestTimerUpdates(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('requestTimerUpdates');
    }
  }

  /**
   * Specific handler for timer state changes
   */
  public onTimerStateChange(): Observable<any> {
    return this.onMessage('timerUpdate').pipe(
      map((data) => {
        console.log('Timer update received via WebSocket:', data);
        return data;
      })
    );
  }
}
