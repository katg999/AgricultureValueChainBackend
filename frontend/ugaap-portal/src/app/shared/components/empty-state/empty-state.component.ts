import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="empty-state-wrap">
      <div class="empty-icon-ring">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round">
          <path [attr.d]="iconPath"></path>
        </svg>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message" *ngIf="message">{{ message }}</p>

      <!-- routerLink path takes priority; falls back to (actionClick) for programmatic/relative nav -->
      <a *ngIf="actionLabel && route"
         class="empty-action"
         [routerLink]="route">
        {{ actionLabel }}
      </a>
      <button *ngIf="actionLabel && !route"
              class="empty-action"
              type="button"
              (click)="actionClick.emit()">
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .empty-state-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #FEF3F2;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      color: #F25D27;
    }

    .empty-title {
      font-size: 17px;
      font-weight: 600;
      color: #200B26;
      margin: 0 0 8px;
    }

    .empty-message {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 24px;
      max-width: 320px;
      line-height: 1.5;
    }

    .empty-action {
      display: inline-block;
      background: #F25D27;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    .empty-action:hover { background: #d94e1e; transform: translateY(-1px); }
    .empty-action:active { transform: translateY(0); }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'box';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
  @Input() actionLabel = '';
  /** Absolute route path — when set, renders an <a [routerLink]> instead of a button */
  @Input() route: string | null = null;
  @Output() actionClick = new EventEmitter<void>();

  private readonly iconMap: Record<string, string> = {
    'building':  'M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M6 19h.01M10 11h.01M10 15h.01M10 19h.01M14 11h.01M14 15h.01M14 19h.01M18 11h.01M18 15h.01M18 19h.01M3 7l9-4 9 4',
    'users':     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    'truck':     'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    'clipboard': 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
    'box':       'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    'clock':     'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
    'chart':     'M18 20V10M12 20V4M6 20v-6',
    'wallet':    'M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
    'shield':    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'settings':  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    'farmer':    'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 20c0-4 4-7 10-7s10 3 10 7',
    'scale':     'M12 3v18M3 7l9-4 9 4M3 7v4l9 4 9-4V7',
    'alert':     'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
    'check':     'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
    'file':      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  };

  get iconPath(): string {
    return this.iconMap[this.icon] ?? this.iconMap['box'];
  }
}
