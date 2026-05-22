import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge';

/**
 * Role interface
 */
export interface RoleCardData {
  id: string;
  name: string;
  description: string;
  permissionsCount: number;
  usersCount: number;
  isSystem: boolean;
  createdAt: string;
}

/**
 * Role Card Component
 * 
 * Displays a role with its details, stats, and actions.
 * Used in roles list view for consistent role representation.
 * 
 * @example
 * ```html
 * <app-role-card
 *   [role]="roleData"
 *   (cardClicked)="viewRole($event)"
 *   (editClicked)="editRole($event)"
 *   (deleteClicked)="deleteRole($event)">
 * </app-role-card>
 * ```
 * 
 * Features:
 * - System role badge
 * - Permission and user counts
 * - Edit/Delete actions (hidden for system roles)
 * - Created date
 * - Click handling
 * - Hover effects
 */
@Component({
  selector: 'app-role-card',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './role-card.component.html',
  styleUrls: ['./role-card.component.css']
})
export class RoleCardComponent {

  /**
   * Role data to display
   */
  @Input() role!: RoleCardData;

  /**
   * Card clicked event
   */
  @Output() cardClicked = new EventEmitter<RoleCardData>();

  /**
   * Edit button clicked event
   */
  @Output() editClicked = new EventEmitter<RoleCardData>();

  /**
   * Delete button clicked event
   */
  @Output() deleteClicked = new EventEmitter<RoleCardData>();

  /**
   * Handle card click
   */
  onCardClick(): void {
    this.cardClicked.emit(this.role);
  }

  /**
   * Handle edit click
   */
  onEditClick(event: Event): void {
    event.stopPropagation();
    this.editClicked.emit(this.role);
  }

  /**
   * Handle delete click
   */
  onDeleteClick(event: Event): void {
    event.stopPropagation();
    this.deleteClicked.emit(this.role);
  }
}
