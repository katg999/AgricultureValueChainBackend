// CooperativePaymentBatchFarmersComponent shows the farmers for ONE batch, the same
// Day -> Session breakdown as the branch-side BatchFarmersComponent, but reachable
// for any branch's batch (not just the logged-in branch's) and read-only.

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { PaymentBatchService } from '../../../../branch/finance/services/payment-batch.service';
import { DayGroup, FarmerRecord, PaymentBatch } from '../../../../branch/finance/models/batch.models';
import { DeliverySession } from '../../../../branch/collections/branch.delivery.model';
import { DeliverySessionConfigService } from '../../../../../core/services/delivery-session-config.service';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cooperative-payment-batch-farmers',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './payment-batch-farmers.component.html',
  styleUrl: './payment-batch-farmers.component.css',
})
export class CooperativePaymentBatchFarmersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(PaymentBatchService);
  private readonly sessionConfig = inject(DeliverySessionConfigService);

  batch: PaymentBatch | undefined;
  farmers: FarmerRecord[] = [];
  dayGroups: DayGroup[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.svc.getAllFarmersAcrossBranches().subscribe(() => {
      this.batch = this.svc.getBatchByIdAcrossBranches(id);
      this.farmers = this.svc.getFarmersForBatchAcrossBranches(id);
      this.dayGroups = this.svc.groupFarmersByDayAndSession(this.farmers);
    });
  }

  get totalAmount(): number {
    return this.farmers.reduce((sum, f) => sum + f.netPayable, 0);
  }

  goBack(): void {
    this.router.navigate(['/cooperative/finance/payment-batches']);
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
