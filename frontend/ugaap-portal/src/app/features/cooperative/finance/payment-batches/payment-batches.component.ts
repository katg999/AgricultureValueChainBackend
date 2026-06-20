// features/cooperative/finance/payment-batches/payment-batches.component.ts
//
// Read-only, cooperative-wide view of PaymentBatchService's batches — the same
// batch system branch staff create/process under /branch/finance/*, just
// aggregated across every branch instead of scoped to one. No status changes
// here; that stays a branch-side action.

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay } from 'rxjs';

import { PaymentBatchService } from '../../../branch/finance/services/payment-batch.service';
import { BatchStatus, PaymentBatch } from '../../../branch/finance/models/batch.models';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

export interface BranchBatchGroup {
  branchId: string;
  branchName: string;
  batches: PaymentBatch[];
}

@Component({
  selector: 'app-cooperative-payment-batches',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCardComponent, EmptyStateComponent],
  templateUrl: './payment-batches.component.html',
  styleUrl: './payment-batches.component.css',
})
export class CooperativePaymentBatchesComponent implements OnInit {
  private readonly svc = inject(PaymentBatchService);
  private readonly router = inject(Router);

  filteredBatches$!: Observable<PaymentBatch[]>;

  searchTerm = '';
  selectedStatus = '';
  readonly statusOptions: BatchStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Disbursed'];

  private readonly filterState$ = new BehaviorSubject({ searchTerm: '', selectedStatus: '' });

  ngOnInit(): void {
    const batches$ = this.svc.getAllBatchesAcrossBranches().pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.filteredBatches$ = combineLatest([batches$, this.filterState$]).pipe(
      map(([batches, filter]) => this.filterBatches(batches, filter)),
    );
  }

  applyFilter(): void {
    this.filterState$.next({ searchTerm: this.searchTerm, selectedStatus: this.selectedStatus });
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.applyFilter();
  }

  // Groups the already-filtered batches by branch so the page reads as
  // "every branch's batches", not just one flat list.
  groupByBranch(batches: PaymentBatch[]): BranchBatchGroup[] {
    const byBranch = new Map<string, PaymentBatch[]>();
    for (const batch of batches) {
      const arr = byBranch.get(batch.branchId) ?? [];
      arr.push(batch);
      byBranch.set(batch.branchId, arr);
    }
    return Array.from(byBranch.entries()).map(([branchId, branchBatches]) => ({
      branchId,
      branchName: this.svc.getBranchName(branchId),
      batches: branchBatches,
    }));
  }

  viewFarmers(batch: PaymentBatch): void {
    this.router.navigate(['/cooperative/finance/payment-batches', batch.id, 'farmers']);
  }

  totalFarmers(batches: PaymentBatch[]): number {
    return batches.reduce((sum, b) => sum + b.farmerCount, 0);
  }

  totalAmount(batches: PaymentBatch[]): number {
    return batches.reduce((sum, b) => sum + b.totalAmount, 0);
  }

  pendingApprovalCount(batches: PaymentBatch[]): number {
    return batches.filter(b => b.status === 'Pending Approval').length;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  statusClass(status: BatchStatus): string {
    const map: Record<BatchStatus, string> = {
      'Draft': 'status-draft',
      'Pending Approval': 'status-pending',
      'Approved': 'status-approved',
      'Rejected': 'status-rejected',
      'Disbursed': 'status-disbursed',
    };
    return map[status];
  }

  trackByBranchId(_i: number, g: BranchBatchGroup): string {
    return g.branchId;
  }

  trackByBatchId(_i: number, b: PaymentBatch): string {
    return b.id;
  }

  private filterBatches(
    batches: PaymentBatch[],
    filter: { searchTerm: string; selectedStatus: string },
  ): PaymentBatch[] {
    const term = filter.searchTerm.trim().toLowerCase();
    return batches.filter(b => {
      const matchSearch =
        !term ||
        b.id.toLowerCase().includes(term) ||
        b.batchName.toLowerCase().includes(term) ||
        b.branch.toLowerCase().includes(term) ||
        b.season.toLowerCase().includes(term) ||
        b.commodityFilter.toLowerCase().includes(term);
      const matchStatus = !filter.selectedStatus || b.status === filter.selectedStatus;
      return matchSearch && matchStatus;
    });
  }
}
