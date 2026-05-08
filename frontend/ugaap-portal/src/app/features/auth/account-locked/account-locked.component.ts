import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Shared reusable components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

/**
 * Account Locked Component
 * 
 * Displayed when user account is temporarily locked due to failed login attempts.
 * Shows lock duration and provides support contact information.
 * 
 * Features:
 * - Dynamic failed attempts count
 * - Unlock time remaining
 * - Support contact link
 * - Security icon
 * 
 * Components Used:
 * - LogoComponent: UGAAP branding
 * - AlertComponent: Info message with unlock details
 * - Custom lock icon (unique to this page)
 */
@Component({
  selector: 'app-account-locked',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LogoComponent,
    AlertComponent
  ],
  templateUrl: './account-locked.component.html',
  styleUrls: ['./account-locked.component.css']
})
export class AccountLockedComponent {
  /**
   * Number of failed login attempts that triggered the lock
   * Displayed to user for transparency
   */
  failedAttempts = 5;

  /**
   * Time in minutes until account automatically unlocks
   * Calculated from backend or set to default (30 minutes)
   */
  unlockMinutes = 30;
}
