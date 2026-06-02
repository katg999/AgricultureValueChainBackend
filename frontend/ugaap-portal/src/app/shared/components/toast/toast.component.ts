import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          [class]="'toast toast--' + toast.variant"
          role="alert"
          [attr.aria-label]="toast.title">

          <!-- Icon -->
          <div class="toast-icon">
            @switch (toast.variant) {
              @case ('success') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              }
              @case ('error') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              }
              @case ('warning') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
              @case ('info') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              }
            }
          </div>

          <!-- Body -->
          <div class="toast-body">
            <p class="toast-title">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="toast-message">{{ toast.message }}</p>
            }
          </div>

          <!-- Dismiss button -->
          <button
            class="toast-close"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Dismiss notification">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <!-- Auto-dismiss progress bar -->
          <div class="toast-progress"
            [style.animation-duration]="toast.duration + 'ms'">
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    /* ── Container — fixed top-right, stacked ────────────────── */
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 360px;
      max-width: calc(100vw - 32px);
      pointer-events: none;
    }

    /* ── Individual toast card ───────────────────────────────── */
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(110%); }
      to   { opacity: 1; transform: translateX(0);    }
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 14px 14px 16px;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 8px 28px rgba(32, 11, 38, 0.14), 0 2px 8px rgba(32, 11, 38, 0.08);
      border-left: 4px solid;
      position: relative;
      overflow: hidden;
      pointer-events: all;
      animation: slideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* Variant border + icon colours */
    .toast--success { border-left-color: #10B981; }
    .toast--error   { border-left-color: #EF4444; }
    .toast--warning { border-left-color: #F59E0B; }
    .toast--info    { border-left-color: #3B82F6; }

    /* ── Icon circle ─────────────────────────────────────────── */
    .toast-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast--success .toast-icon { background: #D1FAE5; color: #059669; }
    .toast--error   .toast-icon { background: #FEE2E2; color: #DC2626; }
    .toast--warning .toast-icon { background: #FEF3C7; color: #D97706; }
    .toast--info    .toast-icon { background: #DBEAFE; color: #2563EB; }

    /* ── Body text ───────────────────────────────────────────── */
    .toast-body {
      flex: 1;
      min-width: 0;
      padding-top: 2px;
    }

    .toast-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 2px;
      line-height: 1.3;
    }

    .toast-message {
      font-size: 13px;
      color: #6B7280;
      margin: 0;
      line-height: 1.4;
      word-break: break-word;
    }

    /* ── Close button ────────────────────────────────────────── */
    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #9CA3AF;
      padding: 2px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 0;
      transition: color 0.15s, background 0.15s;
    }

    .toast-close:hover {
      color: #374151;
      background: #F3F4F6;
    }

    /* ── Progress bar — shrinks left-to-right over duration ──── */
    @keyframes progressShrink {
      from { width: 100%; }
      to   { width: 0%;   }
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      border-radius: 0 0 0 12px;
      animation: progressShrink linear both;
    }

    .toast--success .toast-progress { background: #10B981; }
    .toast--error   .toast-progress { background: #EF4444; }
    .toast--warning .toast-progress { background: #F59E0B; }
    .toast--info    .toast-progress { background: #3B82F6; }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);
}
