import { Season } from '../collections/branch.delivery.model';

export type BatchStatus = 'pending' | 'processed' | 'settled';

// ── Payment method ────────────────────────────────────────────────────────────

export type PaymentMethod = 'mobile_money' | 'bank_account';

export interface MobileMoneyPayment {
  method: 'mobile_money';
  provider: 'MTN' | 'Airtel';
  mobileMoneyName: string;
}

export interface BankAccountPayment {
  method: 'bank_account';
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

/** Discriminated union — use `payment.method` to narrow the type. */
export type PaymentInfo = MobileMoneyPayment | BankAccountPayment;

export interface BatchRecord {
  id: string;
  branchId: string;
  batchName: string;
  season: Season;
  createdAt: Date;
  closedAt: Date | null;
  status: BatchStatus;
  // Aggregated from BatchFarmerRecord[] — recomputed by BatchService on every farmer mutation
  farmerCount: number;
  grossAmount: number;
  deductions: number;
  netPayable: number;
}

export interface BatchFarmerRecord {
  id: string;
  batchId: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  commodity: string;
  grossAmount: number;
  deductions: number;
  netPayable: number;
  status: BatchStatus;
  payment?: PaymentInfo;
  addedAt: Date;
}

export interface BatchFarmerFormData {
  farmerId: string;
  farmerName: string;
  phone: string;
  commodity: string;
  grossAmount: number;
  deductions: number;
  status: BatchStatus;
  payment?: PaymentInfo;
}

export interface BatchFormData {
  batchName: string;
  batchId: string;
  season: Season;
  branchId: string;
}
