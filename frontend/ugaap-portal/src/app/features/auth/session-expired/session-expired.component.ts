import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Shared reusable components
import { LogoComponent } from '../../../shared/components/logo/logo.component';

/**
 * Session Expired Component
 * 
 * Displayed when user session times out due to inactivity.
 * Provides clear messaging about why logout occurred and data implications.
 * 
 * Features:
 * - Shows inactivity duration
 * - Warns about potential data loss
 * - Clear call-to-action to sign in again
 * 
 * Security:
 * - Auto-logout protects user data
 * - Prevents unauthorized access on shared devices
 * - Clear communication about session timeout
 * 
 * Components Used:
 * - LogoComponent: UGAAP branding
 * - ButtonComponent: Sign in again button (styled as link)
 */
@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LogoComponent,
    
  ],
  templateUrl: './session-expired.component.html',
  styleUrl: './session-expired.component.css'
})
export class SessionExpiredComponent {
  /**
   * Duration of inactivity that triggered timeout
   * Displayed to user for transparency
   * Format: "30:00" (MM:SS) or "30" (minutes)
   */
  inactivityTime = '30';
}
