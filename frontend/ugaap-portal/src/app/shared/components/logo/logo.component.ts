import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UGAAP Logo Component
 * 
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.css']
})
export class LogoComponent {
  /**
   * Size variant of the logo
   * - sm: Compact (32px icon)
   * - md: Standard (48px icon) - Default for auth pages
   * - lg: Large (56px icon)
   */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether to show the subtitle "Uganda Agrarian Portal"
   * Default: true
   */
  @Input() showSubtitle = true;

  /**
   * Compute CSS classes based on size
   * 
   * @returns Space-separated string of CSS class names
   */
  get logoClasses(): string {
    return `logo-container logo-${this.size}`;
  }
}