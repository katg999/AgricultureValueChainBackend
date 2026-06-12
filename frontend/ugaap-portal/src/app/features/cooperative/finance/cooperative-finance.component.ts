import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { Season } from '../../branch/collections/branch.delivery.model';
import { BatchRecord, BatchStatus } from '../../branch/finance/batch.model';
import { BatchService } from '../../branch/finance/batch.service';

const BRANCH_NAMES: Record<string, string> = {
  'BR-MBL': 'Mbale West',
  'BR-MBA': 'Mbarara South',
  'BR-GUL': 'Gulu North',
  'BR-KIB': 'Kiboga Central',
  'BR-LIR': 'Lira Town',
  'BR-FTP': 'Fort Portal West',
  'BR-ADJ': 'Adjumani East',
};

export interface BranchBatchGroup {
  branchId: string;
  branchName: string;
  batches: BatchRecord[];
}

@Component({
  selector: 'app-cooperative-finance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cooperative-finance.component.html',
  styleUrls: ['./cooperative-finance.component.css'],
})
export class CooperativeFinanceComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private allBatches: BatchRecord[] = [];

  selectedSeason: '' | Season = '';
  readonly statusOptions: BatchStatus[] = ['pending', 'processed', 'settled'];

  constructor(private readonly batchService: BatchService) {}

  ngOnInit(): void {
    this.batchService.batches$
      .pipe(takeUntil(this.destroy$))
      .subscribe(batches => { this.allBatches = batches; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private get visibleBatches(): BatchRecord[] {
    if (!this.selectedSeason) return this.allBatches;
    return this.allBatches.filter(b => b.season === this.selectedSeason);
  }

  get branchGroups(): BranchBatchGroup[] {
    const map = new Map<string, BatchRecord[]>();
    for (const batch of this.visibleBatches) {
      const arr = map.get(batch.branchId) ?? [];
      arr.push(batch);
      map.set(batch.branchId, arr);
    }
    return Array.from(map.entries()).map(([branchId, batches]) => ({
      branchId,
      branchName: BRANCH_NAMES[branchId] ?? branchId,
      batches,
    }));
  }

  get totalBatches(): number  { return this.visibleBatches.length; }
  get pendingCount(): number  { return this.visibleBatches.filter(b => b.status === 'pending').length; }
  get totalFarmers(): number  { return this.visibleBatches.reduce((s, b) => s + b.farmerCount, 0); }
  get totalNet(): number      { return this.visibleBatches.reduce((s, b) => s + b.netPayable, 0); }

  setSeasonFilter(season: '' | Season): void { this.selectedSeason = season; }

  seasonClass(season: Season): string {
    return season === 'Wet Season' ? 'season-wet' : 'season-dry';
  }

  onStatusChange(batchId: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as BatchStatus;
    this.batchService.updateBatchStatus(batchId, status);
  }

  trackByBranchId(_i: number, g: BranchBatchGroup): string { return g.branchId; }
  trackByBatchId(_i: number, b: BatchRecord): string { return b.id; }

  formatUGX(value: number): string {
    return new Intl.NumberFormat('en-UG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
}
