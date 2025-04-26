import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private showHeader = new BehaviorSubject<boolean>(true);

  getHeaderVisibility(): Observable<boolean> {
    return this.showHeader.asObservable();
  }

  setHeaderVisibility(isVisible: boolean): void {
    this.showHeader.next(isVisible);
  }
}
