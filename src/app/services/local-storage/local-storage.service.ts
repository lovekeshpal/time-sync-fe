import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  private isLocalStorageAvailable(): boolean {
    return typeof localStorage !== 'undefined';
  }

  setItem(key: string, value: any): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      console.warn('localStorage is not available');
    }
  }

  getItem(key: string): any {
    if (this.isLocalStorageAvailable()) {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } else {
      console.warn('localStorage is not available');
      return null;
    }
  }

  removeItem(key: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    } else {
      console.warn('localStorage is not available');
    }
  }

  clear(): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.clear();
    } else {
      console.warn('localStorage is not available');
    }
  }
}