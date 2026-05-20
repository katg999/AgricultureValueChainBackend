import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Password strength level
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

/**
 * Password Strength Component
 * 
 * Visual indicator showing password strength.
 * Analyzes password based on length, character variety, and patterns.
 * 
 * @example
 * ```html
 * <app-password-strength
 *   [password]="userPassword"
 *   [showLabel]="true">
 * </app-password-strength>
 * ```
 * 
 * Features:
 * - Real-time strength calculation
 * - Visual progress bars (4 segments)
 * - Strength label (Weak, Medium, Strong, Very Strong)
 * - Color-coded indicators
 * - Password requirements checklist
 */
@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.css']
})
export class PasswordStrengthComponent implements OnChanges {

  /**
   * Password to analyze
   */
  @Input() password: string = '';

  /**
   * Show strength label
   */
  @Input() showLabel: boolean = true;

  /**
   * Current password strength
   */
  strength: PasswordStrength = 'weak';

  /**
   * Strength score (0-4)
   */
  score: number = 0;

  /**
   * Strength label text
   */
  strengthLabel: string = '';

  /**
   * Detect password changes and recalculate strength
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.calculateStrength();
    }
  }

  /**
   * Calculate password strength
   */
  private calculateStrength(): void {
    if (!this.password) {
      this.score = 0;
      this.strength = 'weak';
      this.strengthLabel = '';
      return;
    }

    let score = 0;

    // Length check
    if (this.password.length >= 8) score++;
    if (this.password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(this.password) && /[A-Z]/.test(this.password)) score++;
    if (/\d/.test(this.password)) score++;
    if (/[^a-zA-Z0-9]/.test(this.password)) score++;

    // Cap at 4
    this.score = Math.min(score, 4);

    // Determine strength level
    if (this.score <= 1) {
      this.strength = 'weak';
      this.strengthLabel = 'WEAK PASSWORD';
    } else if (this.score === 2) {
      this.strength = 'medium';
      this.strengthLabel = 'MEDIUM PASSWORD';
    } else if (this.score === 3) {
      this.strength = 'strong';
      this.strengthLabel = 'STRONG PASSWORD';
    } else {
      this.strength = 'very-strong';
      this.strengthLabel = 'VERY STRONG PASSWORD';
    }
  }

  /**
   * Get strength bars (array of 4 with active states)
   */
  get strengthBars(): boolean[] {
    return [
      this.score >= 1,
      this.score >= 2,
      this.score >= 3,
      this.score >= 4
    ];
  }

  /**
   * Check if password meets minimum length
   */
  get hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  /**
   * Check if password has uppercase and lowercase
   */
  get hasMixedCase(): boolean {
    return /[a-z]/.test(this.password) && /[A-Z]/.test(this.password);
  }

  /**
   * Check if password has numbers
   */
  get hasNumbers(): boolean {
    return /\d/.test(this.password);
  }

  /**
   * Check if password has special characters
   */
  get hasSpecialChars(): boolean {
    return /[^a-zA-Z0-9]/.test(this.password);
  }
}
