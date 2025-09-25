import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { ToastMessage, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toasts" class="toast" [ngClass]="'toast-' + t.type">
        <span class="toast-text">{{ t.text }}</span>
        <button class="toast-close" (click)="dismiss(t.id)">×</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 16px;
        right: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 2000;
      }
      .toast {
        min-width: 280px;
        max-width: 360px;
        padding: 10px 14px;
        border-radius: 8px;
        color: #1a202c;
        background: #edf2f7;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        font-size: 14px;
        border-left: 4px solid #a0aec0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .toast-text {
        flex: 1;
      }
      .toast-close {
        background: transparent;
        border: none;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
        color: #4a5568;
      }
      .toast-close:hover {
        color: #2d3748;
      }
      .toast-success {
        background: #c6f6d5;
        border-left-color: #2f855a;
      }
      .toast-error {
        background: #fed7d7;
        border-left-color: #c53030;
      }
      .toast-info {
        background: #bee3f8;
        border-left-color: #3182ce;
      }
      .toast-warning {
        background: #fefcbf;
        border-left-color: #b7791f;
      }
    `,
  ],
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private sub?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.toasts$.subscribe((t) => {
      this.toasts.push(t);
      const keepId = t.id;
      timer(t.durationMs).subscribe(() => {
        this.toasts = this.toasts.filter((x) => x.id !== keepId);
      });
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((x) => x.id !== id);
  }
}
