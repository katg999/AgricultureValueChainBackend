// BatchFarmersComponent shows the farmers for ONE specific batch.
// It reads the batch ID from the URL (e.g. /branch/finance/batch/BATCH-001/farmers)
// and loads only the eligible farmers that match that batch's filters.

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// ActivatedRoute = gives you access to the current URL's parameters, query strings, etc.
import { ActivatedRoute, Router } from '@angular/router';

import { PaymentBatchService } from '../services/payment-batch.service';
import { FarmerRecord, PaymentBatch } from '../models/batch.models';

@Component({
  selector: 'app-batch-farmers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batch-farmers.component.html',
  styleUrls: ['./batch-farmers.component.css'],
})
export class BatchFarmersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(PaymentBatchService);

  // undefined until ngOnInit runs and finds the batch. The template handles the undefined case.
  batch: PaymentBatch | undefined;
  farmers: FarmerRecord[] = [];

  ngOnInit(): void {
    // snapshot = read the URL once right now (not reactively).
    // paramMap.get('id') reads the :id segment from the route definition.
    // ?? '' = if somehow there's no ID, fall back to empty string (won't match any batch).
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.batch = this.svc.getBatchById(id);
    this.farmers = this.svc.getFarmersForBatch(id); // only eligible farmers (hasBankDetails: true)
  }

  // A getter recalculates every time the template reads it.
  // reduce() walks the array, accumulating a running total.
  get totalAmount(): number {
    return this.farmers.reduce((sum, f) => sum + f.netPayable, 0);
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

  trackById(_i: number, f: FarmerRecord): string {
    return f.farmerId;
  }
}
