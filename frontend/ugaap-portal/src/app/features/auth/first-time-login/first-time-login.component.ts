import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';


type SetupStepStatus = 'completed' | 'active' | 'pending' | 'locked';
type SetupStepIcon = 'shield' | 'branches' | 'roles' | 'commodities' | 'seasons' | 'grading';

interface SetupStep {
  title: string;
  description: string;
  status: SetupStepStatus;
  icon: SetupStepIcon;
  actionLabel: string;
  route?: string;
}

@Component({
  selector: 'app-first-time-login',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent, ButtonComponent],
  templateUrl: './first-time-login.component.html',
  styleUrl: './first-time-login.component.css',
})
export class FirstTimeLoginComponent {
  cooperativeName = 'Kampala Central Cooperative';

  steps: SetupStep[] = [
    {
      title: 'Secure admin account',
      description: 'Confirm your administrator profile and access permissions.',
      status: 'completed',
      icon: 'shield',
      actionLabel: 'Complete'
    },
    {
      title: 'Register cooperative branches',
      description: 'Add the operating branches that will transact through this terminal.',
      status: 'active',
      icon: 'branches',
      actionLabel: 'Continue',
      route: '/cooperative/branches/onboarding'
    },
    {
      title: 'Assign user roles',
      description: 'Prepare managers, tellers, and inventory officers for controlled access.',
      status: 'pending',
      icon: 'roles',
      actionLabel: 'Pending'
    },
    {
      title: 'Configure commodities',
      description: 'Define the crop and produce categories handled by the cooperative.',
      status: 'locked',
      icon: 'commodities',
      actionLabel: 'Locked'
    },
    {
      title: 'Set trading seasons',
      description: 'Create active seasons for procurement, storage, and repayment cycles.',
      status: 'locked',
      icon: 'seasons',
      actionLabel: 'Locked'
    },
    {
      title: 'Define grading standards',
      description: 'Set quality grades used for pricing, finance limits, and inventory valuation.',
      status: 'locked',
      icon: 'grading',
      actionLabel: 'Locked'
    }
  ];

  constructor(private router: Router) {}

  get setupProgress(): number {
    const completedSteps = this.steps.filter((step) => step.status === 'completed').length;
    return Math.round((completedSteps / this.steps.length) * 100);
  }

  onStepAction(step: SetupStep): void {
    if (!step.route) return;
    this.router.navigateByUrl(step.route);
  }

  onSkipSetup(): void {
    this.router.navigateByUrl('/auth/login');
  }
}
