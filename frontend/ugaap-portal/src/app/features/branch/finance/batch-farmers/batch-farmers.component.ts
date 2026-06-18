// BatchFarmersComponent shows the farmers for ONE specific batch.
// It reads the batch ID from the URL (e.g. /branch/finance/batch/BATCH-001/farmers)
// and loads only the eligible farmers that match that batch's filters.

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// ActivatedRoute = gives you access to the current URL's parameters, query strings, etc.
import { ActivatedRoute, Router } from '@angular/router';

import { PaymentBatchService } from '../services/payment-batch.service';
import { DayGroup, FarmerRecord, PaymentBatch } from '../models/batch.models';
import { DeliverySession } from '../../collections/branch.delivery.model';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';

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
  private readonly sessionConfig = inject(DeliverySessionConfigService);

  // undefined until ngOnInit runs and finds the batch. The template handles the undefined case.
  batch: PaymentBatch | undefined;
  farmers: FarmerRecord[] = [];

  // Same farmers as above, organised for payment processing: each day broken
  // into its (up to) 3 sessions, in chronological/session order.
  dayGroups: DayGroup[] = [];

  ngOnInit(): void {
    // snapshot = read the URL once right now (not reactively).
    // paramMap.get('id') reads the :id segment from the route definition.
    // ?? '' = if somehow there's no ID, fall back to empty string (won't match any batch).
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    // getAllFarmers() kicks off the real fetch and emits the current pool immediately
    // (mock seed first), then again if/when a live response arrives — re-deriving here
    // means this page picks up real data without needing a manual refresh.
    this.svc.getAllFarmers().subscribe(() => {
      this.batch = this.svc.getBatchById(id);
      this.farmers = this.svc.getFarmersForBatch(id); // only eligible farmers (hasBankDetails: true)
      this.dayGroups = this.svc.groupFarmersByDayAndSession(this.farmers);
    });
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

  sessionLabel(id: DeliverySession | null): string {
    return this.sessionConfig.getLabel(id ?? undefined);
  }
}
