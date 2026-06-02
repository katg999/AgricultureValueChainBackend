import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id:       number;
  variant:  ToastVariant;
  title:    string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  readonly toasts = signal<Toast[]>([]);

  private nextId = 0;

  // ── Public API ────────────────────────────────────────────────────────────

  success(title: string, message?: string, duration = 4000): void {
    this._push('success', title, message, duration);
  }

  error(title: string, message?: string, duration = 6000): void {
    this._push('error', title, message, duration);
  }

  warning(title: string, message?: string, duration = 5000): void {
    this._push('warning', title, message, duration);
  }

  info(title: string, message?: string, duration = 4000): void {
    this._push('info', title, message, duration);
  }

  dismiss(id: number): void {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private _push(variant: ToastVariant, title: string, message?: string, duration = 4000): void {
    const id = ++this.nextId;
    this.toasts.update(ts => [...ts, { id, variant, title, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
