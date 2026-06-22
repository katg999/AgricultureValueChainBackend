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

//  Local interfaces (table row shapes — only used in this component) 

export interface ProfileTab {
  key:   string;
  label: string;
  badge?: number;
  badgeVariant?: BadgeVariant;
}

interface InputAllocation {
  item:           string;
  quantity:       string;
  value:          number;
  issueDate:      string;
  recoveryStatus: 'settled' | 'partial' | 'overdue';
}

interface ProduceDelivery {
  crop:             string;
  weight:           string;
  collectionCentre: string;
  date:             string;
  grade:            string;
  value:            number;
}

interface BalanceLine {
  description: string;
  principal:   number;
  recovered:   number;
  outstanding: number;
  dueDate:     string;
  status:      'settled' | 'partial' | 'overdue';
}

interface Repayment {
  date:      string;
  method:    string;
  amount:    number;
  reference: string;
  status:    'settled' | 'pending';
}

interface FarmerNotification {
  title:     string;
  channel:   string;
  date:      string;
  status:    'open' | 'closed';
  readState: 'Unread' | 'Read';
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

  // Static detail tables (will come from API in a future iteration) 
  readonly inputAllocations: InputAllocation[] = [
    { item: 'NPK Fertilizer',   quantity: '8 Bags',        value: 640000, issueDate: '18 Jan 2024', recoveryStatus: 'partial'  },
    { item: 'Coffee Seedlings', quantity: '250 Seedlings',  value: 375000, issueDate: '22 Jan 2024', recoveryStatus: 'settled'  },
    { item: 'Pesticide Kit',    quantity: '3 Kits',         value: 210000, issueDate: '04 Feb 2024', recoveryStatus: 'overdue'  },
  ];

  readonly deliveries: ProduceDelivery[] = [
    { crop: 'Coffee', weight: '420 Kg', collectionCentre: 'Kasese Coffee Growers Union', date: '16 Mar 2024', grade: 'A', value: 2520000 },
    { crop: 'Maize',  weight: '180 Kg', collectionCentre: 'Kasese Coffee Growers Union', date: '28 Mar 2024', grade: 'B', value:  324000 },
    { crop: 'Vanilla',weight: '32 Kg',  collectionCentre: 'Kasese Coffee Growers Union', date: '09 Apr 2024', grade: 'A', value:  960000 },
  ];

  readonly balanceLines: BalanceLine[] = [
    { description: 'NPK Fertilizer allocation',    principal: 640000, recovered: 360000, outstanding: 280000, dueDate: '30 Apr 2024', status: 'partial'  },
    { description: 'Coffee seedlings allocation',  principal: 375000, recovered: 375000, outstanding:      0, dueDate: '15 Apr 2024', status: 'settled'  },
    { description: 'Pesticide kit allocation',     principal: 210000, recovered:      0, outstanding: 210000, dueDate: '20 Apr 2024', status: 'overdue'  },
  ];

  readonly repayments: Repayment[] = [
    { date: '20 Mar 2024', method: 'Produce deduction', amount: 240000, reference: 'RCPT-2041', status: 'settled' },
    { date: '05 Apr 2024', method: 'Mobile money',      amount: 120000, reference: 'MM-88921',  status: 'settled' },
    { date: '18 Apr 2024', method: 'Branch cash desk',  amount:  75000, reference: 'BR-1209',   status: 'pending' },
  ];

  readonly notifications: FarmerNotification[] = [
    { title: 'Farm verification visit scheduled',            channel: 'SMS',          date: '18 Apr 2024', status: 'open',   readState: 'Unread' },
    { title: 'Outstanding pesticide kit balance reminder',   channel: 'SMS',          date: '15 Apr 2024', status: 'open',   readState: 'Unread' },
    { title: 'Coffee seedlings allocation recovered',        channel: 'Branch notice', date: '12 Apr 2024', status: 'closed', readState: 'Read'   },
  ];

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
