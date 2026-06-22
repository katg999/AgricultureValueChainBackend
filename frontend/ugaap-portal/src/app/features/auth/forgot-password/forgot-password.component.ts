import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';

import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

// Shared UI components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

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
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private session: SessionService,
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      emailOrPhone: ['', [Validators.required, Validators.email]],
    });
  }

  // ── Template helper ─────────────────────────────────────────────────────────

  getEmailOrPhoneError(): string {
    const c = this.forgotForm.get('emailOrPhone');
    if (c?.touched && c.errors) {
      if (c.errors['required']) return 'Email is required';
      if (c.errors['email']) return 'Please enter a valid email address';
    }
    return '';
  }

  // ── Form submission ─────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.forgotForm.value.emailOrPhone;

    console.log('FORGOT PASSWORD - email:', email);
    console.log('FORGOT PASSWORD - hitting endpoint:', API_ENDPOINTS.AUTH.FORGOT_PASSWORD);

    this.authService.forgotPassword({ email }).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('FORGOT PASSWORD - success:', res);
        this.session.setResetEmail(email);
        this.router.navigate(['/auth/reset-otp']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('FORGOT PASSWORD - error:', err);
        this.errorMessage = err?.error?.message ?? 'Could not send reset code. Please try again.';
      },
    });
  }
}
