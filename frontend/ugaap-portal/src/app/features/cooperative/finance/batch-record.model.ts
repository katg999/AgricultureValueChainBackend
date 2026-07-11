import { Season } from '../../branch/collections/branch.delivery.model';

export type BatchStatus = 'pending' | 'processed' | 'settled';

// Cooperative-level read-only batch summary (different from the branch batch model
// which is for staff creating batches — this one carries grossAmount/deductions for reporting).
export interface BatchRecord {
  id: string;
  batchName: string;
  branchId: string;
  season: Season;
  farmerCount: number;
  grossAmount: number;
  deductions: number;
  netPayable: number;
  status: BatchStatus;
  createdAt: Date;
}
