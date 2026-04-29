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

@Component({
  selector: 'app-reset-otp',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reset-otp.html',
  styleUrl: './reset-otp.scss'
})
export class ResetOtpComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('hiddenInput') hiddenInput!: ElementRef;

  otpValue = '';
  isLoading = false;
  errorMessage = '';
  timeLeft = 300;
  timer: any;
  resendCooldown = 0;
  resendTimer: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.startTimer();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.hiddenInput.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    clearInterval(this.resendTimer);
  }

  get boxes(): string[] {
    const result = ['', '', '', ''];
    for (let i = 0; i < this.otpValue.length && i < 4; i++) {
      result[i] = this.otpValue[i];
    }
    return result;
  }

  get isComplete(): boolean {
    return this.otpValue.length === 4;
  }

  get activeIndex(): number {
    return Math.min(this.otpValue.length, 3);
  }

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

  get formattedTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

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
    if (
      !/^\d$/.test(event.key) &&
      event.key !== 'Backspace' &&
      event.key !== 'Delete' &&
      event.key !== 'Tab'
    ) {
      event.preventDefault();
    }
  }

  verify(): void {
    if (!this.isComplete || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    setTimeout(() => {
      this.isLoading = false;

      if (this.otpValue === '0000') {
        this.errorMessage = 'Invalid code. Please try again.';
        this.otpValue = '';
        this.hiddenInput.nativeElement.value = '';
        this.hiddenInput.nativeElement.focus();
        return;
      }

      this.router.navigate(['/auth/set-new-password']);
    }, 1200);
  }

  resendOtp(): void {
    if (this.resendCooldown > 0) return;

    this.timeLeft = 300;
    this.otpValue = '';
    this.errorMessage = '';
    this.hiddenInput.nativeElement.value = '';
    this.startTimer();
    this.hiddenInput.nativeElement.focus();

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