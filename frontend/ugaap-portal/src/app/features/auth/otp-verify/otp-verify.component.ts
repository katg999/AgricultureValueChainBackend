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
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

/**
 * OTP Verification Component
 * 
 * Handles 4-digit OTP verification after login.
 * Features custom OTP input boxes with hidden actual input.
 * 
 * Flow:
 * 1. User receives OTP via email/SMS
 * 2. Enter 4-digit code
 * 3. Auto-submit when complete
 * 4. Navigate to dashboard on success
 * 
 * Features:
 * - Visual OTP boxes with active state
 * - Hidden input for actual data capture
 * - Auto-focus and keyboard handling
 * - Resend OTP with cooldown timer
 * - Session timeout countdown
 * 
 * Components Used:
 * - LogoComponent: UGAAP branding
 * - AlertComponent: Error messages
 * - ButtonComponent: Verify button with loading state
 * - Custom OTP boxes (unique to this page)
 */
@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    LogoComponent,
    AlertComponent
  ],
  templateUrl: './otp-verify.component.html',
  styleUrl: './otp-verify.component.css'
})
export class OtpVerifyComponent implements OnInit, OnDestroy, AfterViewInit {

  /**
   * Reference to hidden input element
   * Used for programmatic focus and value capture
   */
  @ViewChild('hiddenInput') hiddenInput!: ElementRef;

  /**
   * OTP value (4 digits)
   * Captured from hidden input, displayed in visual boxes
   */
  otpValue = '';

  /**
   * Loading state during verification
   */
  isLoading = false;

  /**
   * Error message to display
   * Shown when verification fails
   */
  errorMessage = '';

  /**
   * Time remaining for OTP validity (in seconds)
   * Default: 300 seconds (5 minutes)
   */
  timeLeft = 300;

  /**
   * Interval timer for countdown
   */
  timer: any;

  /**
   * Cooldown before resend is allowed (in seconds)
   * Prevents spam resend requests
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
    // Auto-focus hidden input after view init
    setTimeout(() => {
      this.hiddenInput.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    // Clean up timers to prevent memory leaks
    clearInterval(this.timer);
    clearInterval(this.resendTimer);
  }

  /**
   * Get array of 4 characters for visual display
   * Empty slots are empty strings
   * 
   * @returns Array of 4 strings (filled or empty)
   */
  get boxes(): string[] {
    const result = ['', '', '', ''];
    for (let i = 0; i < this.otpValue.length && i < 4; i++) {
      result[i] = this.otpValue[i];
    }
    return result;
  }

  /**
   * Check if all 4 digits are entered
   * 
   * @returns true if OTP is complete
   */
  get isComplete(): boolean {
    return this.otpValue.length === 4;
  }

  /**
   * Get index of currently active input box
   * 
   * @returns Index of active box (0-3)
   */
  get activeIndex(): number {
    return Math.min(this.otpValue.length, 3);
  }

  /**
   * Start countdown timer for OTP validity
   * Runs every second until time expires
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
   * Format time remaining as MM:SS
   * 
   * @returns Formatted time string (e.g., "4:52")
   */
  get formattedTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Focus the hidden input when user clicks OTP boxes
   * Provides intuitive interaction
   */
  focusHidden(): void {
    this.hiddenInput.nativeElement.focus();
  }

  /**
   * Handle input from hidden field
   * Filters to digits only and limits to 4 characters
   * Auto-verifies when complete
   * 
   * @param event Input event from hidden input
   */
  onHiddenInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Only keep digits, max 4
    const cleaned = input.value.replace(/\D/g, '').slice(0, 4);
    this.otpValue = cleaned;
    // Reset the hidden input value to match
    input.value = cleaned;

    // Auto-verify when 4 digits entered
    if (this.isComplete) {
      setTimeout(() => this.verify(), 200);
    }
  }

  /**
   * Handle manual submit button click
   * Useful if user wants to verify before typing all 4 digits
   */
  onSubmit(): void {
    this.verify();
  }

  /**
   * Handle keyboard events on hidden input
   * Only allow digits and special keys (backspace, delete, tab)
   * 
   * @param event Keyboard event
   */
  onHiddenKeyDown(event: KeyboardEvent): void {
    // Allow only digits and control keys
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
   * Sends code to backend for validation
   * 
   * TODO: Replace setTimeout with actual API call
   * Example: this.authService.verifyOtp(this.otpValue).subscribe(...)
   */
  verify(): void {
    if (!this.isComplete || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Temporary simulation - Replace with actual API call
    setTimeout(() => {
      this.isLoading = false;

      // Example invalid code check (replace with real backend response)
      if (this.otpValue === '0000') {
        this.errorMessage = 'Invalid code. Please try again.';
        this.otpValue = '';
        this.hiddenInput.nativeElement.value = '';
        this.hiddenInput.nativeElement.focus();
        return;
      }

      // On success, navigate to dashboard
      this.router.navigate(['/dashboard']);
    }, 1200);
  }

  /**
   * Resend OTP code
   * Resets timer and cooldown
   * 
   * TODO: Replace with actual API call to resend OTP
   * Example: this.authService.resendOtp().subscribe(...)
   */
  resendOtp(): void {
    if (this.resendCooldown > 0) return;

    // Reset validity timer
    this.timeLeft = 300;
    this.otpValue = '';
    this.errorMessage = '';
    this.hiddenInput.nativeElement.value = '';
    this.startTimer();
    this.hiddenInput.nativeElement.focus();

    // Start resend cooldown (30 seconds)
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
