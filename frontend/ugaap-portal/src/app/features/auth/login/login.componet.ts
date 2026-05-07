import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Shared reusable components
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

/**
 * Login Component
 * 
 * Main authentication entry point for UGAAP platform.
 * Handles user login with email and password validation.
 * 
 * Flow:
 * 1. User enters credentials
 * 2. Form validation
 * 3. API call (simulated with timeout)
 * 4. Navigate to OTP verification
 * 
 * Components Used:
 * - LogoComponent: UGAAP branding
 * - AlertComponent: Error messages
 * - InputComponent: Email and password fields
 * - ButtonComponent: Submit button with loading state
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
    LogoComponent,
    AlertComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  /**
   * Reactive form for login
   * Contains email and password controls with validators
   */
  loginForm!: FormGroup;

  /**
   * Loading state during authentication
   * Shows spinner in submit button
   */
  isLoading = false;

  /**
   * Error message to display
   * Shown in AlertComponent when authentication fails
   */
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize login form with validators
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Handle form submission
   * Validates form and initiates authentication flow
   * 
   * TODO: Replace setTimeout with actual backend API call
   * Example: this.authService.login(this.loginForm.value).subscribe(...)
   */
  onSubmit(): void {
    // Mark all fields as touched to trigger validation display
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Temporary simulation - Replace with actual API call
    // Backend will return the user role and redirect accordingly
    setTimeout(() => {
      this.isLoading = false;
      // On success, navigate to OTP verification
      this.router.navigate(['/auth/otp-verify']);
    }, 1000);
  }

  /**
   * Get email field error message
   * Used in template to display contextual validation errors
   * 
   * @returns Error message string or empty string if no error
   */
  getEmailError(): string {
    const control = this.loginForm.get('email');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Email is required';
      if (control.errors['email']) return 'Please enter a valid email';
    }
    return '';
  }

  /**
   * Get password field error message
   * Used in template to display contextual validation errors
   * 
   * @returns Error message string or empty string if no error
   */
  getPasswordError(): string {
    const control = this.loginForm.get('password');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Password is required';
      if (control.errors['minlength']) return 'Password must be at least 6 characters';
    }
    return '';
  }
}