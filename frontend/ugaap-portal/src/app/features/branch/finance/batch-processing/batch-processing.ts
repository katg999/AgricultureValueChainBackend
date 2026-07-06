// BatchProcessingComponent = the main batch list page.
// It shows all payment batches, lets you filter by status or search by name,
// and has a kebab menu on each row for actions (view farmers, submit, delete).

import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// combineLatest = merges two streams. Whenever EITHER changes, re-run the mapping function.
// shareReplay = prevents the HTTP call from re-firing when filterState$ changes.
import { BehaviorSubject, combineLatest, map, Observable, shareReplay } from 'rxjs';

import { PaymentBatchService } from '../services/payment-batch.service';
import { PaymentExportService } from '../services/payment-export.service';
import { PaymentBatch, BatchStatus } from '../models/batch.models';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';

@Component({
  selector: 'app-batch-processing',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe, DataTableComponent, CellDirective],
  templateUrl: './batch-processing.html',
  styleUrls: ['./batch-processing.css'],
})
export class BatchProcessingComponent implements OnInit, OnDestroy {
  // '!' = "trust me TypeScript, this WILL be set before it's used" (in ngOnInit).
  // Without it, TypeScript would complain that it might be undefined.
  filteredBatches$!: Observable<PaymentBatch[]>;
  totalBatchCount$!: Observable<number>;

  // These two-way-bind to the filter inputs in the template via [(ngModel)].
  searchTerm = '';
  selectedStatus = '';

  readonly batchCols: TableColumn[] = [
    { key: 'id',              header: 'Batch ID',     class: 'mono' },
    { key: 'batchName',       header: 'Batch Name' },
    { key: 'season',          header: 'Season' },
    { key: 'commodityFilter', header: 'Commodity' },
    { key: 'branch',          header: 'Branch' },
    { key: 'farmerCount',     header: 'Farmers',      align: 'right' },
    { key: 'totalAmount',     header: 'Total Amount', align: 'right', class: 'mono' },
    { key: 'status',          header: 'Status' },
    { key: 'actions',         header: 'Actions' },
  ];

  // Tracks which row's kebab menu is open. null = all menus closed.
  openActionMenuId: string | null = null;

  // Stores where to position the dropdown (calculated from the button's screen position).
  menuPosition: { top?: number; bottom?: number; right: number } = { right: 0 };

  // The tab buttons across the top — 'All' has an empty value so it doesn't filter anything.
  readonly statusTabs: Array<{ label: string; value: string }> = [
    { label: 'All',              value: '' },
    { label: 'Draft',            value: 'Draft' },
    { label: 'Pending Approval', value: 'Pending Approval' },
    { label: 'Approved',         value: 'Approved' },
    { label: 'Rejected',         value: 'Rejected' },
    { label: 'Disbursed',        value: 'Disbursed' },
  ];

  private readonly svc = inject(PaymentBatchService);
  private readonly exportSvc = inject(PaymentExportService);
  private readonly router = inject(Router);

  // filterState$ holds the current search+status values as a reactive stream.
  // When we call .next({...}), the filtered list automatically recalculates.
  private readonly filterState$ = new BehaviorSubject({ searchTerm: '', selectedStatus: '' });

  ngOnInit(): void {
    // shareReplay caches the last emitted value — so when filterState$ changes,
    // it doesn't re-trigger the HTTP fetch in getBatches().
    const batches$ = this.svc.getBatches().pipe(shareReplay({ bufferSize: 1, refCount: true }));

    this.totalBatchCount$ = batches$.pipe(map(b => b.length));

    // combineLatest watches both streams. Either one changing triggers a new filtered list.
    this.filteredBatches$ = combineLatest([batches$, this.filterState$]).pipe(
      map(([batches, filter]) => this.filterBatches(batches, filter)),
    );
  }

  // BehaviorSubject must be completed when the component is destroyed
  // to prevent memory leaks (it holds a reference that keeps the component alive).
  ngOnDestroy(): void {
    this.filterState$.complete();
  }

  // Called every time the search input changes — pushes a new value to filterState$.
  applyFilter(): void {
    this.filterState$.next({ searchTerm: this.searchTerm, selectedStatus: this.selectedStatus });
  }

  // Tab click handler — sets the status and triggers a re-filter.
  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.applyFilter();
  }

  goToCreateBatch(): void {
    this.router.navigate(['/branch/finance/batch-create']);
  }

  viewFarmers(batch: PaymentBatch): void {
    // Navigate to the dynamic route — Angular fills in batch.id for the :id segment.
    this.router.navigate(['/branch/finance/batch', batch.id, 'farmers']);
    this.openActionMenuId = null;
  }

  submitForApproval(batch: PaymentBatch): void {
    this.svc.updateBatchStatus(batch.id, 'Pending Approval');
    this.openActionMenuId = null;
  }

  deleteBatch(batch: PaymentBatch): void {
    this.svc.deleteBatch(batch.id);
    this.openActionMenuId = null;
  }

  // Builds and downloads the bank bulk-payment CSV for this batch.
  // Only available once a batch is past Draft — Draft means the batch isn't finalised yet.
  exportPaymentFile(batch: PaymentBatch): void {
    this.exportSvc.exportBatchPaymentFile(batch);
    this.openActionMenuId = null;
  }

  // Handles opening/closing the kebab dropdown.
  // Also calculates whether to position it above or below the button
  // (if there's not enough space below, flip it upward).
  toggleActionMenu(batchId: string, event: MouseEvent): void {
    event.stopPropagation(); // prevents the page-level click from immediately closing it
    if (this.openActionMenuId === batchId) {
      this.openActionMenuId = null; // clicking the same button closes it
      return;
    }
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect(); // gets the button's position on screen
    const right = window.innerWidth - rect.right;
    const dropdownHeight = 120;
    // If there's less than dropdownHeight pixels below the button, open upward instead.
    if (window.innerHeight - rect.bottom < dropdownHeight) {
      this.menuPosition = { bottom: window.innerHeight - rect.top + 4, right };
    } else {
      this.menuPosition = { top: rect.bottom + 4, right };
    }
    this.openActionMenuId = batchId;
  }

  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  // Maps each BatchStatus value to a CSS class name defined in the stylesheet.
  // Record<BatchStatus, string> = TypeScript ensures every status has an entry — no gaps.
  statusClass(status: BatchStatus): string {
    const classes: Record<BatchStatus, string> = {
      'Draft':            'status-draft',
      'Pending Approval': 'status-pending',
      'Approved':         'status-approved',
      'Rejected':         'status-rejected',
      'Disbursed':        'status-disbursed',
    };
    return classes[status];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // trackById tells Angular how to identify each table row.
  // Without it, Angular destroys and re-creates every row on each filter change.
  // With it, Angular only re-renders rows that actually changed — much more efficient.
  trackById(_index: number, item: PaymentBatch): string {
    return item.id;
  }

  // Filters the batch array by both search text and selected status tab.
  // 'private' means only this class can call it — components outside can't touch it.
  private filterBatches(
    batches: PaymentBatch[],
    filter: { searchTerm: string; selectedStatus: string },
  ): PaymentBatch[] {
    const term = filter.searchTerm.trim().toLowerCase();
    return batches.filter(b => {
      // If term is empty, !term is true = include everything (no search applied).
      const matchSearch =
        !term ||
        b.id.toLowerCase().includes(term) ||
        b.batchName.toLowerCase().includes(term) ||
        b.season.toLowerCase().includes(term) ||
        b.commodityFilter.toLowerCase().includes(term);
      // If no status tab is selected (value = ''), show all statuses.
      const matchStatus = !filter.selectedStatus || b.status === filter.selectedStatus;
      return matchSearch && matchStatus;
    });
  }
}
