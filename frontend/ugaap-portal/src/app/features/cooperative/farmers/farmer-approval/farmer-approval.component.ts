// ─────────────────────────────────────────────────────────────────────────────
// features/farmers/farmer-approval/farmer-approval.component.ts
//
// Full farmer profile view with approve / reject workflow.
//
// ─────────────────────────────────────────────────────────────────────────────

import { CommonModule, DecimalPipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent }  from '../../../../shared/components/badge/badge';

import {
  BadgeVariant,
  FarmerProfile,
  FarmerService,
  OnboardingStep,
} from '../../../shared-farmer-domain/farmer.service';

import {
  InputAllocation,
  ProduceDelivery,
  BalanceLine,
  Repayment,
  FarmerNotification,
} from '../../../shared-farmer-domain/farmer.service';

export interface ProfileTab {
  key:   string;
  label: string;
  badge?: number;
  badgeVariant?: BadgeVariant;
}



@Component({
  selector: 'app-farmer-approval',
  standalone: true,
  imports: [CommonModule, DecimalPipe, SlicePipe, UpperCasePipe, ButtonComponent, BadgeComponent],
  templateUrl: './farmer-approval.component.html',
  styleUrl: './farmer-approval.component.css',
})
export class FarmerApprovalComponent implements OnInit {

  activeTab = 'overview';

  // Tab config 
  readonly tabs: ProfileTab[] = [
    { key: 'overview',          label: 'Overview' },
    { key: 'inputs',            label: 'Inputs' },
    { key: 'deliveries',        label: 'Deliveries' },
    { key: 'outstanding_balance', label: 'Outstanding balance' },
    { key: 'repayments',        label: 'Repayments' },
    { key: 'notifications',     label: 'Notifications', badge: 2, badgeVariant: 'info' },
  ];

  // Detail tables — populated from FarmerActivityService in ngOnInit.
  inputAllocations: InputAllocation[] = [];
  deliveries:       ProduceDelivery[] = [];
  balanceLines:     BalanceLine[]     = [];
  repayments:       Repayment[]       = [];
  notifications:    FarmerNotification[] = [];

  //  Data state
  /**
   * Set by ngOnInit — always populated before the template renders real content.
   * Definite-assignment assertion (!) tells TypeScript the template guards
   * via *ngIf="!loading && farmer" so accessing farmer.xxx is always safe.
   */
  farmer: FarmerProfile | null = null;
  loading = false;
  error: string | null = null;

  get isBranchView(): boolean {
    return this.router.url.startsWith('/branch');
  }

  constructor(
    private router:        Router,
    private route:         ActivatedRoute,
    private farmerService: FarmerService,
  ) {}

  // Lifecycle methods 

  ngOnInit(): void {
    this.loading = true;

    const farmerId = this.route.snapshot.paramMap.get('id');
    if (!farmerId) {
      this.error = 'Missing farmer ID.';
      this.loading = false;
      return;
    }

    this.farmerService.getById(farmerId).subscribe({
      next:  f   => { this.farmer = f;                this.loading = false; },
      error: err => { this.error  = err?.error?.message ?? err.message; this.loading = false; },
    });

    // Load all sub-tab tables — methods live on FarmerService, respect USE_MOCK.
    this.farmerService.getInputAllocations(farmerId).subscribe(v  => this.inputAllocations = v);
    this.farmerService.getProduceDeliveries(farmerId).subscribe(v => this.deliveries = v);
    this.farmerService.getBalanceLines(farmerId).subscribe(v      => this.balanceLines = v);
    this.farmerService.getRepayments(farmerId).subscribe(v        => this.repayments = v);
    this.farmerService.getNotifications(farmerId).subscribe(v     => this.notifications = v);
  }

  //  Computed properties

  get balanceSummary(): { principal: number; recovered: number; outstanding: number } {
    return this.balanceLines.reduce(
      (acc, l) => ({
        principal:   acc.principal   + l.principal,
        recovered:   acc.recovered   + l.recovered,
        outstanding: acc.outstanding + l.outstanding,
      }),
      { principal: 0, recovered: 0, outstanding: 0 },
    );
  }

  // Actions 

  setTab(key: string): void {
    this.activeTab = key;
  }

  getBadgeVariant(status: 'settled' | 'partial' | 'overdue' | 'pending' | 'open' | 'closed'): BadgeVariant {
    return status;
  }

  stepIcon(status: OnboardingStep['status']): string {
    const icons: Record<OnboardingStep['status'], string> = {
      done:     'ti-circle-check',
      progress: 'ti-clock',
      pending:  'ti-circle',
    };
    return icons[status];
  }

  onEditProfile(): void {
    if (this.farmer) {
      this.router.navigate(['/branch/farmers/register', this.farmer.id]);
    }
  }

  onSendSms(): void {
    if (this.farmer) console.log('Send SMS to', this.farmer.phoneNumber);
  }

  onReject(): void {
    if (!this.farmer) return;
    if (!confirm(`Reject farmer ${this.farmer.fullName}? This action cannot be undone.`)) return;

    this.farmerService.reject(this.farmer.id).subscribe({
      next:  updated => { this.farmer = updated; },
      error: err     => { this.error  = err?.error?.message ?? 'Reject failed.'; },
    });
  }

  onApprove(): void {
    if (!this.farmer) return;
    if (!confirm(`Approve ${this.farmer.fullName} and notify the branch?`)) return;
    
    this.farmerService.approve(this.farmer.id).subscribe({
      next:  updated => { this.farmer = updated;
        //redirect admin back to list after approval
        this.router.navigate(['/cooperative/farmers']);
       },
      error: err     => { this.error  = err?.error?.message ?? 'Approve failed.'; },
    });
  }
}
