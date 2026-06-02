import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge';

/**
 * User interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
  verified?: boolean;
  selected?: boolean;
}

/**
 * User Card Component
 * 
 * Displays user information in a card format with avatar, name, email, and actions.
 * Used for admin selection, user lists, and member management.
 * 
 * Features:
 * - User avatar (initials or image)
 * - Name, email, phone display
 * - Role badge
 * - Verified indicator
 * - Selectable state
 * - Action buttons (select, remove)
 * - Click events
 * 
 * @example
 * ```typescript
 * user: User = {
 *   id: '1',
 *   name: 'Nakato Mariam',
 *   email: 'mariam.n@mubende-coop.ug',
 *   phone: '+256 782 445 992',
 *   verified: true,
 *   selected: false
 * };
 * ```
 * 
 * ```html
 * <app-user-card 
 *   [user]="user"
 *   [selectable]="true"
 *   (selected)="onUserSelected($event)"
 *   (removed)="onUserRemoved($event)">
 * </app-user-card>
 * ```
 */
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.css']
})
export class UserCardComponent {
  /**
   * User data to display
   */
  @Input() user!: User;

  /**
   * Show select button/checkbox
   */
  @Input() selectable = false;

  /**
   * Show remove button
   */
  @Input() removable = false;

  /**
   * Disabled state
   */
  @Input() disabled = false;

  /**
   * Event emitted when user is selected
   */
  @Output() selected = new EventEmitter<User>();

  /**
   * Event emitted when user is removed
   */
  @Output() removed = new EventEmitter<User>();

  /**
   * Event emitted when card is clicked
   */
  @Output() clicked = new EventEmitter<User>();

  /**
   * Handle select action
   */
  onSelect(): void {
    if (!this.disabled) {
      this.selected.emit(this.user);
    }
  }

  /**
   * Handle remove action
   */
  onRemove(): void {
    if (!this.disabled) {
      this.removed.emit(this.user);
    }
  }

  /**
   * Handle card click
   */
  onClick(): void {
    if (!this.disabled) {
      this.clicked.emit(this.user);
    }
  }

  /**
   * Get user initials for avatar
   */
  get initials(): string {
    const names = this.user.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return this.user.name.substring(0, 2);
  }

  /**
   * Get card classes
   */
  get cardClasses(): string {
    const classes = ['user-card'];
    if (this.user.selected) classes.push('user-card-selected');
    if (this.disabled) classes.push('user-card-disabled');
    return classes.join(' ');
  }
}
