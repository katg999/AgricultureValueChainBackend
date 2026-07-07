// PaymentBatchService is the brain of the branch finance feature.
// Components never talk to the API directly — they ask this service instead.
// That separation means if the API URL changes, you fix it in ONE place, not everywhere.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { SessionService } from '../../../../core/services/session.service';
import { ALL_DELIVERY_SESSIONS } from '../../collections/branch.delivery.model';
import {
  FarmerRecord,
  BatchFilterCriteria,
  PaymentBatch,
  BatchStatus,
  ActiveBatchStatus,
  DayGroup,
  SessionGroup,
} from '../models/batch.models';
import { MOCK_PAYMENT_BATCHES } from '../../../../core/mock/mock-branch';
import { MOCK_PAYMENT_FARMERS } from '../../../../core/mock/mock-farmer';
import { USE_MOCK } from '../../../../core/mock/mock-config';

// Display name for each branch this feature knows about — every batch/farmer record
// is scoped to exactly one of these via branchId, matched against the logged-in session.
const BRANCH_NAMES: Record<string, string> = {
  'BR-MBL': 'Mbale West',
  'BR-KAS': 'Kasese',
  'BR-MBA': 'Mbarara Branch',
};

// providedIn: 'root' = one shared instance for the whole app
@Injectable({ providedIn: 'root' })
export class PaymentBatchService {
  // Tracks the next ID to use when creating a batch locally (while no real API exists).
  private nextBatchId = 7; // seed data uses BATCH-001..BATCH-006

  // ── Reactive stores ────────────────────────────────────────────────────────
  // BehaviorSubject holds the current value AND emits it to any new subscriber immediately.
  // Think of it as a live variable — when you call .next(newValue), everyone watching updates.
  // [...spread] creates a copy so the seed data stays untouched.
  // When USE_MOCK is false, start empty — the real API call fills these.
  //
  // Seeded directly from the imported mock constants (not via an intermediate
  // `this.xSeed` field) — under this repo's Vitest/esbuild test builder,
  // specific combinations of test entry-point bundles have been observed to
  // execute class-field initializers out of declaration order, leaving a
  // same-class field referenced via `this.` still `undefined` at the point a
  // later field's initializer runs. Referencing the module-level constant
  // directly removes that cross-field ordering dependency entirely.
  private readonly batches$ = new BehaviorSubject<PaymentBatch[]>(USE_MOCK ? [...MOCK_PAYMENT_BATCHES] : []);
  private readonly farmers$ = new BehaviorSubject<FarmerRecord[]>(USE_MOCK ? [...(MOCK_PAYMENT_FARMERS as FarmerRecord[])] : []);

  // HttpClient is Angular's tool for making HTTP requests (GET, POST, DELETE, etc.)
  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  // Returns the live batch list as an Observable, scoped to the logged-in branch —
  // a branch only ever sees its own batches here. Cooperative-wide visibility across
  // every branch's batches uses getAllBatchesAcrossBranches() below instead.
  // Also kicks off a background HTTP fetch — if it succeeds, it updates the BehaviorSubject
  // and all subscribers get the fresh data automatically.
  // timeout(3000) = if the server takes more than 3 seconds, give up (don't freeze the UI).
  // catchError = if the request fails for any reason, do nothing — the seed data stays.
  getBatches(): Observable<PaymentBatch[]> {
    if (!USE_MOCK) {
      this.http.get<PaymentBatch[]>(API_ENDPOINTS.BRANCH.BATCHES).pipe(
        timeout(3000),
        tap(rows => this.batches$.next(rows)), // on success: replace seed with real data
        catchError(() => of(null)),            // on failure: silently ignore
      ).subscribe();
    }
    const branchId = this.session.branchId();
    return this.batches$.pipe(map(rows => rows.filter(b => b.branchId === branchId)));
  }

  // Per-status batch counts for the logged-in branch, for dashboard tiles.
  // Rejected is deliberately excluded — it's a terminal off-ramp, not part of
  // the active pipeline. Every remaining key is always present, even at 0.
  getBatchStatusCounts(): Observable<Record<ActiveBatchStatus, number>> {
    return this.getBatches().pipe(
      map(batches => {
        const counts = { Draft: 0, 'Pending Approval': 0, Approved: 0, Disbursed: 0 } as Record<ActiveBatchStatus, number>;
        for (const b of batches) {
          if (b.status in counts) counts[b.status as ActiveBatchStatus]++;
        }
        return counts;
      }),
    );
  }

  // Changes a batch's status in memory and then tries to sync it to the API.
  // If the API call fails, the in-memory change stays — optimistic update.
  updateBatchStatus(id: string, status: BatchStatus): void {
    const rows = this.batches$.value;
    const idx = rows.findIndex(b => b.id === id);
    if (idx === -1) return;
    const updated = [...rows];
    updated[idx] = { ...rows[idx], status }; // replace only the status field
    this.batches$.next(updated);

    // Fire-and-forget HTTP PATCH — we don't wait for it, UI already updated above.
    if (!USE_MOCK) {
      this.http.patch(API_ENDPOINTS.BRANCH.BATCH_BY_ID(id), { status }).pipe(
        timeout(3000),
        catchError(() => of(null)),
      ).subscribe();
    }
  }

  // Removes a batch from the list immediately, then tells the API.
  deleteBatch(id: string): void {
    this.batches$.next(this.batches$.value.filter(b => b.id !== id));

    if (!USE_MOCK) {
      this.http.delete(API_ENDPOINTS.BRANCH.BATCH_BY_ID(id)).pipe(
        timeout(3000),
        catchError(() => of(null)),
      ).subscribe();
    }
  }

  // Available seasons for the batch-create form dropdown.
  getSeasons(): string[] {
    return ['Season A 2024', 'Season B 2024', 'Season A 2025'];
  }

  // Available commodity filters for the batch-create form dropdown.
  getCommodities(): string[] {
    return ['All Commodities', 'Coffee', 'Maize'];
  }

  // Display name for the branch the current session belongs to — used wherever the
  // UI needs to make the implicit branch scoping visible (e.g. the Create Batch page).
  getOwnBranchName(): string {
    return this.getBranchName(this.session.branchId() ?? '');
  }

  // Display name for any branch this feature knows about — used by the cooperative-wide
  // view, which groups batches from multiple branches, not just the logged-in one.
  getBranchName(branchId: string): string {
    return BRANCH_NAMES[branchId] ?? branchId;
  }

  // Synchronous read — looks up by ID, but only within the logged-in branch's own
  // batches. A branch typing/guessing another branch's batch ID gets nothing back.
  getBatchById(id: string): PaymentBatch | undefined {
    const branchId = this.session.branchId();
    return this.batches$.value.find(b => b.id === id && b.branchId === branchId);
  }

  // Runs the filter (commodity only — branch is implicit, scoped to the session)
  // and splits farmers into two groups. Synchronous because it reads the
  // BehaviorSubject value directly (no async needed).
  matchFarmers(criteria: BatchFilterCriteria): { eligible: FarmerRecord[]; excluded: FarmerRecord[] } {
    const filtered = this.applyFilter(this.farmersInOwnBranch(), criteria);
    return {
      eligible: filtered.filter(f => this.isPayable(f)),
      excluded: filtered.filter(f => !this.isPayable(f)),
    };
  }

  // Saves a new batch as Draft, updates the BehaviorSubject, and fires a background POST.
  // branch/branchId come from the creator's own session — never user-chosen.
  createBatch(criteria: BatchFilterCriteria): PaymentBatch {
    const { eligible } = this.matchFarmers(criteria);
    const branchId = this.session.branchId() ?? '';

    // padStart(3, '0') = formats the number to always be 3 digits, e.g. 4 → '004'
    const batch: PaymentBatch = {
      id: `BATCH-${String(this.nextBatchId++).padStart(3, '0')}`,
      ...criteria,      // spread all form fields in
      branchId,
      branch: BRANCH_NAMES[branchId] ?? branchId,
      status: 'Draft',
      totalAmount: eligible.reduce((sum, f) => sum + f.netPayable, 0),
      farmerCount: eligible.length,
      createdAt: new Date(),
    };

    // Add to the live list immediately — the table re-renders without waiting for the API.
    this.batches$.next([...this.batches$.value, batch]);

    if (!USE_MOCK) {
      this.http.post<PaymentBatch>(API_ENDPOINTS.BRANCH.BATCHES, batch).pipe(
        timeout(3000),
        catchError(() => of(batch)),
      ).subscribe();
    }

    return batch; // return it so the component can show the batch ID in the success banner
  }

  // Returns only the eligible farmers for a specific batch — used by BatchFarmersComponent.
  // getBatchById already scopes to the logged-in branch, so this can't leak another branch's farmers.
  getFarmersForBatch(batchId: string): FarmerRecord[] {
    const batch = this.getBatchById(batchId);
    if (!batch) return [];
    return this.applyFilter(this.farmersInOwnBranch(), batch).filter(f => this.isPayable(f));
  }

  // Exposes the farmer pool as an Observable, scoped to the logged-in branch —
  // used by AllBatchFarmersComponent. Also kicks off a background HTTP fetch — same
  // instant-local + background-refresh pattern as getBatches() above. Components that
  // read matchFarmers()/getFarmersForBatch() synchronously should call this first
  // (fire-and-forget) so farmers$ has a chance to hold real data before they're read.
  getAllFarmers(): Observable<FarmerRecord[]> {
    if (!USE_MOCK) {
      this.http.get<FarmerRecord[]>(API_ENDPOINTS.BRANCH.PAYMENT_FARMERS).pipe(
        timeout(3000),
        tap(rows => this.farmers$.next(rows)),
        catchError(() => of(null)),
      ).subscribe();
    }
    const branchId = this.session.branchId();
    return this.farmers$.pipe(map(rows => rows.filter(f => f.branchId === branchId)));
  }

  // ── Cooperative-wide reads (read-only — no branch restriction) ─────────────
  // Used only by cooperative-side components (e.g. payment-batches.component.ts).
  // Branch-side components keep using the branch-scoped methods above.

  // Every branch's batches, unfiltered. Same instant-local + background-refresh
  // pattern as getBatches() — just without the branchId filter at the end.
  getAllBatchesAcrossBranches(): Observable<PaymentBatch[]> {
    if (!USE_MOCK) {
      this.http.get<PaymentBatch[]>(API_ENDPOINTS.COOPERATIVE.PAYMENT_BATCHES).pipe(
        timeout(3000),
        tap(rows => this.batches$.next(rows)),
        catchError(() => of(null)),
      ).subscribe();
    }
    return this.batches$.asObservable();
  }

  // Looks up a batch by ID across every branch — unlike getBatchById, which only
  // ever finds batches belonging to the logged-in branch.
  getBatchByIdAcrossBranches(id: string): PaymentBatch | undefined {
    return this.batches$.value.find(b => b.id === id);
  }

  // Every branch's farmers, unfiltered.
  getAllFarmersAcrossBranches(): Observable<FarmerRecord[]> {
    if (!USE_MOCK) {
      this.http.get<FarmerRecord[]>(API_ENDPOINTS.COOPERATIVE.PAYMENT_FARMERS).pipe(
        timeout(3000),
        tap(rows => this.farmers$.next(rows)),
        catchError(() => of(null)),
      ).subscribe();
    }
    return this.farmers$.asObservable();
  }

  // Eligible farmers for one batch, regardless of which branch it belongs to.
  getFarmersForBatchAcrossBranches(batchId: string): FarmerRecord[] {
    const batch = this.getBatchByIdAcrossBranches(batchId);
    if (!batch) return [];
    const inBranch = this.farmers$.value.filter(f => f.branchId === batch.branchId);
    return this.applyFilter(inBranch, batch).filter(f => this.isPayable(f));
  }

  // Buckets farmers by deliveryDate, then within each day by session (in the fixed
  // 6am-9am / 9am-12pm / 12pm-6pm order, with a trailing "no session recorded" bucket)
  // — days sorted earliest first. Shared by both the branch and cooperative
  // "view batch farmers" pages so they group identically.
  groupFarmersByDayAndSession(farmers: FarmerRecord[]): DayGroup[] {
    const byDay = new Map<string, FarmerRecord[]>();
    for (const f of farmers) {
      const list = byDay.get(f.deliveryDate) ?? [];
      list.push(f);
      byDay.set(f.deliveryDate, list);
    }

    const knownSessions = [...ALL_DELIVERY_SESSIONS, null];

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, dayFarmers]) => {
        const sessions: SessionGroup[] = knownSessions
          .map(session => ({ session, farmers: dayFarmers.filter(f => (f.session ?? null) === session) }))
          .filter(group => group.farmers.length > 0)
          .map(group => ({
            ...group,
            subtotal: group.farmers.reduce((sum, f) => sum + f.netPayable, 0),
          }));

        return {
          day,
          sessions,
          subtotal: dayFarmers.reduce((sum, f) => sum + f.netPayable, 0),
        };
      });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  // A farmer is payable only once BOTH conditions hold: bank details are on
  // file AND their onboarding was actually approved. Pending/Rejected/
  // Suspended farmers must never be matched into a batch, even if their
  // bank details are otherwise complete.
  private isPayable(f: FarmerRecord): boolean {
    return f.hasBankDetails && f.status === 'Active';
  }

  private farmersInOwnBranch(): FarmerRecord[] {
    const branchId = this.session.branchId();
    return this.farmers$.value.filter(f => f.branchId === branchId);
  }

  // Filters an (already branch-scoped) farmer list by commodity.
  // 'All Commodities' = no filter applied — show everything in the branch.
  private applyFilter(farmers: FarmerRecord[], criteria: BatchFilterCriteria): FarmerRecord[] {
    return farmers.filter(f =>
      criteria.commodityFilter === 'All Commodities' || f.commodity === criteria.commodityFilter,
    );
  }
}
