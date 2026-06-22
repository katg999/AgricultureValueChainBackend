// This service is specifically for the COOPERATIVE-level finance view.
// It's simpler than PaymentBatchService — no HTTP calls, no farmer filtering.
// All it does is hold a list of batch records and let you update their status inline.

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BatchRecord, BatchStatus } from './batch.model';

// providedIn: 'root' means Angular creates ONE shared instance of this class
// for the whole app — every component that injects it gets the same object.
@Injectable({ providedIn: 'root' })
export class BatchService {
  // Seed data = fake records so the UI works while the real API is being built.
  // The underscore in 5_600_000 is just a visual separator — JavaScript ignores it.
  // It's the same as writing 5600000, but easier to read at a glance.
  private readonly seed: BatchRecord[] = [
    {
      id: 'B-001',
      batchName: 'August 2024 Coffee Run',
      branchId: 'BR-MBL',
      season: 'Wet Season',
      farmerCount: 14,
      grossAmount: 5_600_000,
      deductions: 800_000,
      netPayable: 4_800_000,
      status: 'processed',
      createdAt: new Date('2024-09-01'),
    },
    {
      id: 'B-002',
      batchName: 'September Maize — Mbarara',
      branchId: 'BR-MBA',
      season: 'Wet Season',
      farmerCount: 22,
      grossAmount: 8_800_000,
      deductions: 1_320_000,
      netPayable: 7_480_000,
      status: 'pending',
      createdAt: new Date('2024-09-28'),
    },
    {
      id: 'B-003',
      batchName: 'Dry Season Sesame Batch',
      branchId: 'BR-GUL',
      season: 'Dry Season',
      farmerCount: 9,
      grossAmount: 3_150_000,
      deductions: 315_000,
      netPayable: 2_835_000,
      status: 'settled',
      createdAt: new Date('2024-10-05'),
    },
    {
      id: 'B-004',
      batchName: 'Kiboga Vanilla Q4',
      branchId: 'BR-KIB',
      season: 'Dry Season',
      farmerCount: 6,
      grossAmount: 9_000_000,
      deductions: 900_000,
      netPayable: 8_100_000,
      status: 'pending',
      createdAt: new Date('2024-10-12'),
    },
    {
      id: 'B-005',
      batchName: 'Lira Sesame October',
      branchId: 'BR-LIR',
      season: 'Dry Season',
      farmerCount: 18,
      grossAmount: 6_300_000,
      deductions: 630_000,
      netPayable: 5_670_000,
      status: 'pending',
      createdAt: new Date('2024-10-18'),
    },
  ];

  // BehaviorSubject is like a variable that shouts "I changed!" to anyone listening.
  // The cooperative finance table subscribes to this and re-renders whenever it updates.
  // It's public (no 'private') so the component can subscribe to it directly.
  readonly batches$ = new BehaviorSubject<BatchRecord[]>([...this.seed]);
  // [...this.seed] spreads into a new array — we don't mutate the original seed data.

  // Updates one batch's status without touching the others.
  // We find it by index, replace it (never mutate the original object), then push the new array.
  updateBatchStatus(batchId: string, status: BatchStatus): void {
    const rows = this.batches$.value;
    const idx = rows.findIndex(b => b.id === batchId);
    if (idx === -1) return; // batch not found — do nothing
    const updated = [...rows];
    updated[idx] = { ...rows[idx], status }; // spread old fields, override just 'status'
    this.batches$.next(updated); // push the new array — subscribers re-render
  }
}
