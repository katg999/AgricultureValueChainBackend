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

import {
  Component,
  OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { AuthService }    from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

// Shared UI components
import { LogoComponent }   from '../../../shared/components/logo/logo.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AlertComponent }  from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-reset-otp',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent, ButtonComponent, AlertComponent],
  templateUrl: './reset-otp.component.html',
  styleUrl:    './reset-otp.component.css',
})
export class ResetOtpComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('hiddenInput') hiddenInput!: ElementRef<HTMLInputElement>;

  otpValue       = '';
  isLoading      = false;
  errorMessage   = '';
  timeLeft       = 300;   // 5-minute OTP validity window
  resendCooldown = 0;

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private resendTimer:    ReturnType<typeof setInterval> | null = null;

  constructor(
    private router:      Router,
    private authService: AuthService,
    private session:     SessionService,
  ) {}

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Guard: user must have arrived from the forgot-password screen
    if (!this.session.getResetToken()) {
      this.router.navigate(['/auth/set-new-password']);
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
    const input   = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 4);
    this.otpValue = cleaned;
    input.value   = cleaned;

    if (this.isComplete) {
      setTimeout(() => this.verify(), 200);
    }
  }

  onHiddenKeyDown(event: KeyboardEvent): void {
    const allowed = /^\d$/.test(event.key) ||
      ['Backspace', 'Delete', 'Tab'].includes(event.key);
    if (!allowed) event.preventDefault();
  }

  onSubmit(): void {
    this.verify();
  }

  // ── Core actions ────────────────────────────────────────────────────────────

  /**
   * Save the OTP to the session, then move to set-new-password.
   * The actual OTP + resetToken are both sent to the backend on the
   * final screen — this approach avoids an extra round-trip.
   *
   * Named `verify` to match the (clicked)="verify()" binding in the template.
   */
  verify(): void {
    if (!this.isComplete || this.isLoading) return;

    // Store the OTP — set-new-password will read it
    this.session.setResetOtpCode(this.otpValue);
    this.router.navigate(['/auth/set-new-password']);
  }

  /**
   * Re-trigger the forgot-password request so the backend sends a new OTP.
   * Updates the stored resetToken with the fresh value from the response.
   */
  resendOtp(): void {
    if (this.resendCooldown > 0) return;

    const emailOrPhone = this.session.getResetEmail();
    if (!emailOrPhone) return;

    // Reset local state
    this.timeLeft     = 300;
    this.otpValue     = '';
    this.errorMessage = '';
    this.hiddenInput.nativeElement.value = '';
    this.startCountdown();
    this.hiddenInput.nativeElement.focus();

    // Request a new OTP + resetToken from the backend
    this.authService.forgotPassword({ emailOrPhone }).subscribe({
      next: (res) => {
        // Replace the old reset token with the fresh one
        this.session.setResetToken(res.resetToken);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Could not resend code. Please try again.';
      },
    });

    // 30-second cooldown to prevent spam
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
    if (this.resendTimer)    clearInterval(this.resendTimer);
  }
}
