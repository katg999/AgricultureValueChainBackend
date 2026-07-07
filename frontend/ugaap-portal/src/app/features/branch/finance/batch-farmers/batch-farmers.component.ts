// BatchFarmersComponent shows the farmers for ONE specific batch.
// It reads the batch ID from the URL (e.g. /branch/finance/batch/BATCH-001/farmers)
// and loads only the eligible farmers that match that batch's filters.
// Once the batch is Approved, this is also where an officer disburses it.

import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PaymentBatchService } from '../services/payment-batch.service';
import { PaymentService, computePayoutFee, defaultPayoutChannel } from '../services/payment.service';
import {
  DayGroup,
  FarmerRecord,
  PaymentBatch,
  PayoutChannel,
  PayoutTransaction,
} from '../models/batch.models';
import { DeliverySession } from '../../collections/branch.delivery.model';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BatchFlowStatusComponent } from '../../../../shared/components/batch-flow-status/batch-flow-status.component';

const ALL_PAYOUT_CHANNELS: PayoutChannel[] = ['MTN', 'AIRTEL', 'WENDI', 'POSTBANK'];

@Component({
  selector: 'app-batch-farmers',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, BadgeComponent, ButtonComponent, BatchFlowStatusComponent],
  templateUrl: './batch-farmers.component.html',
  styleUrls: ['./batch-farmers.component.css'],
})
export class BatchFarmersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(PaymentBatchService);
  private readonly paymentService = inject(PaymentService);
  private readonly sessionConfig = inject(DeliverySessionConfigService);
  private readonly destroyRef = inject(DestroyRef);

  // undefined until ngOnInit runs and finds the batch. The template handles the undefined case.
  batch: PaymentBatch | undefined;
  farmers: FarmerRecord[] = [];

  // Same farmers as above, organised for payment processing: each day broken
  // into its (up to) 3 sessions, in chronological/session order.
  dayGroups: DayGroup[] = [];

  readonly channelOptions = ALL_PAYOUT_CHANNELS;
  // Officer-editable channel per farmer, seeded from defaultPayoutChannel().
  channelSelections = new Map<string, PayoutChannel>();
  // Live per-farmer transaction state, synced from PaymentService.
  transactions = new Map<string, PayoutTransaction>();
  // Set immediately on Disburse Batch click, before any request fires —
  // prevents a second click from re-initiating the whole batch.
  isSubmitting = false;
  // Guards against calling updateBatchStatus more than once for the same batch.
  private batchMarkedDisbursed = false;
  // Farmer IDs sent out on the most recent Disburse Batch click — used to know
  // when every one of them has reached SOME tracked state (a transaction now
  // exists for this batch) so the button's loading state can be cleared. A
  // farmer whose POST never returned loses its transaction again (see
  // PaymentService.initiateSingle's catchError path), so this only fires once
  // per click, right after the synchronous INITIATED seed lands — not once
  // everything settles.
  private farmersAwaitingSubmit = new Set<string>();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.svc.getAllFarmers().subscribe(() => {
      this.batch = this.svc.getBatchById(id);
      this.farmers = this.svc.getFarmersForBatch(id); // only eligible farmers (hasBankDetails: true)
      this.dayGroups = this.svc.groupFarmersByDayAndSession(this.farmers);

      for (const farmer of this.farmers) {
        const channel = defaultPayoutChannel(farmer.paymentMethod);
        if (channel) this.channelSelections.set(farmer.farmerId, channel);
      }

      // Resume tracking any payout already in flight from before a refresh.
      this.paymentService.checkPendingPayouts(id).subscribe();
    });

    this.paymentService.watchTransactions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(transactions => {
        this.transactions = transactions;
        this.maybeCompleteBatch();
        this.maybeResetSubmitting();
      });
  }

  // A getter recalculates every time the template reads it.
  // reduce() walks the array, accumulating a running total.
  get totalAmount(): number {
    return this.farmers.reduce((sum, f) => sum + f.netPayable, 0);
  }

  // Cash farmers can't be paid through this flow — excluded the same way
  // hasBankDetails: false farmers are already excluded from a batch.
  get eligibleFarmers(): FarmerRecord[] {
    return this.farmers.filter(f => f.paymentMethod !== 'Cash');
  }

  // transactions$ is a session-wide singleton keyed only by farmerId, so a
  // stale transaction from a DIFFERENT batch (e.g. an earlier disbursement of
  // the same farmer in another Approved batch) can still be sitting in the
  // map. Scoping to this.batch.id here means every other method that goes
  // through transactionFor() automatically only ever sees this batch's own
  // transactions — the one guard covers all of them.
  transactionFor(farmerId: string): PayoutTransaction | undefined {
    const transaction = this.transactions.get(farmerId);
    if (!transaction || transaction.batchId !== this.batch?.id) return undefined;
    return transaction;
  }

  channelFor(farmerId: string): PayoutChannel | undefined {
    return this.channelSelections.get(farmerId);
  }

  setChannel(farmerId: string, channel: PayoutChannel): void {
    this.channelSelections.set(farmerId, channel);
  }

  // Locked once a transaction exists for THIS batch AND it's not retry-eligible
  // — i.e. it's genuinely in flight (INITIATED/VALIDATING/FUNDS_LOCKED/
  // CHANNEL_PROCESSING) or already done (SETTLED). A FAILED_REVERSED or
  // TIER_LIMIT_EXCEEDED transaction stays editable: TIER_LIMIT_EXCEEDED in
  // particular means "too big for this channel's tier", so retry must let the
  // officer pick a different channel, not force the exact one that just
  // failed. A transaction from a different batch (same farmer, different
  // disbursement) must not lock this batch's dropdown either.
  isChannelLocked(farmerId: string): boolean {
    return !!this.transactionFor(farmerId) && !this.canRetry(farmerId);
  }

  feeFor(farmer: FarmerRecord): number {
    const channel = this.channelFor(farmer.farmerId);
    return channel ? computePayoutFee(channel, farmer.netPayable) : 0;
  }

  // A farmer needs a fresh attempt — TIER_LIMIT_EXCEEDED is a validation
  // rejection, FAILED_REVERSED is a channel failure; neither resolves itself.
  canRetry(farmerId: string): boolean {
    const status = this.transactionFor(farmerId)?.status;
    return status === 'FAILED_REVERSED' || status === 'TIER_LIMIT_EXCEEDED';
  }

  get hasFailures(): boolean {
    return this.eligibleFarmers.some(f => this.canRetry(f.farmerId));
  }

  get settledCount(): number {
    return this.eligibleFarmers.filter(f => this.transactionFor(f.farmerId)?.status === 'SETTLED').length;
  }

  retry(farmer: FarmerRecord): void {
    if (!this.batch) return;
    const channel = this.channelSelections.get(farmer.farmerId);
    if (!channel) return;
    this.paymentService.retryFarmer(this.batch.id, farmer, channel);
  }

  private maybeCompleteBatch(): void {
    if (!this.batch || this.batchMarkedDisbursed || this.eligibleFarmers.length === 0) return;

    const allSettled = this.eligibleFarmers.every(
      f => this.transactionFor(f.farmerId)?.status === 'SETTLED',
    );

    if (allSettled) {
      this.batchMarkedDisbursed = true;
      this.svc.updateBatchStatus(this.batch.id, 'Disbursed');
    }
  }

  disburseBatch(): void {
    if (!this.batch || this.isSubmitting) return;
    this.isSubmitting = true;

    const farmersToPay = this.eligibleFarmers
      .filter(f => !this.transactionFor(f.farmerId))
      .map(f => ({ ...f, payoutChannel: this.channelSelections.get(f.farmerId)! }));

    this.farmersAwaitingSubmit = new Set(farmersToPay.map(f => f.farmerId));
    this.paymentService.disburseBatch(this.batch.id, farmersToPay);
    // disburseBatch() above seeds each farmer's transaction synchronously
    // (BehaviorSubject notifies the watchTransactions() subscription inline),
    // so maybeResetSubmitting already ran via that callback by the time we
    // get here for the normal case. This extra call only matters when
    // farmersToPay is empty (nothing left to (re-)disburse) — no upsert means
    // no subscription emission, so nothing would otherwise clear the spinner.
    this.maybeResetSubmitting();
  }

  // Clears the Disburse Batch button's loading state once every farmer from
  // the most recent click has a transaction for this batch — which happens
  // synchronously (INITIATED is seeded before any POST fires), so this
  // effectively fires right after disburseBatch(), not once everything
  // settles. Guarded on isSubmitting so it's a no-op once already cleared.
  // An empty farmersAwaitingSubmit (nothing needed disbursing) is vacuously
  // "all tracked" and resets immediately.
  private maybeResetSubmitting(): void {
    if (!this.isSubmitting) return;
    const allTracked = [...this.farmersAwaitingSubmit].every(id => !!this.transactionFor(id));
    if (allTracked) {
      this.isSubmitting = false;
      this.farmersAwaitingSubmit.clear();
    }
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
