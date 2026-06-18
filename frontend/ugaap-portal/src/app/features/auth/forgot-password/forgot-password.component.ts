// ─────────────────────────────────────────────────────────────────────────────
// features/auth/forgot-password/forgot-password.component.ts
//
// Step 1 of the forgot-password flow.
//
// What happens here:
//   1. User enters their registered email or phone number
//   2. POST /auth/forgot-password via AuthService
//   3. Response includes a resetToken — stored in SessionService for later use
//   4. The email/phone is also stored (so the reset-otp screen can resend if needed)
//   5. Navigate to /auth/reset-otp
//
// ⚠️ TEMP: API call to AuthService.forgotPassword() is commented out below.
//    A stub resetToken is stored instead, and navigation happens immediately
//    on submit. Re-enable the real call once backend integration is ready.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { AuthService }    from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

// Shared UI components
import { LogoComponent }   from '../../../shared/components/logo/logo.component';
import { InputComponent }  from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AlertComponent }  from '../../../shared/components/alert/alert.component';

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
    AlertComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl:    './forgot-password.component.css',
})
export class ForgotPasswordComponent implements OnInit {

  /** Form with a single emailOrPhone field */
  forgotForm!: FormGroup;
  isLoading    = false;
  errorMessage = '';

  constructor(
    private fb:          FormBuilder,
    private router:      Router,
    private authService: AuthService,
    private session:     SessionService,
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      emailOrPhone: ['', Validators.required],
    });
  }

  // ── Template helper ─────────────────────────────────────────────────────────

  getEmailOrPhoneError(): string {
    const c = this.forgotForm.get('emailOrPhone');
    if (c?.touched && c.errors?.['required']) {
      return 'Email or phone number is required';
    }
    return '';
  }

  // ── Form submission ─────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';

    const { emailOrPhone } = this.forgotForm.value;

    // ── TEMP: stubbed flow (no API call) ──────────────────────────────────────
    this.session.setResetToken('stub-reset-token');
    this.session.setResetEmail(emailOrPhone);

    this.router.navigate(['/auth/reset-otp']);

    // ── ORIGINAL FLOW (commented out) ───────────────────────────────────────
    // this.isLoading = true;
    //
    // this.authService.forgotPassword({ emailOrPhone }).subscribe({
    //   next: (res) => {
    //     this.isLoading = false;
    //
    //     // Persist context needed by the next two screens
    //     this.session.setResetToken(res.resetToken);
    //     this.session.setResetEmail(emailOrPhone);
    //
    //     // Move to OTP verification step
    //     this.router.navigate(['/auth/reset-otp']);
    //   },
    //   error: (err) => {
    //     this.isLoading    = false;
    //     this.errorMessage = err?.error?.message ?? 'Could not send reset code. Please try again.';
    //   },
    // });
  }
}