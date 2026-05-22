import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../spinner/spinner.component';

/**
 * Reusable Button Component
 * 
 * A flexible button component that supports multiple variants, sizes, and states.
 * Integrates with the UGAAP design system using CSS variables.
 * 
 * @example
 * ```html
 * <!-- Primary button -->
 * <app-button variant="primary" (clicked)="onLogin()">
 *   Sign In
 * </app-button>
 * 
 * <!-- Loading state -->
 * <app-button variant="primary" [loading]="isSubmitting" loadingText="Signing in...">
 *   Sign In
 * </app-button>
 * 
 * <!-- With icons -->
 * <app-button variant="secondary" iconLeft="📧" iconRight="→">
 *   Send Email
 * </app-button>
 * ```
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  /**
   * Visual style variant of the button
   * - primary: Orange background (main CTAs) - uses var(--primary)
   * - secondary: White background with border
   * - ghost: Transparent background
   * - danger: Red tint (destructive actions)
   * - warning: Yellow tint (caution actions)
   */
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' = 'primary';

  /**
   * Size of the button
   * - sm: 32px height (compact UI)
   * - md: 40px height (default)
   * - lg: 48px height (prominent actions)
   */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether button should take full width of its container
   * Useful for mobile layouts and form buttons
   */
  @Input() fullWidth = false;

  /**
   * Loading state - shows spinner and disables interaction
   * Use when button triggers async operations (API calls, etc.)
   */
  @Input() loading = false;

  /**
   * Disabled state - prevents user interaction
   * Use for validation states or when action is unavailable
   */
  @Input() disabled = false;

  /**
   * HTML button type attribute
   * - button: Default clickable button
   * - submit: Submits form when clicked
   * - reset: Resets form when clicked
   */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Icon to display on the left side of button text
   * Can be emoji, icon font class, or SVG
   */
  @Input() iconLeft = '';

  /**
   * Icon to display on the right side of button text
   * Can be emoji, icon font class, or SVG
   */
  @Input() iconRight = '';

  /**
   * Text to display when button is in loading state
   * Defaults to "Please wait..." if not provided
   */
  @Input() loadingText = 'Please wait...';

  /**
   * Event emitted when button is clicked
   * Only fires when button is not disabled or loading
   */
  @Output() clicked = new EventEmitter<void>();

  /**
   * Handle button click events
   * Prevents emission if button is disabled or loading
   */
  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }

  /**
   * Compute CSS classes based on current button state
   * Combines variant, size, and state classes
   * 
   * @returns Space-separated string of CSS class names
   */
  get classes(): string {
    return [
      'btn',
      `btn-${this.variant}`,
      `btn-${this.size}`,
      this.fullWidth ? 'btn-full' : '',
      this.loading ? 'btn-loading' : '',
      this.disabled ? 'btn-disabled' : ''
    ].filter(Boolean).join(' ');
  }
}