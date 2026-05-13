import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Step interface for stepper
 */
export interface Step {
  label: string;
  number: string;
  completed?: boolean;
}

/**
 * Stepper Component
 * 
 * Progress indicator for multi-step processes like onboarding.
 * Shows current step, completed steps, and upcoming steps.
 * 
 * Features:
 * - Horizontal progress bar
 * - Step labels and numbers
 * - Completed/active/upcoming states
 * - Responsive design
 * 
 * @example
 * ```typescript
 * steps: Step[] = [
 *   { label: 'PROFILE', number: '01', completed: true },
 *   { label: 'ADMIN', number: '02', completed: false },
 *   { label: 'INVENTORY', number: '03', completed: false },
 *   { label: 'REVIEW', number: '04', completed: false }
 * ];
 * ```
 * 
 * ```html
 * <app-stepper [steps]="steps" [currentStep]="1"></app-stepper>
 * ```
 */
@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.css']
})
export class StepperComponent {
  /**
   * Array of steps to display
   */
  @Input() steps: Step[] = [];

  /**
   * Current active step index (0-based)
   */
  @Input() currentStep = 0;

  /**
   * Check if step is completed
   */
  isCompleted(index: number): boolean {
    return index < this.currentStep || this.steps[index]?.completed === true;
  }

  /**
   * Check if step is active
   */
  isActive(index: number): boolean {
    return index === this.currentStep;
  }

  /**
   * Get step state class
   */
  getStepClass(index: number): string {
    if (this.isCompleted(index)) return 'step-completed';
    if (this.isActive(index)) return 'step-active';
    return 'step-upcoming';
  }
}
