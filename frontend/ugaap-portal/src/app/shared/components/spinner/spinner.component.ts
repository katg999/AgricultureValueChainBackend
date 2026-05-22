import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable Spinner Component
 * 
 * A loading spinner that can be used standalone or inside buttons.
 * Supports different sizes and colors to match various UI contexts.
 * 
 * Features:
 * - Three size variants (sm, md, lg)
 * - Three color variants (white, orange, grey)
 * - Pure CSS animation (no images)
 * - Accessible with proper ARIA attributes
 * 
 * @example
 * ```html
 * <!-- Small white spinner (for buttons) -->
 * <app-spinner size="sm" color="white"></app-spinner>
 * 
 * <!-- Medium orange spinner (for content loading) -->
 * <app-spinner size="md" color="orange"></app-spinner>
 * 
 * <!-- Large grey spinner (for page loading) -->
 * <app-spinner size="lg" color="grey"></app-spinner>
 * ```
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css'
})
export class SpinnerComponent {
  /**
   * Size of the spinner
   * - sm: 14px diameter (for buttons and compact UI)
   * - md: 20px diameter (default, for content areas)
   * - lg: 32px diameter (for page-level loading)
   */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Color variant of the spinner
   * - white: For use on colored backgrounds (buttons, overlays)
   * - orange: Default brand color (uses var(--primary))
   * - grey: Subtle loading state
   */
  @Input() color: 'white' | 'orange' | 'grey' = 'orange';

  /**
   * Compute CSS classes based on size and color
   * 
   * @returns Space-separated string of CSS class names
   */
  get classes(): string {
    return `spinner spinner-${this.size} spinner-${this.color}`;
  }
}