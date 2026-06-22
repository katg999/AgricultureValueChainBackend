// shared/components/progress-bar/progress-bar.component.ts
//
// Reusable progress bar.
// Usage:
//   <app-progress-bar [percentage]="75" variant="success"></app-progress-bar>

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-wrapper">
      <div class="progress-bar" [class]="'variant-' + variant">
        <div
          class="progress-fill"
          [style.width.%]="percentage">
        </div>
      </div>
      <div class="progress-label" *ngIf="showLabel">
        {{ percentage }}%
      </div>
    </div>
  `,
  styles: [`
    .progress-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #F3F4F6;
      border-radius: 8px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 8px;
    }

    .variant-success .progress-fill { background: #10B981; }
    .variant-warning .progress-fill { background: #F59E0B; }
    .variant-info    .progress-fill { background: #3B82F6; }
    .variant-primary .progress-fill { background: #F25D27; }

    .progress-label {
      font-size: 13px;
      font-weight: 600;
      color: #6B7280;
      min-width: 45px;
      text-align: right;
    }
  `]
})
export class ProgressBarComponent {
  @Input() percentage: number = 0;
  @Input() variant: 'success' | 'warning' | 'info' | 'primary' = 'primary';
  @Input() showLabel: boolean = true;
}
