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
import { AlertComponent } from '../../../shared/components/alert/alert.component';

/**
 * Forgot Password Component
 * 
 * First step in password recovery flow.
 * Collects user's email or phone number and sends verification code.
 * 
 * Flow:
 * 1. User enters email or phone
 * 2. System sends OTP code
 * 3. Navigate to reset-otp verification
 * 
 * Features:
 * - Accepts email or phone number
 * - Form validation
 * - Loading states
 * - Error handling
 * 
 * Components Used:
 * - LogoComponent: UGAAP branding
 * - AlertComponent: Error messages
 * - InputComponent: Email/phone field
 * - ButtonComponent: Submit button
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LogoComponent,
    InputComponent,
    ButtonComponent,
    AlertComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit {

  /**
   * Reactive form for password recovery
   * Contains emailOrPhone control with validation
   */
  forgotForm!: FormGroup;

  /**
   * Loading state during code sending
   */
  isLoading = false;

  /**
   * Error message to display
   * Shown when code sending fails
   */
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize forgot password form
    this.forgotForm = this.fb.group({
      emailOrPhone: ['', [Validators.required]]
    });
  }

  /**
   * Handle form submission
   * Sends verification code to provided email/phone
   * 
   * TODO: Replace setTimeout with actual API call
   * Example: this.authService.sendResetCode(emailOrPhone).subscribe(...)
   */
  onSubmit(): void {
    // Mark field as touched to trigger validation display
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Temporary simulation - Replace with actual API call
    setTimeout(() => {
      this.isLoading = false;
      // On success, navigate to reset OTP verification
      this.router.navigate(['/auth/reset-otp']);
    }, 1200);
  }

  /**
   * Get email/phone field error message
   * Used in template to display contextual validation errors
   * 
   * @returns Error message string or empty string if no error
   */
  getEmailOrPhoneError(): string {
    const control = this.forgotForm.get('emailOrPhone');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Email or phone number is required';
    }
    return '';
  }
}
