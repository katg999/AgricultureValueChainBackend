import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Info Card Component
 * 
 * Container card for grouping related information with icon and title.
 * Used for sections like "Personal Details", "Account Access", etc.
 * 
 * @example
 * ```html
 * <app-info-card
 *   title="Personal Details"
 *   <p>Card content goes here</p>
 * </app-info-card>
 * ```
 * 
 * Features:
 * - Optional icon
 * - Content projection (ng-content)
 * - Clean section separator
 * - Responsive design
 */
@Component({
  selector: 'app-info-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-card.component.html',
  styleUrls: ['./info-card.component.css']
})
export class InfoCardComponent {

  /**
   * Card title
   */
  @Input() title: string = '';

  /**
   * Optional icon (emoji or icon class)
   */
  @Input() icon?: string;

  /**
   * Show divider line below header
   */
  @Input() showDivider: boolean = true;
}
