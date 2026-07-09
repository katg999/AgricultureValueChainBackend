// This file is the "blueprint" for everything related to branch-level payment batches.
// Think of it like defining the shape of data before you actually use it.
// TypeScript uses these to catch mistakes — if you try to put a number where a string
// is expected, it'll tell you before the app even runs.

import { DeliverySession } from '../../collections/branch.delivery.model';

// BatchStatus = the lifecycle of a batch. It starts as Draft, moves forward or gets rejected.
// Using a union type (with |) means the value can ONLY be one of these exact strings — nothing else.
export type BatchStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Disbursed';

// PaymentMethod = how a farmer gets paid. Same idea — locked to specific values.
export type PaymentMethod = 'Mobile Money' | 'Bank Transfer' | 'Cash';

// PayoutChannel = the real-money rail used to pay a farmer electronically.
// Distinct from PaymentMethod above: PaymentMethod is what the farmer record
// was seeded with (a coarse category); PayoutChannel is the specific channel
// an officer confirms before disbursing — see defaultPayoutChannel() in
// payment.service.ts for how one maps to the other.
export type PayoutChannel = 'MTN' | 'AIRTEL' | 'WENDI' | 'POSTBANK';

// The lifecycle of one farmer's payout attempt, mirroring the backend's
// transaction status enum exactly — the frontend never invents its own states.
// TIER_LIMIT_EXCEEDED and FAILED_REVERSED are both terminal (need a retry);
// SETTLED is terminal (done). The rest are in-flight.
export type PayoutTransactionStatus =
  | 'INITIATED'
  | 'VALIDATING'
  | 'TIER_LIMIT_EXCEEDED'
  | 'FUNDS_LOCKED'
  | 'CHANNEL_PROCESSING'
  | 'SETTLED'
  | 'FAILED_REVERSED';

// One farmer's payout attempt within a batch disbursement.
// idempotencyKey is generated fresh per attempt (including retries) so a
// duplicate network request never creates two payouts for the same attempt.
export interface PayoutTransaction {
  transactionId: string;
  farmerId: string;
  batchId: string;
  channel: PayoutChannel;
  amount: number; // whole UGX — Math.round()-ed before send/store
  status: PayoutTransactionStatus;
  idempotencyKey: string;
  createdAt: Date;
}

// FarmerRecord = one farmer who appears in a payment batch.
// hasBankDetails is the key flag — false means we can't pay them, so they get excluded.
// bankAccount / bankCode are needed to generate the bank payment file.
// email and address are optional — not all farmers will have them.
// session = which delivery window (within deliveryDate) this farmer's payout traces back to —
// used to group a batch's farmers as Day -> Session for processing. Optional: a real backend
// response missing it should just leave a farmer ungrouped, not break the page.
// branchId = which branch this farmer belongs to (BR-MBL, etc.) — branch payment batches are
// scoped to the logged-in branch only, this is what that scoping filters on. Kept REQUIRED
// (unlike session) on purpose: this is an access boundary, not just a display field — if a
// backend response ever omitted it, we want records to fail closed (filtered out) rather than
// silently become visible to every branch.
export interface FarmerRecord {
  farmerId: string;
  fullName: string;
  commodity: string;
  branch: string;
  branchId: string;
  deliveryDate: string;
  session?: DeliverySession;
  paymentMethod: PaymentMethod;
  payoutChannel?: PayoutChannel; // officer-confirmed channel for this disbursement, if picked
  netPayable: number;
  hasBankDetails: boolean;
  bankAccount: string;
  bankCode: string;
  email?: string;
  address?: string;
}

// BatchFilterCriteria mirrors the batch-create form exactly.
// When we call form.getRawValue(), TypeScript needs to know what shape the result is —
// that's why we cast it to this interface in the component.
// No 'branch' field — a branch user can only ever create a batch for their own branch,
// so it's derived from the session rather than picked in the form.
export interface BatchFilterCriteria {
  batchName: string;
  season: string;
  openingDate: string;
  closingDate: string;
  commodityFilter: string;
}

// PaymentBatch = a saved batch record with extra server-generated fields (id, status, totals).
// branch/branchId are added by the service from the creator's session, not part of BatchFilterCriteria.
export interface PaymentBatch {
  id: string;
  batchName: string;
  season: string;
  openingDate: string;
  closingDate: string;
  commodityFilter: string;
  branch: string;
  branchId: string;
  status: BatchStatus;
  totalAmount: number;
  farmerCount: number;
  createdAt: Date;
}

// One session's worth of farmers within a day, inside a batch.
// session is null for farmers with no recorded session (e.g. a backend response that
// hasn't added this field yet) — kept visible in its own bucket rather than dropped silently.
export interface SessionGroup {
  session: DeliverySession | null;
  farmers: FarmerRecord[];
  subtotal: number;
}

// One day's worth of sessions within a batch — used by both the branch and cooperative
// "view batch farmers" pages so they group identically (see PaymentBatchService.groupFarmersByDayAndSession).
export interface DayGroup {
  day: string;
  sessions: SessionGroup[];
  subtotal: number;
}
