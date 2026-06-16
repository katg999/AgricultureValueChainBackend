// This file is the "blueprint" for everything related to branch-level payment batches.
// Think of it like defining the shape of data before you actually use it.
// TypeScript uses these to catch mistakes — if you try to put a number where a string
// is expected, it'll tell you before the app even runs.

// BatchStatus = the lifecycle of a batch. It starts as Draft, moves forward or gets rejected.
// Using a union type (with |) means the value can ONLY be one of these exact strings — nothing else.
export type BatchStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Disbursed';

// PaymentMethod = how a farmer gets paid. Same idea — locked to specific values.
export type PaymentMethod = 'Mobile Money' | 'Bank Transfer' | 'Cash';

// FarmerRecord = one farmer who appears in a payment batch.
// hasBankDetails is the key flag — false means we can't pay them, so they get excluded.
// bankAccount / bankCode are needed to generate the bank payment file.
// email and address are optional — not all farmers will have them.
export interface FarmerRecord {
  farmerId: string;
  fullName: string;
  commodity: string;
  branch: string;
  deliveryDate: string;
  paymentMethod: PaymentMethod;
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
export interface BatchFilterCriteria {
  batchName: string;
  season: string;
  openingDate: string;
  closingDate: string;
  commodityFilter: string;
  branch: string;
}

// PaymentBatch = a saved batch record with extra server-generated fields (id, status, totals).
// BatchFilterCriteria is basically PaymentBatch without those extra fields.
export interface PaymentBatch {
  id: string;
  batchName: string;
  season: string;
  openingDate: string;
  closingDate: string;
  commodityFilter: string;
  branch: string;
  status: BatchStatus;
  totalAmount: number;
  farmerCount: number;
  createdAt: Date;
}
