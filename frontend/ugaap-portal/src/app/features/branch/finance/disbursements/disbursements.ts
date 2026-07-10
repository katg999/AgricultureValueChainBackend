// DisbursementsComponent lists batches that are Approved and ready to be paid out.
// It exists as its own Finance nav entry so branch staff can jump straight into a
// batch's payout screen, instead of finding it via Batch Processing's kebab menu
// ("View Farmers"). Clicking Disburse here lands on that same page —
// BatchFarmersComponent — where the actual per-farmer disbursement happens.
//
// The stat tiles at the top (Draft/Pending/Approved/Disbursed counts) live here
// too — this is the page dedicated to a batch's payment status, so the full
// lifecycle breakdown belongs next to it rather than on Batch Processing.

import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';

import { PaymentBatchService } from '../services/payment-batch.service';
import { PaymentBatch, ActiveBatchStatus } from '../models/batch.models';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { StatCardComponent, StatCardData } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-disbursements',
  standalone: true,
  imports: [CommonModule, AsyncPipe, DataTableComponent, CellDirective, StatCardComponent],
  templateUrl: './disbursements.html',
  styleUrls: ['./disbursements.css'],
})
export class DisbursementsComponent implements OnInit {
  // '!' = assigned in ngOnInit, not here.
  readyBatches$!: Observable<PaymentBatch[]>;

  batchStats: StatCardData[] = [];

  readonly cols: TableColumn[] = [
    { key: 'id',              header: 'Batch ID',     class: 'mono' },
    { key: 'batchName',       header: 'Batch Name' },
    { key: 'season',          header: 'Season' },
    { key: 'commodityFilter', header: 'Commodity' },
    { key: 'farmerCount',     header: 'Farmers',      align: 'right' },
    { key: 'totalAmount',     header: 'Total Amount', align: 'right', class: 'mono' },
    { key: 'actions',         header: 'Actions' },
  ];

  private readonly svc = inject(PaymentBatchService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.readyBatches$ = this.svc.getBatches().pipe(
      map(batches => batches.filter(b => b.status === 'Approved')),
    );

    this.svc.getBatchStatusCounts().subscribe(counts => {
      this.batchStats = this.buildBatchStatCards(counts);
    });
  }

  disburse(batch: PaymentBatch): void {
    this.router.navigate(['/branch/finance/batch', batch.id, 'farmers']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // trackById helps Angular avoid re-rendering rows that haven't changed.
  trackById(_i: number, b: PaymentBatch): string {
    return b.id;
  }

  // buildBatchStatCards() returns a fresh array each emission, so without an
  // identity key Angular treats every re-emission as all-new items and
  // destroys/recreates each app-stat-card — re-triggering its count-up
  // animation. label is stable across emissions (only the value changes).
  trackByLabel(_i: number, stat: StatCardData): string {
    return stat.label;
  }

  // route points back to Batch Processing — the full, filterable batch list —
  // since this page only ever shows the Approved subset.
  private buildBatchStatCards(counts: Record<ActiveBatchStatus, number>): StatCardData[] {
    return [
      {
        label: 'Draft Batches', value: counts['Draft'], icon: 'clipboard',
        status: 'active', route: '/branch/finance/batch-processing',
      },
      {
        label: 'Pending Approval', value: counts['Pending Approval'], icon: 'clock',
        status: counts['Pending Approval'] > 0 ? 'warning' : 'active',
        route: '/branch/finance/batch-processing',
      },
      {
        label: 'Approved Batches', value: counts['Approved'], icon: 'check',
        status: 'active', route: '/branch/finance/batch-processing',
      },
      {
        label: 'Disbursed Batches', value: counts['Disbursed'], icon: 'wallet',
        status: 'active', route: '/branch/finance/batch-processing',
      },
    ];
  }
}
