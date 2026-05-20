import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Stats Card Component
 * 
 * Displays a metric card with title, value, and trend indicator.
 * Used for showing key statistics like total users, active users, etc.
 * 
 * @example
 * ```html
 * <app-stats-card
 *   title="Total users"
 *   [value]="480"
 *   trend="+12%"
 *   variant="default">
 * </app-stats-card>
 * ```
 * 
 * Features:
 * - Multiple variants (default, success, warning, danger)
 * - Optional trend indicator with percentage
 * - Automatic number formatting
 * - Icon support
 * - Responsive design
 */
@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.css']
})
export class StatsCardComponent {

  /**
   * Card title/label
   */
  @Input() title: string = '';

  /**
   * Main metric value (number or string)
   */
  @Input() value: number | string = 0;

  /**
   * Trend indicator (e.g., "+12%", "-5%")
   * Shows with up/down arrow based on positive/negative
   */
  @Input() trend?: string;

  /**
   * Card variant for different visual styles
   * - default: Standard white card
   * - success: Green accent (for positive metrics)
   * - warning: Orange accent (for alerts)
   * - danger: Red accent (for critical items)
   */
  @Input() variant: 'default' | 'success' | 'warning' | 'danger' = 'default';

  /**
   * Optional icon to display
   */
  @Input() icon?: string;

  /**
   * Check if trend is positive (starts with +)
   */
  get isPositiveTrend(): boolean {
    return this.trend?.startsWith('+') || false;
  }

  /**
   * Check if trend is negative (starts with -)
   */
  get isNegativeTrend(): boolean {
    return this.trend?.startsWith('-') || false;
  }

  /**
   * Format large numbers with commas
   */
  get formattedValue(): string {
    if (typeof this.value === 'number') {
      return this.value.toLocaleString();
    }
    return this.value;
  }
}
