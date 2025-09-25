import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
  durationMs: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  toasts$ = this.toastSubject.asObservable();

  show(text: string, type: ToastType = 'info', durationMs = 5000) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.toastSubject.next({ id, type, text, durationMs });
  }
}
