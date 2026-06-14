// ─────────────────────────────────────────────────────────────────────────────
// features/auth/otp-verify/otp-verify.component.ts
//
// OTP verification screen — second step of the login flow.
//
// What happens here:
//   1. Component reads the tempToken that AuthService saved in SessionService
//   2. User enters 4-digit OTP received via email/SMS
//   3. Auto-submits on 4th digit  (or user can tap "Verify")
//   4. POST /auth/verify-otp via AuthService
//      → AuthService calls SessionService.setSession() which persists the real tokens
//   5. Navigate to the role-appropriate dashboard via DashboardConfigService
//
// Resend OTP:
//   Calls AuthService.resendOtp(tempToken) → POST /auth/resend-otp
//   A 30-second cooldown prevents spam.
//
// Session countdown:
//   OTP is valid for 5 minutes.  A local countdown informs the user.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Component,
  OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef,
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { AuthService }            from '../../../core/services/auth.service';
import { SessionService }         from '../../../core/services/session.service';
import { DashboardConfigService } from '../../../core/services/dashboard-config.service';

// Shared UI components
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { LogoComponent }   from '../../../shared/components/logo/logo.component';
import { AlertComponent }  from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, LogoComponent, AlertComponent],
  templateUrl: './otp-verify.component.html',
  styleUrl:    './otp-verify.component.css',
})
export class OtpVerifyComponent implements OnInit, AfterViewInit, OnDestroy {

  /** Hidden <input> that captures keystrokes — the visible boxes are decorative */
  @ViewChild('hiddenInput') hiddenInput!: ElementRef<HTMLInputElement>;

  /** 4-digit code as the user types */
  otpValue = '';

  isLoading    = false;
  errorMessage = '';

  /** Counts down from 300 s (5 min) — OTP validity window */
  timeLeft = 300;

  /** Cooldown before "Resend" is active again (seconds) */
  resendCooldown = 0;

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private resendTimer:    ReturnType<typeof setInterval> | null = null;

  constructor(
    private router:          Router,
    private authService:     AuthService,
    private session:         SessionService,
    private dashboardConfig: DashboardConfigService,
  ) {}

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // const token = this.session.getTempToken();
    // console.log('OTP page -token:', token);
    // if (!token) {
    //   console.log('No token -> redirecting');
    //   this.router.navigate(['/auth/login']);
    //   return;
    // }
    this.startCountdown();
  }

  ngAfterViewInit(): void {
    // Auto-focus so the user can start typing immediately
    setTimeout(() => this.hiddenInput?.nativeElement.focus(), 100);
  }

  ngOnDestroy(): void {
    // Prevent memory leaks from dangling intervals
    this._clearTimers();
  }

  // ── OTP box computed properties ─────────────────────────────────────────────

  /** Array of 4 characters for the visual boxes (empty string = blank box) */
  get boxes(): string[] {
    return Array.from({ length: 4 }, (_, i) => this.otpValue[i] ?? '');
  }

  get isComplete(): boolean {
    return this.otpValue.length === 4;
  }

  /** Which box should appear "active" (highlighted) */
  get activeIndex(): number {
    return Math.min(this.otpValue.length, 3);
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ── Input handling ──────────────────────────────────────────────────────────

  /** Click on any visible box → delegate focus to the hidden input */
  focusHidden(): void {
    this.hiddenInput.nativeElement.focus();
  }

  /** Filter non-digits; auto-verify when the 4th digit is entered */
  onHiddenInput(event: Event): void {
    const input   = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 4);
    this.otpValue = cleaned;
    input.value   = cleaned;

    if (this.isComplete) {
      // Short delay lets the user see the filled boxes before the spinner appears
      setTimeout(() => this.verify(), 200);
    }
  }

  /** Block non-digit key presses early */
  onHiddenKeyDown(event: KeyboardEvent): void {
    const allowed = /^\d$/.test(event.key) ||
      ['Backspace', 'Delete', 'Tab'].includes(event.key);
    if (!allowed) event.preventDefault();
  }

  /** "Verify" button tapped manually */
  onSubmit(): void {
    this.verify();
  }

  // ── Core actions ────────────────────────────────────────────────────────────

  /**
   * Call the backend to verify the OTP.
   * AuthService.verifyOtp() internally calls SessionService.setSession()
   * so by the time subscribe(next) fires the user is fully authenticated.
   */
  verify(): void {
    if (!this.isComplete || this.isLoading) return;

    const tempToken = this.session.getTempToken();
    if (!tempToken) {
      this.errorMessage = 'Session expired. Please log in again.';
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.verifyOtp({ tempToken, otpCode: this.otpValue }).subscribe({
      next: () => {
        this.isLoading = false;
        // Navigate to the role-appropriate home page
        this.router.navigateByUrl(this.dashboardConfig.homeRoute());
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err?.error?.message ?? 'Invalid OTP code. Please try again.';
        // Clear the boxes so the user can re-enter
        this.otpValue = '';
        this.hiddenInput.nativeElement.value = '';
        this.hiddenInput.nativeElement.focus();
      },
    });
  }

  /**
   * Request a fresh OTP code.
   * Enforces a 30-second cooldown to prevent spam.
   */
  resendOtp(): void {
    if (this.resendCooldown > 0) return;

    const tempToken = this.session.getTempToken();
    if (!tempToken) return;

    // Reset local state
    this.timeLeft    = 300;
    this.otpValue    = '';
    this.errorMessage = '';
    this.hiddenInput.nativeElement.value = '';
    this.startCountdown();
    this.hiddenInput.nativeElement.focus();

    // Fire the API request
    this.authService.resendOtp(tempToken).subscribe({
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Could not resend OTP. Please try again.';
      },
    });

    // Start 30-second cooldown
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
