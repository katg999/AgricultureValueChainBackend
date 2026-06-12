import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, Subject, takeUntil } from 'rxjs';

import { SessionService } from '../../../../core/services/session.service';
import { Season } from '../../collections/branch.delivery.model';
import { BatchFarmerRecord, BatchRecord } from '../batch.model';
import { BatchService } from '../batch.service';

export interface BatchWithFarmers {
  batch: BatchRecord;
  farmers: BatchFarmerRecord[];
}

@Component({
  selector: 'app-all-batch-farmers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-batch-farmers.component.html',
  styleUrls: ['./all-batch-farmers.component.css'],
})
export class AllBatchFarmersComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private batches: BatchRecord[] = [];
  private allFarmers: BatchFarmerRecord[] = [];

  selectedSeason: '' | Season = '';
  readonly seasons: Season[] = ['Wet Season', 'Dry Season'];

  // ── Computed getters ───────────────────────────────────────────────────────

  get groups(): BatchWithFarmers[] {
    return this.batches
      .filter(b => !this.selectedSeason || b.season === this.selectedSeason)
      .map(batch => ({
        batch,
        farmers: this.allFarmers.filter(f => f.batchId === batch.id),
      }))
      .filter(g => g.farmers.length > 0);
  }

  get kpiFarmers(): BatchFarmerRecord[] {
    const visibleBatchIds = new Set(this.groups.map(g => g.batch.id));
    return this.allFarmers.filter(f => visibleBatchIds.has(f.batchId));
  }

  get totalCount(): number      { return this.kpiFarmers.length; }
  get totalGross(): number      { return this.kpiFarmers.reduce((s, f) => s + f.grossAmount, 0); }
  get totalDeductions(): number { return this.kpiFarmers.reduce((s, f) => s + f.deductions,  0); }
  get totalNet(): number        { return this.kpiFarmers.reduce((s, f) => s + f.netPayable,   0); }

  constructor(
    private readonly batchService: BatchService,
    private readonly router: Router,
    private readonly session: SessionService,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.batchService.batchesForRole$(this.session.branchId(), this.session.userRole()),
      this.batchService.farmers$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([batches, farmers]) => {
        this.batches    = batches;
        this.allFarmers = farmers;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setSeasonFilter(season: '' | Season): void {
    this.selectedSeason = season;
  }

  seasonClass(season: Season): string {
    return season === 'Wet Season' ? 'season-wet' : 'season-dry';
  }

  paymentLabel(farmer: BatchFarmerRecord): string {
    if (!farmer.payment) return '—';
    if (farmer.payment.method === 'mobile_money') return farmer.payment.provider;
    return 'Bank';
  }

  paymentBadgeClass(farmer: BatchFarmerRecord): string {
    if (!farmer.payment) return '';
    if (farmer.payment.method === 'mobile_money') {
      return farmer.payment.provider === 'MTN' ? 'pay-badge--mtn' : 'pay-badge--airtel';
    }
    return 'pay-badge--bank';
  }

  goToBatch(batch: BatchRecord): void {
    this.router.navigate(['/branch/finance/batch', batch.id, 'farmers']);
  }

  trackByBatchId(_i: number, g: BatchWithFarmers): string { return g.batch.id; }
  trackByFarmerId(_i: number, f: BatchFarmerRecord): string { return f.id; }

  formatUGX(value: number): string {
    return new Intl.NumberFormat('en-UG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
}
