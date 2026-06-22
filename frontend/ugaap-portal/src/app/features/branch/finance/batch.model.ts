// This is a SEPARATE model used by the cooperative-level finance view.
// It's different from models/batch.models.ts — that one is for branch staff creating batches.
// This one is for the cooperative admin seeing a read-only summary across all branches.
//
// Key difference: this model has grossAmount and deductions (for financial reporting),
// while the branch model just has a totalAmount. Different view, different data shape.

import { Season } from '../collections/branch.delivery.model';

// Status here is simpler than the branch version — just 3 steps for reporting purposes.
export type BatchStatus = 'pending' | 'processed' | 'settled';

export interface BatchRecord {
  id: string;
  batchName: string;
  branchId: string;     // which branch this batch belongs to
  season: Season;       // reused from the delivery model — 'Wet Season' | 'Dry Season'
  farmerCount: number;
  grossAmount: number;  // total before deductions
  deductions: number;   // fees, levies, loans recovered, etc.
  netPayable: number;   // what farmers actually receive (gross - deductions)
  status: BatchStatus;
  createdAt: Date;
}
