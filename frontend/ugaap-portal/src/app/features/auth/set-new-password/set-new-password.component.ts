import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Shared reusable components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

/**
 * Set New Password Component
 * 
 * Allows users to create a new password after forgot password flow.
 * Includes real-time password strength validation with visual criteria.
 * 
 * Flow:
 * 1. User enters new password
 * 2. Real-time validation against criteria
 * 3. Confirm password match
 * 4. Submit and return to login
 * 
 * Password Criteria:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 * 
 * Components Used:
 * - LogoComponent: UGAAP branding
 * - InputComponent: Password fields
 * - ButtonComponent: Submit button
 * - Custom criteria box (unique to this page)
 */
@Component({
  selector: 'app-set-new-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LogoComponent,
    InputComponent,
    ButtonComponent
  ],
  templateUrl: './set-new-password.component.html',
  styleUrl: './set-new-password.component.css'
})
export class SetNewPasswordComponent implements OnInit {

  /**
   * Reactive form for password reset
   * Contains newPassword and confirmPassword controls
   */
  passwordForm!: FormGroup;

  /**
   * Loading state during password update
   */
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize password form with validators
    this.passwordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      confirmPassword: ['', Validators.required]
    });
  }

  /**
   * Get current password value for criteria checking
   * 
   * @returns Password string or empty string
   */
  get password(): string {
    return this.passwordForm.get('newPassword')?.value || '';
  }

  /**
   * Password criteria validation
   * Real-time checks against password requirements
   * 
   * @returns Object with boolean flags for each criterion
   */
  get criteria() {
    return {
      length: this.password.length >= 8,
      number: /\d/.test(this.password),
      uppercase: /[A-Z]/.test(this.password),
      special: /[^A-Za-z0-9]/.test(this.password)
    };
  }

  /**
   * Check if all password criteria are met
   * Used to enable/disable submit button
   * 
   * @returns true if all criteria met, false otherwise
   */
  get allCriteriaMet(): boolean {
    return Object.values(this.criteria).every(v => v);
  }

  /**
   * Get new password field error message
   * 
   * @returns Error message string or empty string
   */
  getNewPasswordError(): string {
    const control = this.passwordForm.get('newPassword');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'New password is required';
      if (control.errors['minlength']) return 'Password must be at least 8 characters';
    }
    return '';
  }

  /**
   * Get confirm password field error message
   * 
   * @returns Error message string or empty string
   */
  getConfirmPasswordError(): string {
    const control = this.passwordForm.get('confirmPassword');
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = control?.value;

    if (control?.touched) {
      if (control.errors?.['required']) {
        return 'Please confirm your password';
      }
      if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  /**
   * Handle form submission
   * Validates all criteria and passwords match
   * 
   * TODO: Replace setTimeout with actual API call
   * Example: this.authService.resetPassword(this.passwordForm.value).subscribe(...)
   */
  onSubmit(): void {
    // Validate all criteria are met
    if (this.passwordForm.invalid || !this.allCriteriaMet) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    // Check passwords match
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      return;
    }

    this.isLoading = true;

    // Temporary simulation - Replace with actual API call
    setTimeout(() => {
      this.isLoading = false;
      // On success, return to login
      this.router.navigate(['/auth/login']);
    }, 1200);
  }
}
