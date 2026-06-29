import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/**
 * Reusable Input Component
 * 
 * A flexible form input component that integrates with Angular Reactive Forms.
 * Implements ControlValueAccessor for seamless form control binding.
 * Supports validation, error messages, hints, and password visibility toggle.
 * 
 * Features:
 * - Integrates with formControlName directive
 * - Shows validation errors
 * - Password visibility toggle
 * - Optional label with link (e.g., "Forgot password?")
 * - Hint text for user guidance
 * 
 * @example
 * ```html
 * <!-- Basic usage -->
 * <app-input
 *   label="Email Address"
 *   type="email"
 *   placeholder="you@example.com"
 *   formControlName="email"
 *   [required]="true"
 *   [error]="emailError">
 * </app-input>
 * 
 * <!-- Password with forgot link -->
 * <app-input
 *   label="Password"
 *   type="password"
 *   labelLinkText="Forgot password?"
 *   labelLinkRoute="/forgot-password"
 *   formControlName="password"
 *   [required]="true">
 * </app-input>
 * ```
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {

  /**
   * Label text displayed above the input field
   * If empty, no label is shown
   */
  @Input() label = '';

  /**
   * Placeholder text shown when input is empty
   */
  @Input() placeholder = '';

  /**
   * HTML input type attribute
   * Determines keyboard type on mobile and validation behavior
   */
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' = 'text';

  /**
   * Hint text displayed below input (helper text)
   * Only shown when there's no error
   */
  @Input() hint = '';

  /**
   * Error message displayed below input
   * When present, input shows error state styling
   */
  @Input() error = '';

  /**
   * Whether the field is required
   * Displays asterisk (*) next to label
   */
  @Input() required = false;

  /**
   * Whether the input is disabled
   * Prevents user interaction and shows disabled styling
   */
  @Input() disabled = false;

  @Input() uppercase = false;

  @Input() numbersOnly = false;

  /**
   * Optional link text in label (e.g., "Forgot password?")
   * Shown on the right side of the label
   */
  @Input() labelLinkText = '';

  /**
   * Router link for the label link
   * Used with labelLinkText to create clickable link
   */
  @Input() labelLinkRoute = '';

  /**
   * Internal value of the input
   * Synced with Angular forms through ControlValueAccessor
   */
  value = '';

  /**
   * Whether password is currently visible
   * Only applicable for password type inputs
   */
  showPassword = false;

  /**
   * Callback function called when value changes
   * Registered by Angular forms
   */
  onChange = (value: string) => {};

  /**
   * Callback function called when input is touched
   * Registered by Angular forms (triggers validation)
   */
  onTouched = () => {};

  /**
   * Computed input type based on password visibility
   * For password fields, toggles between 'password' and 'text'
   * 
   * @returns The actual input type to use in the template
   */
  get inputType(): string {
    if (this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type;
  }

  /**
   * Handle input value changes
   * Updates internal value and notifies Angular forms
   * 
   * @param event - DOM input event
   */
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let val = target.value;
    if (this.numbersOnly) val = val.replace(/\D/g, '');
    if (this.uppercase) val = val.toUpperCase();
    if (this.numbersOnly || this.uppercase) target.value = val;
    this.value = val;
    this.onChange(this.value);
  }

  /**
   * Handle input blur event
   * Marks field as touched for validation purposes
   */
  onBlur(): void {
    this.onTouched();
  }

  /**
   * Toggle password visibility
   * Switches between showing and hiding password characters
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  //  
  // ControlValueAccessor Implementation
  // Required for Angular forms integration
  //  

  /**
   * Write a new value to the input
   * Called by Angular forms when value changes programmatically
   * 
   * @param value - New value from form control
   */
  writeValue(value: string): void {
    this.value = value || '';
  }

  /**
   * Register onChange callback
   * Called by Angular forms to register value change handler
   * 
   * @param fn - Callback function to call on value change
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Register onTouched callback
   * Called by Angular forms to register touch handler
   * 
   * @param fn - Callback function to call when input is touched
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Set disabled state
   * Called by Angular forms when control is enabled/disabled
   * 
   * @param isDisabled - Whether the input should be disabled
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}