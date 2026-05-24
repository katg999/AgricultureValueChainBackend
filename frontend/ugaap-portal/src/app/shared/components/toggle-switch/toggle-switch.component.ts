import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Toggle Switch Component
 * 
 * iOS-style toggle switch for boolean values.
 * Works with Angular forms (ngModel, formControlName).
 * 
 * @example
 * ```html
 * <app-toggle-switch
 *   label="Send welcome email"
 *   [(ngModel)]="sendEmail"
 *   [disabled]="false">
 * </app-toggle-switch>
 * ```
 * 
 * Features:
 * - Angular forms integration (ControlValueAccessor)
 * - Optional label and description
 * - Disabled state
 * - Smooth animations
 * - Keyboard accessible
 */
@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-switch.component.html',
  styleUrls: ['./toggle-switch.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleSwitchComponent),
      multi: true
    }
  ]
})
export class ToggleSwitchComponent implements ControlValueAccessor {

  /**
   * Label text
   */
  @Input() label?: string;

  /**
   * Description text (shown below label)
   */
  @Input() description?: string;

  /**
   * Disabled state
   */
  @Input() disabled: boolean = false;

  /**
   * Checked state change event
   */
  @Output() checkedChange = new EventEmitter<boolean>();

  /**
   * Internal checked state
   */
  private _checked: boolean = false;

  /**
   * Get checked state
   */
  get checked(): boolean {
    return this._checked;
  }

  /**
   * Set checked state
   */
  set checked(value: boolean) {
    if (this._checked !== value) {
      this._checked = value;
      this.onChange(value);
      this.checkedChange.emit(value);
    }
  }

  /**
   * ControlValueAccessor callbacks
   */
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * Write value from form control
   */
  writeValue(value: boolean): void {
    this._checked = value;
  }

  /**
   * Register change callback
   */
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  /**
   * Register touched callback
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Set disabled state
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Toggle the switch
   */
  toggle(): void {
    if (!this.disabled) {
      this.checked = !this.checked;
      this.onTouched();
    }
  }
}
