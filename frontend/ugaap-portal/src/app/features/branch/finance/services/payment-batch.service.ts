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
  DayGroup,
  SessionGroup,
} from '../models/batch.models';

// Display name for each branch this feature knows about — every batch/farmer record
// is scoped to exactly one of these via branchId, matched against the logged-in session.
const BRANCH_NAMES: Record<string, string> = {
  'BR-MBL': 'Mbale West',
  'BR-KAS': 'Kasese',
};

// providedIn: 'root' = one shared instance for the whole app
@Injectable({ providedIn: 'root' })
export class PaymentBatchService {
  // Tracks the next ID to use when creating a batch locally (while no real API exists).
  // Starts at 4 because the seed data already uses 1, 2, 3.
  private nextBatchId = 4;

  // ── Seed data ──────────────────────────────────────────────────────────────
  // These are placeholder farmers so the preview/filter logic works without a backend.
  // hasBankDetails: false = these farmers will be excluded from any payment batch.
  private readonly farmerSeed: FarmerRecord[] = [
    {
      farmerId: 'F-001',
      fullName: 'Okello James',
      commodity: 'Coffee',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      deliveryDate: '2024-09-15',
      session: 'morning',
      paymentMethod: 'Mobile Money',
      netPayable: 450_000,
      hasBankDetails: true,
      bankAccount: '9876100001',
      bankCode: 'STBK', // Stanbic Bank Uganda
      email: 'okello.james@gmail.com',
      address: 'Mbale, Eastern Uganda',
    },
    {
      farmerId: 'F-002',
      fullName: 'Nakato Sarah',
      commodity: 'Maize',
      branch: 'Kasese',
      branchId: 'BR-KAS',
      deliveryDate: '2024-09-18',
      session: 'morning',
      paymentMethod: 'Bank Transfer',
      netPayable: 320_000,
      hasBankDetails: true,
      bankAccount: '9876100002',
      bankCode: 'DFCU', // DFCU Bank Uganda
      email: 'nakato.sarah@gmail.com',
      address: 'Kasese, Western Uganda',
    },
    {
      farmerId: 'F-003',
      fullName: 'Mugisha Peter',
      commodity: 'Coffee',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      deliveryDate: '2024-09-20',
      session: 'morning',
      paymentMethod: 'Mobile Money',
      netPayable: 610_000,
      hasBankDetails: true,
      bankAccount: '9876100003',
      bankCode: 'CNTB', // Centenary Bank Uganda
      email: '',
      address: 'Mbale, Eastern Uganda',
    },
    {
      farmerId: 'F-004',
      fullName: 'Atim Grace',
      commodity: 'Maize',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      deliveryDate: '2024-09-21',
      session: 'morning',
      paymentMethod: 'Cash',
      netPayable: 180_000,
      hasBankDetails: false, // excluded — no bank account on file
      bankAccount: '',
      bankCode: '',
    },
    {
      farmerId: 'F-005',
      fullName: 'Byamugisha Joel',
      commodity: 'Coffee',
      branch: 'Kasese',
      branchId: 'BR-KAS',
      deliveryDate: '2024-09-22',
      session: 'morning',
      paymentMethod: 'Bank Transfer',
      netPayable: 540_000,
      hasBankDetails: true,
      bankAccount: '9876100005',
      bankCode: 'ABSA', // Absa Bank Uganda
      email: 'byamugisha.joel@gmail.com',
      address: 'Kasese, Western Uganda',
    },
    {
      farmerId: 'F-006',
      fullName: 'Nantongo Ruth',
      commodity: 'Maize',
      branch: 'Kasese',
      branchId: 'BR-KAS',
      deliveryDate: '2024-09-23',
      session: 'morning',
      paymentMethod: 'Mobile Money',
      netPayable: 275_000,
      hasBankDetails: false, // excluded — no bank account on file
      bankAccount: '',
      bankCode: '',
    },

    // ── Extra farmers sharing dates with the ones above, across different sessions —
    // so a batch's farmers can actually be grouped Day -> Session -> Farmers. ──
    {
      farmerId: 'F-007',
      fullName: 'Namatovu Joyce',
      commodity: 'Coffee',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      deliveryDate: '2024-09-15',
      session: 'midday',
      paymentMethod: 'Mobile Money',
      netPayable: 390_000,
      hasBankDetails: true,
      bankAccount: '9876100007',
      bankCode: 'STBK',
      email: 'namatovu.joyce@gmail.com',
      address: 'Mbale, Eastern Uganda',
    },
    {
      farmerId: 'F-008',
      fullName: 'Wasswa Ali',
      commodity: 'Coffee',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      deliveryDate: '2024-09-15',
      session: 'afternoon',
      paymentMethod: 'Bank Transfer',
      netPayable: 510_000,
      hasBankDetails: true,
      bankAccount: '9876100008',
      bankCode: 'CNTB',
      email: 'wasswa.ali@gmail.com',
      address: 'Mbale, Eastern Uganda',
    },
    {
      farmerId: 'F-009',
      fullName: 'Nabirye Patience',
      commodity: 'Coffee',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      deliveryDate: '2024-09-20',
      session: 'midday',
      paymentMethod: 'Mobile Money',
      netPayable: 430_000,
      hasBankDetails: true,
      bankAccount: '9876100009',
      bankCode: 'DFCU',
      email: 'nabirye.patience@gmail.com',
      address: 'Mbale, Eastern Uganda',
    },
    {
      farmerId: 'F-010',
      fullName: 'Mukiibi Daniel',
      commodity: 'Coffee',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      deliveryDate: '2024-09-20',
      session: 'afternoon',
      paymentMethod: 'Cash',
      netPayable: 290_000,
      hasBankDetails: true,
      bankAccount: '9876100010',
      bankCode: 'ABSA',
      email: 'mukiibi.daniel@gmail.com',
      address: 'Mbale, Eastern Uganda',
    },
    {
      farmerId: 'F-011',
      fullName: 'Kirabo Esther',
      commodity: 'Maize',
      branch: 'Kasese',
      branchId: 'BR-KAS',
      deliveryDate: '2024-09-18',
      session: 'midday',
      paymentMethod: 'Bank Transfer',
      netPayable: 350_000,
      hasBankDetails: true,
      bankAccount: '9876100011',
      bankCode: 'DFCU',
      email: 'kirabo.esther@gmail.com',
      address: 'Kasese, Western Uganda',
    },
    {
      farmerId: 'F-012',
      fullName: 'Were Hassan',
      commodity: 'Maize',
      branch: 'Kasese',
      branchId: 'BR-KAS',
      deliveryDate: '2024-09-18',
      session: 'afternoon',
      paymentMethod: 'Mobile Money',
      netPayable: 410_000,
      hasBankDetails: true,
      bankAccount: '9876100012',
      bankCode: 'STBK',
      email: 'were.hassan@gmail.com',
      address: 'Kasese, Western Uganda',
    },
    {
      farmerId: 'F-013',
      fullName: 'Nansubuga Joan',
      commodity: 'Coffee',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      deliveryDate: '2024-09-25',
      session: 'morning',
      paymentMethod: 'Mobile Money',
      netPayable: 470_000,
      hasBankDetails: true,
      bankAccount: '9876100013',
      bankCode: 'CNTB',
      email: 'nansubuga.joan@gmail.com',
      address: 'Mbale, Eastern Uganda',
    },
    {
      farmerId: 'F-014',
      fullName: 'Ssekandi Brian',
      commodity: 'Coffee',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      deliveryDate: '2024-09-25',
      session: 'midday',
      paymentMethod: 'Bank Transfer',
      netPayable: 380_000,
      hasBankDetails: true,
      bankAccount: '9876100014',
      bankCode: 'ABSA',
      email: 'ssekandi.brian@gmail.com',
      address: 'Mbale, Eastern Uganda',
    },
  ];

  // Placeholder batches so the list page has something to display immediately.
  // Each batch belongs to exactly one branch — there's no "All Branches" batch,
  // since a branch can only ever create batches scoped to itself.
  private readonly batchSeed: PaymentBatch[] = [
    {
      id: 'BATCH-001',
      batchName: 'August 2024 Coffee Run',
      season: 'Season A 2024',
      openingDate: '2024-08-01',
      closingDate: '2024-08-31',
      commodityFilter: 'Coffee',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      status: 'Approved',
      totalAmount: 4_800_000,
      farmerCount: 12,
      createdAt: new Date('2024-09-01'),
    },
    {
      id: 'BATCH-002',
      batchName: 'September 2024 Payment Run',
      season: 'Season B 2024',
      openingDate: '2024-09-01',
      closingDate: '2024-09-30',
      commodityFilter: 'All Commodities',
      branch: 'Mbale West',
      branchId: 'BR-MBL',
      status: 'Draft',
      totalAmount: 1_920_000,
      farmerCount: 5,
      createdAt: new Date('2024-10-02'),
    },
    {
      id: 'BATCH-003',
      batchName: 'Kasese Maize October',
      season: 'Season B 2024',
      openingDate: '2024-10-01',
      closingDate: '2024-10-15',
      commodityFilter: 'Maize',
      branch: 'Kasese',
      branchId: 'BR-KAS',
      status: 'Pending Approval',
      totalAmount: 595_000,
      farmerCount: 2,
      createdAt: new Date('2024-10-16'),
    },
  ];

  // ── Reactive stores ────────────────────────────────────────────────────────
  // BehaviorSubject holds the current value AND emits it to any new subscriber immediately.
  // Think of it as a live variable — when you call .next(newValue), everyone watching updates.
  // [...spread] creates a copy so the seed data stays untouched.
  private readonly batches$ = new BehaviorSubject<PaymentBatch[]>([...this.batchSeed]);
  private readonly farmers$ = new BehaviorSubject<FarmerRecord[]>([...this.farmerSeed]);

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
    this.http.get<PaymentBatch[]>(API_ENDPOINTS.BRANCH.BATCHES).pipe(
      timeout(3000),
      tap(rows => this.batches$.next(rows)), // on success: replace seed with real data
      catchError(() => of(null)),            // on failure: silently ignore
    ).subscribe();
    const branchId = this.session.branchId();
    return this.batches$.pipe(map(rows => rows.filter(b => b.branchId === branchId)));
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
    this.http.patch(API_ENDPOINTS.BRANCH.BATCH_BY_ID(id), { status }).pipe(
      timeout(3000),
      catchError(() => of(null)),
    ).subscribe();
  }

  // Removes a batch from the list immediately, then tells the API.
  deleteBatch(id: string): void {
    this.batches$.next(this.batches$.value.filter(b => b.id !== id));

    this.http.delete(API_ENDPOINTS.BRANCH.BATCH_BY_ID(id)).pipe(
      timeout(3000),
      catchError(() => of(null)),
    ).subscribe();
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
      eligible: filtered.filter(f => f.hasBankDetails),      // can be paid
      excluded: filtered.filter(f => !f.hasBankDetails),     // missing bank info
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

    this.http.post<PaymentBatch>(API_ENDPOINTS.BRANCH.BATCHES, batch).pipe(
      timeout(3000),
      catchError(() => of(batch)),
    ).subscribe();

    return batch; // return it so the component can show the batch ID in the success banner
  }

  // Returns only the eligible farmers for a specific batch — used by BatchFarmersComponent.
  // getBatchById already scopes to the logged-in branch, so this can't leak another branch's farmers.
  getFarmersForBatch(batchId: string): FarmerRecord[] {
    const batch = this.getBatchById(batchId);
    if (!batch) return [];
    return this.applyFilter(this.farmersInOwnBranch(), batch).filter(f => f.hasBankDetails);
  }

  // Exposes the farmer pool as an Observable, scoped to the logged-in branch —
  // used by AllBatchFarmersComponent. Also kicks off a background HTTP fetch — same
  // instant-local + background-refresh pattern as getBatches() above. Components that
  // read matchFarmers()/getFarmersForBatch() synchronously should call this first
  // (fire-and-forget) so farmers$ has a chance to hold real data before they're read.
  getAllFarmers(): Observable<FarmerRecord[]> {
    this.http.get<FarmerRecord[]>(API_ENDPOINTS.BRANCH.PAYMENT_FARMERS).pipe(
      timeout(3000),
      tap(rows => this.farmers$.next(rows)),
      catchError(() => of(null)),
    ).subscribe();
    const branchId = this.session.branchId();
    return this.farmers$.pipe(map(rows => rows.filter(f => f.branchId === branchId)));
  }

  // ── Cooperative-wide reads (read-only — no branch restriction) ─────────────
  // Used only by cooperative-side components (e.g. payment-batches.component.ts).
  // Branch-side components keep using the branch-scoped methods above.

  // Every branch's batches, unfiltered. Same instant-local + background-refresh
  // pattern as getBatches() — just without the branchId filter at the end.
  getAllBatchesAcrossBranches(): Observable<PaymentBatch[]> {
    this.http.get<PaymentBatch[]>(API_ENDPOINTS.COOPERATIVE.PAYMENT_BATCHES).pipe(
      timeout(3000),
      tap(rows => this.batches$.next(rows)),
      catchError(() => of(null)),
    ).subscribe();
    return this.batches$.asObservable();
  }

  // Looks up a batch by ID across every branch — unlike getBatchById, which only
  // ever finds batches belonging to the logged-in branch.
  getBatchByIdAcrossBranches(id: string): PaymentBatch | undefined {
    return this.batches$.value.find(b => b.id === id);
  }

  // Every branch's farmers, unfiltered.
  getAllFarmersAcrossBranches(): Observable<FarmerRecord[]> {
    this.http.get<FarmerRecord[]>(API_ENDPOINTS.COOPERATIVE.PAYMENT_FARMERS).pipe(
      timeout(3000),
      tap(rows => this.farmers$.next(rows)),
      catchError(() => of(null)),
    ).subscribe();
    return this.farmers$.asObservable();
  }

  // Eligible farmers for one batch, regardless of which branch it belongs to.
  getFarmersForBatchAcrossBranches(batchId: string): FarmerRecord[] {
    const batch = this.getBatchByIdAcrossBranches(batchId);
    if (!batch) return [];
    const inBranch = this.farmers$.value.filter(f => f.branchId === batch.branchId);
    return this.applyFilter(inBranch, batch).filter(f => f.hasBankDetails);
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
