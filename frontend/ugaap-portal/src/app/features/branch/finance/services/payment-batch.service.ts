// PaymentBatchService is the brain of the branch finance feature.
// Components never talk to the API directly — they ask this service instead.
// That separation means if the API URL changes, you fix it in ONE place, not everywhere.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import {
  FarmerRecord,
  BatchFilterCriteria,
  PaymentBatch,
  BatchStatus,
} from '../models/batch.models';

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
      branch: 'Mbale Branch',
      deliveryDate: '2024-09-15',
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
      branch: 'Kasese Branch',
      deliveryDate: '2024-09-18',
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
      branch: 'Mbale Branch',
      deliveryDate: '2024-09-20',
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
      branch: 'Mbale Branch',
      deliveryDate: '2024-09-21',
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
      branch: 'Kasese Branch',
      deliveryDate: '2024-09-22',
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
      branch: 'Kasese Branch',
      deliveryDate: '2024-09-23',
      paymentMethod: 'Mobile Money',
      netPayable: 275_000,
      hasBankDetails: false, // excluded — no bank account on file
      bankAccount: '',
      bankCode: '',
    },
  ];

  // Placeholder batches so the list page has something to display immediately.
  private readonly batchSeed: PaymentBatch[] = [
    {
      id: 'BATCH-001',
      batchName: 'August 2024 Coffee Run',
      season: 'Season A 2024',
      openingDate: '2024-08-01',
      closingDate: '2024-08-31',
      commodityFilter: 'Coffee',
      branch: 'All Branches',
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
      branch: 'All Branches',
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
      branch: 'Kasese Branch',
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
  constructor(private readonly http: HttpClient) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  // Returns the live batch list as an Observable.
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
    return this.batches$.asObservable(); // always return the BehaviorSubject stream
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

  // Synchronous read — just looks up by ID in the current in-memory array.
  getBatchById(id: string): PaymentBatch | undefined {
    return this.batches$.value.find(b => b.id === id);
  }

  // Runs the filter and splits farmers into two groups.
  // Synchronous because it reads the BehaviorSubject value directly (no async needed).
  matchFarmers(criteria: BatchFilterCriteria): { eligible: FarmerRecord[]; excluded: FarmerRecord[] } {
    const filtered = this.applyFilter(this.farmers$.value, criteria);
    return {
      eligible: filtered.filter(f => f.hasBankDetails),      // can be paid
      excluded: filtered.filter(f => !f.hasBankDetails),     // missing bank info
    };
  }

  // Saves a new batch as Draft, updates the BehaviorSubject, and fires a background POST.
  createBatch(criteria: BatchFilterCriteria): PaymentBatch {
    const { eligible } = this.matchFarmers(criteria);

    // padStart(3, '0') = formats the number to always be 3 digits, e.g. 4 → '004'
    const batch: PaymentBatch = {
      id: `BATCH-${String(this.nextBatchId++).padStart(3, '0')}`,
      ...criteria,      // spread all form fields in
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
  getFarmersForBatch(batchId: string): FarmerRecord[] {
    const batch = this.getBatchById(batchId);
    if (!batch) return [];
    return this.applyFilter(this.farmers$.value, batch).filter(f => f.hasBankDetails);
  }

  // Exposes the full farmer pool as an Observable — used by AllBatchFarmersComponent.
  getAllFarmers(): Observable<FarmerRecord[]> {
    return this.farmers$.asObservable();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  // Filters the farmer list by commodity and branch.
  // 'All Commodities' / 'All Branches' = no filter applied — show everything.
  private applyFilter(farmers: FarmerRecord[], criteria: BatchFilterCriteria): FarmerRecord[] {
    return farmers.filter(f => {
      const commodityOk = criteria.commodityFilter === 'All Commodities' || f.commodity === criteria.commodityFilter;
      const branchOk = criteria.branch === 'All Branches' || f.branch === criteria.branch;
      return commodityOk && branchOk;
    });
  }
}
