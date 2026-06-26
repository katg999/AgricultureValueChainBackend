// This service is specifically for the COOPERATIVE-level finance view.
// It's simpler than PaymentBatchService — no HTTP calls, no farmer filtering.
// All it does is hold a list of batch records and let you update their status inline.

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BatchRecord, BatchStatus } from './batch.model';
import { MOCK_COOPERATIVE_BATCHES } from '../../../core/mock/mock-cooperative';

// providedIn: 'root' means Angular creates ONE shared instance of this class
// for the whole app — every component that injects it gets the same object.
@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly seed: BatchRecord[] = MOCK_COOPERATIVE_BATCHES;

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
