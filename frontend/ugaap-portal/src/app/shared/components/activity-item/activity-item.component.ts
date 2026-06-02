// shared/components/activity-item/activity-item.component.ts
//
// Single entry in an activity / audit feed.
// Usage:
//   <app-activity-item [data]="{ title: 'Agnes Owino registered', ... }">
//   </app-activity-item>

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActivityData {
  title: string;
  subtitle: string;
  timestamp: string;
  action?: string;
  actionIcon?: string;
  color?: string;
}

@Component({
  selector: 'app-activity-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-item">
      <div class="activity-dot" [style.background-color]="data.color || '#F25D27'"></div>
      <div class="activity-content">
        <div class="activity-header">
          <div class="activity-title">{{ data.title }}</div>
          <div class="activity-timestamp">{{ data.timestamp }}</div>
        </div>
        <div class="activity-subtitle">{{ data.subtitle }}</div>
        <button class="activity-action" *ngIf="data.action">
          {{ data.action }}
          <span *ngIf="data.actionIcon">{{ data.actionIcon }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .activity-item {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #F9FAFB;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 4px;
      gap: 8px;
    }

    .activity-title {
      font-weight: 600;
      color: #200B26;
      font-size: 14px;
    }

    .activity-timestamp {
      font-size: 12px;
      color: #9CA3AF;
      font-family: 'IBM Plex Mono', monospace;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .activity-subtitle {
      font-size: 13px;
      color: #6B7280;
      margin-bottom: 8px;
    }

    .activity-action {
      font-size: 13px;
      color: #F25D27;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .activity-action:hover {
      text-decoration: underline;
    }
  `]
})
export class ActivityItemComponent {
  @Input() data!: ActivityData;
}
