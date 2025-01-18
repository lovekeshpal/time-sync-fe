import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  keyExists(key: string): boolean {
    if (this.isBrowser) {
      return localStorage.getItem(key) !== null;
    }
    return false;
  }

  setItem(key: string, value: any): void {
    if (this.isBrowser) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  getItem(key: string): any {
    if (this.isBrowser && this.keyExists(key)) {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } else {
      console.warn(`Key: "${key}" does not exist`);
      return null;
    }
  }

  removeItem(key: string): void {
    if (this.isBrowser && this.keyExists(key)) {
      localStorage.removeItem(key);
    } else {
      console.warn(`Key: "${key}" does not exist`);
    }
  }

  clear(): void {
    if (this.isBrowser) {
      localStorage.clear();
    }
  }
}