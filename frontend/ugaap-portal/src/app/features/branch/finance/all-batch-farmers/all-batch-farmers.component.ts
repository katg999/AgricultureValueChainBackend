// AllBatchFarmersComponent shows the full pool of farmers that exist in the system.
// It's a read-only list — no editing here, just search and browse.
// Accessible from the batch list at /branch/finance/farmers.

import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// combineLatest listens to two streams at once — farmer list AND search term.
// Whenever either changes, it re-runs the filter automatically.
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

import { PaymentBatchService } from '../services/payment-batch.service';
import { FarmerRecord } from '../models/batch.models';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';

@Component({
  selector: 'app-all-batch-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe, DataTableComponent, CellDirective],
  templateUrl: './all-batch-farmers.component.html',
  styleUrls: ['./all-batch-farmers.component.css'],
})
export class AllBatchFarmersComponent implements OnInit {
  // '!' = assigned in ngOnInit, not here — TypeScript needs reassurance it won't be undefined.
  filteredFarmers$!: Observable<FarmerRecord[]>;

  readonly cols: TableColumn[] = [
    { key: 'farmerId',      header: 'Farmer ID',      class: 'mono' },
    { key: 'fullName',      header: 'Name' },
    { key: 'commodity',     header: 'Commodity' },
    { key: 'branch',        header: 'Branch' },
    { key: 'deliveryDate',  header: 'Delivery Date',  class: 'mono' },
    { key: 'paymentMethod', header: 'Payment Method' },
    { key: 'netPayable',    header: 'Net Payable',    align: 'right', class: 'mono' },
  ];

  private readonly svc = inject(PaymentBatchService);
  private readonly router = inject(Router);

  // Bound to the search input via [(ngModel)] in the template.
  searchTerm = '';

  // BehaviorSubject holds the current search term as a stream.
  // Starts empty ('') = no filter = show all farmers.
  private readonly search$ = new BehaviorSubject('');

  ngOnInit(): void {
    // Combine the full farmer list with the search stream.
    // Every time search$ emits a new value, this re-runs and the template re-renders.
    this.filteredFarmers$ = combineLatest([this.svc.getAllFarmers(), this.search$]).pipe(
      map(([farmers, term]) => this.filter(farmers, term)),
    );
  }

  // Called by (input) event in the template — pushes the trimmed lowercase term to search$.
  // trim() removes accidental spaces; toLowerCase() makes the search case-insensitive.
  applySearch(): void {
    this.search$.next(this.searchTerm.trim().toLowerCase());
  }

  goBack(): void {
    this.router.navigate(['/branch/finance/batch-processing']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // trackById helps Angular avoid re-rendering rows that haven't changed.
  // _i is the index (prefixed with _ to signal we intentionally don't use it).
  trackById(_i: number, f: FarmerRecord): string {
    return f.farmerId;
  }

  // Searches across multiple fields — farmer might type a name, ID, commodity, or branch.
  // If term is empty, return the full list unchanged.
  private filter(farmers: FarmerRecord[], term: string): FarmerRecord[] {
    if (!term) return farmers;
    return farmers.filter(f =>
      f.farmerId.toLowerCase().includes(term) ||
      f.fullName.toLowerCase().includes(term) ||
      f.commodity.toLowerCase().includes(term) ||
      f.branch.toLowerCase().includes(term),
    );
  }
}
