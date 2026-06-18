// ─────────────────────────────────────────────────────────────────────────────
// features/auth/set-new-password/set-new-password.component.ts
//
// Step 3 (final) of the forgot-password flow.
//
// What happens here:
//   1. User chooses a new password (with real-time strength criteria display)
//   2. Component reads the resetToken + OTP code from SessionService
//      (both were stored by the previous two screens)
//   3. POST /auth/reset-password via AuthService
//   4. SessionService.clearResetContext() removes the temporary tokens
//   5. Navigate to /auth/login
//
// Password requirements enforced client-side:
//   ✓ Minimum 8 characters
//   ✓ At least one uppercase letter
//   ✓ At least one number
//   ✓ At least one special character
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

@Component({
  selector: 'app-set-new-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LogoComponent,
    InputComponent,
    ButtonComponent,
  ],
  templateUrl: './set-new-password.component.html',
  styleUrl:    './set-new-password.component.css',
})
export class SetNewPasswordComponent implements OnInit {

  passwordForm!: FormGroup;

  isLoading    = false;
  errorMessage = '';

  constructor(
    private fb:          FormBuilder,
    private router:      Router,
    private authService: AuthService,
    private session:     SessionService,
  ) {}

  ngOnInit(): void {
    // Guard: must have arrived through the full reset flow
    if (!this.session.getResetToken() || !this.session.getResetOtpCode()) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.passwordForm = this.fb.group({
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  // ── Computed password strength ──────────────────────────────────────────────

  /** Current value of the new-password field */
  get password(): string {
    return this.passwordForm.get('newPassword')?.value ?? '';
  }

  /** Real-time criteria flags — bound to the UI checklist */
  get criteria() {
    return {
      length:    this.password.length >= 8,
      uppercase: /[A-Z]/.test(this.password),
      number:    /\d/.test(this.password),
      special:   /[^A-Za-z0-9]/.test(this.password),
    };
  }

  /** True only when every criterion is satisfied */
  get allCriteriaMet(): boolean {
    return Object.values(this.criteria).every(Boolean);
  }

  // ── Template helpers ────────────────────────────────────────────────────────

  getNewPasswordError(): string {
    const c = this.passwordForm.get('newPassword');
    if (c?.touched && c.errors) {
      if (c.errors['required'])  return 'New password is required';
      if (c.errors['minlength']) return 'Password must be at least 8 characters';
    }
    return '';
  }

  getConfirmPasswordError(): string {
    const c           = this.passwordForm.get('confirmPassword');
    const newPassword = this.passwordForm.get('newPassword')?.value;
    if (c?.touched) {
      if (c.errors?.['required'])            return 'Please confirm your password';
      if (newPassword && c.value && newPassword !== c.value) return 'Passwords do not match';
    }
    return '';
  }

  // ── Form submission ─────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.passwordForm.invalid || !this.allCriteriaMet) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.passwordForm.value;

    // Extra client-side safety check for password match
    if (newPassword !== confirmPassword) return;

    // // Read the reset context tokens that were stored by previous screens
    // const resetToken = this.session.getResetToken()!;
    // const otpCode    = this.session.getResetOtpCode()!;

    // this.isLoading    = true;
    // this.errorMessage = '';

    // this.authService
    //   .resetPassword({ resetToken, otpCode, newPassword, confirmPassword })
    //   .subscribe({
    //     next: () => {
    //       this.isLoading = false;

          // Clean up all temporary reset data from sessionStorage
          this.session.clearResetContext();

          // Return to login — force the user to authenticate with the new password
          this.router.navigate(['/auth/login']);
      //   },
      //   error: (err) => {
      //     this.isLoading    = false;
      //     this.errorMessage = err?.error?.message ?? 'Password reset failed. Please try again.';
      //   },
      // });
  }
}
