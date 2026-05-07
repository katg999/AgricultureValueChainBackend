import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// Shared reusable components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

/**
 * Reset OTP Component
 * 
 * Second step in password recovery flow.
 * Verifies 4-digit OTP code sent via email/phone.
 * Similar to login OTP but for password reset.
 * 
 * Flow:
 * 1. User receives OTP code
 * 2. Enter 4-digit code
 * 3. Verify and navigate to set-new-password
 * 
 * Features:
 * - Custom OTP input boxes
 * - Auto-submit when complete
 * - Resend code with cooldown
 * - Session timeout countdown
 * 
 * Components Used:
 * - LogoComponent: UGAAP branding
 * - AlertComponent: Error messages
 * - ButtonComponent: Verify button
 * - Custom OTP boxes (unique to this page)
 */
@Component({
  selector: 'app-reset-otp',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LogoComponent,
    ButtonComponent,
    AlertComponent
  ],
  templateUrl: './reset-otp.component.html',
  styleUrl: './reset-otp.component.css'
})
export class ResetOtpComponent implements OnInit, OnDestroy, AfterViewInit {

  /**
   * Reference to hidden input element
   */
  @ViewChild('hiddenInput') hiddenInput!: ElementRef;

  /**
   * OTP value (4 digits)
   */
  otpValue = '';

  /**
   * Loading state during verification
   */
  isLoading = false;

  /**
   * Error message to display
   */
  errorMessage = '';

  /**
   * Time remaining for OTP validity (seconds)
   */
  timeLeft = 300;

  /**
   * Interval timer for countdown
   */
  timer: any;

  /**
   * Cooldown before resend allowed (seconds)
   */
  resendCooldown = 0;

  /**
   * Interval timer for resend cooldown
   */
  resendTimer: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.startTimer();
  }

  ngAfterViewInit(): void {
    // Auto-focus hidden input
    setTimeout(() => {
      this.hiddenInput.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    // Clean up timers
    clearInterval(this.timer);
    clearInterval(this.resendTimer);
  }

  /**
   * Get array of 4 characters for display
   */
  get boxes(): string[] {
    const result = ['', '', '', ''];
    for (let i = 0; i < this.otpValue.length && i < 4; i++) {
      result[i] = this.otpValue[i];
    }
    return result;
  }

  /**
   * Check if all 4 digits entered
   */
  get isComplete(): boolean {
    return this.otpValue.length === 4;
  }

  /**
   * Get index of currently active box
   */
  get activeIndex(): number {
    return Math.min(this.otpValue.length, 3);
  }

  /**
   * Start countdown timer
   */
  startTimer(): void {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  /**
   * Format time as MM:SS
   */
  get formattedTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Focus hidden input when boxes clicked
   */
  focusHidden(): void {
    this.hiddenInput.nativeElement.focus();
  }

  /**
   * Handle input from hidden field
   */
  onHiddenInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 4);
    this.otpValue = cleaned;
    input.value = cleaned;

    // Auto-verify when complete
    if (this.isComplete) {
      setTimeout(() => this.verify(), 200);
    }
  }

  /**
   * Handle keyboard events
   */
  onHiddenKeyDown(event: KeyboardEvent): void {
    if (
      !/^\d$/.test(event.key) &&
      event.key !== 'Backspace' &&
      event.key !== 'Delete' &&
      event.key !== 'Tab'
    ) {
      event.preventDefault();
    }
  }

  /**
   * Verify OTP code
   * 
   * TODO: Replace setTimeout with actual API call
   */
  verify(): void {
    if (!this.isComplete || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Temporary simulation
    setTimeout(() => {
      this.isLoading = false;

      // Example validation
      if (this.otpValue === '0000') {
        this.errorMessage = 'Invalid code. Please try again.';
        this.otpValue = '';
        this.hiddenInput.nativeElement.value = '';
        this.hiddenInput.nativeElement.focus();
        return;
      }

      // On success, navigate to set new password
      this.router.navigate(['/auth/set-new-password']);
    }, 1200);
  }

  /**
   * Resend OTP code
   * 
   * TODO: Replace with actual API call
   */
  resendOtp(): void {
    if (this.resendCooldown > 0) return;

    this.timeLeft = 300;
    this.otpValue = '';
    this.errorMessage = '';
    this.hiddenInput.nativeElement.value = '';
    this.startTimer();
    this.hiddenInput.nativeElement.focus();

    // Start cooldown
    this.resendCooldown = 30;
    this.resendTimer = setInterval(() => {
      if (this.resendCooldown > 0) {
        this.resendCooldown--;
      } else {
        clearInterval(this.resendTimer);
      }
    }, 1000);
  }
}
