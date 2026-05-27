// ─────────────────────────────────────────────────────────────────────────────
// features/auth/login/login.componet.ts   (filename typo kept — matches route)
//
// Login screen — first step in the authentication flow.
//
// What happens here:
//   1. User fills in email, password and selects their role
//   2. POST /auth/login via AuthService
//   3. AuthService stores the tempToken in SessionService
//   4. If requiresOtp → navigate to /auth/otp
//      Otherwise       → navigate straight to the role-appropriate dashboard
//
// Dependencies:
//   AuthService        → makes the HTTP call
//   SessionService     → reads/writes temp token
//   DashboardConfigService → resolves the correct home route per role
// ─────────────────────────────────────────────────────────────────────────────

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { AuthService }           from '../../../core/services/auth.service';
import { DashboardConfigService } from '../../../core/services/dashboard-config.service';

// Shared UI components
import { ButtonComponent }  from '../../../shared/components/button/button.component';
import { InputComponent }   from '../../../shared/components/input/input.component';
import { LogoComponent }    from '../../../shared/components/logo/logo.component';
import { AlertComponent }   from '../../../shared/components/alert/alert.component';

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
    AlertComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl:    './login.component.css',
})
export class LoginComponent implements OnInit {

  /** Reactive login form */
  loginForm!: FormGroup;

  /** Shows spinner on the submit button while the request is in-flight */
  isLoading = false;

  /** Displayed in the AlertComponent when the API returns an error */
  errorMessage = '';

  /**
   * URL to redirect to after successful login.
   * Populated from ?returnUrl= query param set by the authGuard.
   */
  private returnUrl = '';

  constructor(
    private fb:              FormBuilder,
    private router:          Router,
    private route:           ActivatedRoute,
    private authService:     AuthService,
    private dashboardConfig: DashboardConfigService,
  ) {}

  ngOnInit(): void {
    // Capture the return URL so we can redirect back after login
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';

    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],

      // Role selector determines which dashboard the user is taken to after OTP
      role: ['', Validators.required],
    });
  }

  // ── Template helpers ────────────────────────────────────────────────────────

  getEmailError(): string {
    const c = this.loginForm.get('email');
    if (c?.touched && c.errors) {
      if (c.errors['required']) return 'Email is required';
      if (c.errors['email'])    return 'Please enter a valid email address';
    }
    return '';
  }

  getPasswordError(): string {
    const c = this.loginForm.get('password');
    if (c?.touched && c.errors) {
      if (c.errors['required'])   return 'Password is required';
      if (c.errors['minlength'])  return 'Password must be at least 6 characters';
    }
    return '';
  }

  getRoleError(): string {
    const c = this.loginForm.get('role');
    if (c?.touched && c.errors?.['required']) return 'Please select your role';
    return '';
  }

  // ── Form submission ─────────────────────────────────────────────────────────

  onSubmit(): void {
    // Trigger inline validation on all fields
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    const { email, password, role } = this.loginForm.value;

    this.authService.login({ email, password, role }).subscribe({
      next: (res) => {
        this.isLoading = false;

        if (res.requiresOtp) {
          // AuthService already stored tempToken via SessionService — go to OTP screen
          this.router.navigate(['/auth/otp']);
        } else {
          // No OTP required — session is already active; go to role dashboard
          const home = this.returnUrl || this.dashboardConfig.homeRoute();
          this.router.navigateByUrl(home);
        }
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err?.error?.message ?? 'Invalid credentials. Please try again.';
      },
    });
  }
}
