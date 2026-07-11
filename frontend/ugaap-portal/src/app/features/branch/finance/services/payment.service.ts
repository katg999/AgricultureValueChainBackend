// PaymentService disburses an approved batch to farmers via MTN, Airtel,
// Wendi, or PostBank, and tracks each farmer's payout transaction until it
// settles. Follows the same USE_MOCK-branching convention as
// PaymentBatchService — no HttpInterceptor, no separate mock JSON asset.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval, of, timer } from 'rxjs';
import { catchError, switchMap, takeWhile, tap, timeout } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { USE_MOCK } from '../../../../core/mock/mock-config';
import {
  FarmerRecord,
  PaymentMethod,
  PayoutChannel,
  PayoutTransaction,
  PayoutTransactionStatus,
} from '../models/batch.models';

const POLL_INTERVAL_MS = 2000;

// Statuses that mean "this attempt is done" — either it settled, or it needs
// a fresh retry (TIER_LIMIT_EXCEEDED is a validation rejection, not a step
// that resolves on its own, so it's terminal too).
const TERMINAL_PAYOUT_STATUSES: PayoutTransactionStatus[] = [
  'SETTLED',
  'FAILED_REVERSED',
  'TIER_LIMIT_EXCEEDED',
];

export function isTerminalPayoutStatus(status: PayoutTransactionStatus): boolean {
  return TERMINAL_PAYOUT_STATUSES.includes(status);
}

// Fee shown to the officer before confirming — display only. The backend
// recalculates and enforces the real fee; this never gets sent as the amount.
export function computePayoutFee(channel: PayoutChannel, amount: number): number {
  const rounded = Math.round(amount);
  if (channel === 'MTN' || channel === 'AIRTEL') return Math.round(rounded * 0.015) + 500;
  if (channel === 'POSTBANK') return 1000;
  return 0; // WENDI
}

// FarmerRecord.paymentMethod is a coarse category from batch creation; it
// can't tell us the real telco or confirm PostBank routing. This is only a
// starting guess — the UI always lets the officer edit it before disbursing.
export function defaultPayoutChannel(paymentMethod: PaymentMethod): PayoutChannel | null {
  if (paymentMethod === 'Mobile Money') return 'MTN';
  if (paymentMethod === 'Bank Transfer') return 'POSTBANK';
  return null; // Cash — not eligible for digital payout
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  // Keyed by farmerId — one active/most-recent transaction per farmer.
  private readonly transactions$ = new BehaviorSubject<Map<string, PayoutTransaction>>(new Map());

  // One poll subscription per in-flight transactionId, torn down individually
  // once that transaction reaches a terminal state.
  private readonly pollSubscriptions = new Map<string, Subscription>();

  // Mock-mode timer() subscriptions for the three progression steps, keyed by
  // farmerId — lets a retry cancel a still-running prior attempt's timers
  // before they can fire and clobber the retry's transaction with stale data.
  private readonly mockTimerSubscriptions = new Map<string, Subscription[]>();

  // Real-mode initial POST subscription, keyed by farmerId — the POST can
  // still be in flight (up to the 5s timeout) when a retry fires; without
  // tracking it, cancelInFlightTracking has no way to stop the stale response
  // from later overwriting the retry's transaction or starting an orphaned
  // poll. Cleared here once the POST settles on its own (success or error).
  private readonly postSubscriptions = new Map<string, Subscription>();

  constructor(private readonly http: HttpClient) {}

  watchTransactions(): Observable<Map<string, PayoutTransaction>> {
    return this.transactions$.asObservable();
  }

  disburseBatch(batchId: string, farmers: Array<FarmerRecord & { payoutChannel: PayoutChannel }>): void {
    farmers.forEach(farmer => this.initiateSingle(batchId, farmer, farmer.payoutChannel));
  }

  retryFarmer(batchId: string, farmer: FarmerRecord, channel: PayoutChannel): void {
    this.initiateSingle(batchId, farmer, channel);
  }

  // Called on batch-farmers.component init — resumes tracking any payout
  // that was already in flight before a page refresh, instead of showing a
  // blank table for farmers whose disbursement is still processing.
  checkPendingPayouts(batchId: string): Observable<PayoutTransaction[]> {
    if (!USE_MOCK) {
      return this.http.get<PayoutTransaction[]>(API_ENDPOINTS.BRANCH.PAYOUTS_PENDING(batchId)).pipe(
        timeout(5000),
        tap(rows => {
          rows.forEach(t => this.upsertTransaction(t));
          rows.filter(t => !isTerminalPayoutStatus(t.status)).forEach(t => this.startPolling(t.transactionId));
        }),
        catchError(() => of([] as PayoutTransaction[])),
      );
    }
    // Mock state lives only in memory for this session — same as every other
    // USE_MOCK service here, there's nothing to resume after a real refresh.
    return of([]);
  }

  private initiateSingle(batchId: string, farmer: FarmerRecord, channel: PayoutChannel): void {
    // A retry before the previous attempt settled must not let that attempt's
    // still-pending timers/poll go on to overwrite what we're about to seed.
    this.cancelInFlightTracking(farmer.farmerId);

    const amount = Math.round(farmer.netPayable);
    const idempotencyKey = crypto.randomUUID();

    const transaction: PayoutTransaction = {
      transactionId: idempotencyKey, // placeholder until the backend assigns a real one
      farmerId: farmer.farmerId,
      batchId,
      channel,
      amount,
      status: 'INITIATED',
      idempotencyKey,
      createdAt: new Date(),
    };
    this.upsertTransaction(transaction);

    if (USE_MOCK) {
      this.simulateMockProgression(transaction);
      return;
    }

    const postSub = this.http.post<PayoutTransaction>(API_ENDPOINTS.BRANCH.PAYOUTS, {
      farmerId: farmer.farmerId,
      batchId,
      channel,
      amount,
      idempotencyKey,
    }).pipe(
      timeout(5000),
      catchError(() => of(null)),
    ).subscribe(response => {
      // The request has settled on its own (success or caught error) — this
      // farmer no longer has a POST in flight, so cancelInFlightTracking has
      // nothing left to cancel for it.
      this.postSubscriptions.delete(farmer.farmerId);
      if (!response) {
        // The POST itself never returned (timeout or network error) — there is
        // no backend status for this, and the transaction was only ever a
        // local INITIATED placeholder (see above, seeded before the POST was
        // even sent). Leaving that placeholder behind would strand the farmer
        // looking permanently "in flight" with no poll ever started. Removing
        // it instead makes transactionFor() report no transaction again — the
        // UI reverts that row to "not started", and the next Disburse Batch
        // click naturally retries them (its filter only includes farmers with
        // no transaction).
        this.removeTransaction(farmer.farmerId);
        return;
      }
      this.upsertTransaction(response);
      if (!isTerminalPayoutStatus(response.status)) this.startPolling(response.transactionId);
    });
    this.postSubscriptions.set(farmer.farmerId, postSub);
  }

  // Never setTimeout — timer() is how backend latency is simulated here, per
  // the same rule real HTTP calls follow (no client code deciding outcomes
  // via ad hoc timers).
  private simulateMockProgression(transaction: PayoutTransaction): void {
    const outcome: PayoutTransactionStatus = Math.floor(Math.random() * 6) === 0 ? 'FAILED_REVERSED' : 'SETTLED';
    const steps: Array<{ delayMs: number; status: PayoutTransactionStatus }> = [
      { delayMs: 800, status: 'VALIDATING' },
      { delayMs: 1600, status: 'CHANNEL_PROCESSING' },
      { delayMs: 2400, status: outcome },
    ];
    // Tracked per-farmer so a retry can cancel these before they fire — see
    // cancelInFlightTracking.
    const subs = steps.map(step =>
      timer(step.delayMs).subscribe(() => {
        this.upsertTransaction({ ...transaction, status: step.status });
      }),
    );
    this.mockTimerSubscriptions.set(transaction.farmerId, subs);
  }

  // Tears down whatever's still in flight from a previous attempt for this
  // farmer — mock-mode timers, a real-mode poll, and/or a real-mode initial
  // POST — before initiateSingle seeds a new transaction. Without this, a
  // retry issued before the prior attempt reached a terminal state races the
  // old attempt's late callbacks, which can overwrite the retry's transaction
  // with stale status (or, for the POST, start an orphaned poll keyed by a
  // transactionId the retry has no way to look up again).
  private cancelInFlightTracking(farmerId: string): void {
    const mockSubs = this.mockTimerSubscriptions.get(farmerId);
    if (mockSubs) {
      mockSubs.forEach(sub => sub.unsubscribe());
      this.mockTimerSubscriptions.delete(farmerId);
    }

    const postSub = this.postSubscriptions.get(farmerId);
    if (postSub) {
      postSub.unsubscribe();
      this.postSubscriptions.delete(farmerId);
    }

    // pollSubscriptions is keyed by transactionId, not farmerId, so look up
    // the farmer's current (about-to-be-replaced) transaction to find it.
    const priorTransaction = this.transactions$.value.get(farmerId);
    if (priorTransaction) {
      const pollSub = this.pollSubscriptions.get(priorTransaction.transactionId);
      if (pollSub) {
        pollSub.unsubscribe();
        this.pollSubscriptions.delete(priorTransaction.transactionId);
      }
    }
  }

  private startPolling(transactionId: string): void {
    if (this.pollSubscriptions.has(transactionId)) return; // already polling

    const sub = interval(POLL_INTERVAL_MS).pipe(
      switchMap(() => this.http.get<PayoutTransaction>(API_ENDPOINTS.BRANCH.PAYOUT_BY_ID(transactionId)).pipe(
        timeout(5000),
        catchError(() => of(null)),
      )),
      takeWhile(t => t === null || !isTerminalPayoutStatus(t.status), true), // emit the terminal value, then stop
    ).subscribe(t => {
      if (t) this.upsertTransaction(t);
      if (t && isTerminalPayoutStatus(t.status)) this.pollSubscriptions.delete(transactionId);
    });

    this.pollSubscriptions.set(transactionId, sub);
  }

  private upsertTransaction(transaction: PayoutTransaction): void {
    const next = new Map(this.transactions$.value);
    next.set(transaction.farmerId, transaction);
    this.transactions$.next(next);
  }

  // Used only when a real-mode POST never returns a response at all (see
  // initiateSingle's catchError path) — drops the local placeholder so the
  // farmer goes back to having no transaction, rather than staying stuck.
  private removeTransaction(farmerId: string): void {
    const next = new Map(this.transactions$.value);
    next.delete(farmerId);
    this.transactions$.next(next);
  }
}
