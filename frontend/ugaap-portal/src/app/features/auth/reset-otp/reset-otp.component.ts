// ─────────────────────────────────────────────────────────────────────────────
// features/auth/reset-otp/reset-otp.component.ts
//
// Step 2 of the forgot-password flow — OTP verification.
//
// What happens here:
//   1. User enters the 4-digit OTP sent to their email/phone
//   2. The OTP is saved to SessionService (it is submitted with the new
//      password in the final reset step, not verified independently here)
//   3. Navigate to /auth/set-new-password
//
// Resend OTP:
//   Calls AuthService.forgotPassword() again with the same email/phone
//   (stored in SessionService by the previous screen).
//   The backend issues a fresh OTP and a new resetToken which replaces the old one.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

// Shared UI components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-reset-otp',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent, ButtonComponent, AlertComponent],
  templateUrl: './reset-otp.component.html',
  styleUrl: './reset-otp.component.css',
})
export class ResetOtpComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('hiddenInput') hiddenInput!: ElementRef<HTMLInputElement>;

  otpValue = '';
  isLoading = false;
  errorMessage = '';
  timeLeft = 300;
  resendCooldown = 0;

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private session: SessionService,
  ) {}

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Guard: must have arrived from forgot-password screen
    const email = this.session.getResetEmail();
    if (!email) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }
    this.startCountdown();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.hiddenInput?.nativeElement.focus(), 100);
  }

  ngOnDestroy(): void {
    this._clearTimers();
  }

  // ── OTP box helpers ─────────────────────────────────────────────────────────

  get boxes(): string[] {
    return Array.from({ length: 4 }, (_, i) => this.otpValue[i] ?? '');
  }

  get isComplete(): boolean {
    return this.otpValue.length === 4;
  }

  get activeIndex(): number {
    return Math.min(this.otpValue.length, 3);
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ── Input handling ──────────────────────────────────────────────────────────

  focusHidden(): void {
    this.hiddenInput.nativeElement.focus();
  }

  onHiddenInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 4);
    this.otpValue = cleaned;
    input.value = cleaned;

    if (this.isComplete) {
      setTimeout(() => this.verify(), 200);
    }
  }

  onHiddenKeyDown(event: KeyboardEvent): void {
    const allowed = /^\d$/.test(event.key) || ['Backspace', 'Delete', 'Tab'].includes(event.key);
    if (!allowed) event.preventDefault();
  }

  onSubmit(): void {
    this.verify();
  }

  // ── Core actions ────────────────────────────────────────────────────────────

  verify(): void {
    if (!this.isComplete || this.isLoading) return;

    const email = this.session.getResetEmail();
    if (!email) {
      this.errorMessage = 'Session expired. Please start again.';
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyPasswordResetOtp({ email, otp: this.otpValue }).subscribe({
      next: (res) => {
        this.isLoading = false;

        // Store verifiedToken — set-new-password screen will use it
        const verifiedToken = res?.data?.verifiedToken;
        this.session.setResetToken(verifiedToken);

        // Navigate to set new password
        this.router.navigate(['/auth/set-new-password']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message ?? 'Invalid OTP. Please try again.';
        // Clear boxes so user can re-enter
        this.otpValue = '';
        this.hiddenInput.nativeElement.value = '';
        this.hiddenInput.nativeElement.focus();
      },
    });
  }

  resendOtp(): void {
    if (this.resendCooldown > 0) return;

    const email = this.session.getResetEmail();
    if (!email) return;

    this.timeLeft = 300;
    this.otpValue = '';
    this.errorMessage = '';
    this.hiddenInput.nativeElement.value = '';
    this.startCountdown();
    this.hiddenInput.nativeElement.focus();

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        // Fresh OTP sent — nothing to store, email already in session
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Could not resend code. Please try again.';
      },
    });

    this.resendCooldown = 30;
    this.resendTimer = setInterval(() => {
      if (this.resendCooldown > 0) {
        this.resendCooldown--;
      } else {
        clearInterval(this.resendTimer!);
      }
    }, 1000);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private startCountdown(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        clearInterval(this.countdownTimer!);
      }
    }, 1000);
  }

  private _clearTimers(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.resendTimer) clearInterval(this.resendTimer);
  }
}
