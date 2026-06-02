import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Alert Component
 * 
 * Displays contextual alert messages (errors, warnings, info, success).
 * Used for form validation errors, info messages, and user feedback.
 * 
 * Features:
 * - Four variants: error, warning, info, success
 * - Optional icon display
 * - Auto-dismissed via parent component
 * 
 * @example
 * ```html
 * <!-- Error message -->
 * <app-alert 
 *   variant="error" 
 *   [message]="errorMessage"
 *   *ngIf="errorMessage">
 * </app-alert>
 * 
 * <!-- Info message with custom content -->
 * <app-alert variant="info">
 *   <p>Your session will expire in 5 minutes</p>
 * </app-alert>
 * ```
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent {
  /**
   * Visual variant of the alert
   * - error: Red - for validation errors and failures
   * - warning: Yellow - for cautionary messages
   * - info: Blue - for informational messages
   * - success: Green - for success confirmations
   */
  @Input() variant: 'error' | 'warning' | 'info' | 'success' = 'error';

  /**
   * Alert message text
   * If provided, displays as text content
   * Can also use ng-content for rich HTML
   */
  @Input() message = '';

  /**
   * Whether to show icon
   * Icons are contextual based on variant
   */
  @Input() showIcon = true;

  /**
   * Get icon based on variant
   * 
   * @returns Icon character/emoji for the variant
   */
  get icon(): string {
    const icons = {
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      success: '✓'
    };
    return icons[this.variant];
  }

  /**
   * Compute CSS classes based on variant
   * 
   * @returns Space-separated string of CSS class names
   */
  get alertClasses(): string {
    return `alert alert-${this.variant}`;
  }
}
