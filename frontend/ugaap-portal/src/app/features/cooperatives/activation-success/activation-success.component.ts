import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// Shared components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { BadgeComponent } from '../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../shared/components/button/button.component';

/**
 * Activation Success Component
 * 
 * Displays success message after cooperative activation.
 * Shows completion checklist and next steps.
 * 
 * Features:
 * - Success icon with animation
 * - Cooperative details
 * - Terminal ID
 * - Completion checklist
 * - Navigation to cooperatives list
 * 
 * Flow:
 * Onboarding → Activation → Success → Cooperatives List
 */
@Component({
  selector: 'app-activation-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LogoComponent,
    BadgeComponent,
    ButtonComponent
  ],
  templateUrl: './activation-success.component.html',
  styleUrls: ['./activation-success.component.css']
})
export class ActivationSuccessComponent {

  /**
   * Cooperative data (would come from previous step)
   */
  cooperative = {
    name: 'Mubende Coffee Farmers Union',
    terminalId: 'CO-552-MBND-2024'
  };

  /**
   * Completion checklist
   */
  completionItems = [
    {
      title: 'Admin notified',
      subtitle: 'SMS & EMAIL DISPATCHED',
      completed: true
    },
    {
      title: 'Tenant provisioned',
      subtitle: 'DB CLUSTER INITIALIZED',
      completed: true
    },
    {
      title: 'Credentials sent',
      subtitle: 'SECURE LINK GENERATED',
      completed: true
    }
  ];

  constructor(private router: Router) {}

  /**
   * Navigate to cooperatives list
   */
  goToCooperativesList(): void {
    this.router.navigate(['/cooperatives']);
  }
}
