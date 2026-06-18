import { DeliverySession } from '../../../core/models/delivery-session.model';

export type DeliveryStatus = 'Pending' | 'Approved' | 'Rejected';
export type Season = 'Wet Season' | 'Dry Season';

// Re-exported so existing imports of DeliverySession/ALL_DELIVERY_SESSIONS from this
// file keep working — the real definition (and its configurable hours) lives in
// core/models/delivery-session.model.ts + core/services/delivery-session-config.service.ts.
export type { DeliverySession };
export { ALL_DELIVERY_SESSIONS } from '../../../core/models/delivery-session.model';

export interface BranchDelivery {
  id: string;
  branchId?: string;       // not present on older records; don't rely on it for filtering alone
  branchName: string;
  farmerCount: number;
  /** Primary/contact farmer for this batch — display only, doesn't affect farmerCount totals. */
  farmerName?: string;
  commodity: string;
  volume: number;
  /** Defaults to 'KG' for display when absent (older records predate this field). */
  volumeUnit?: string;
  estimatedValue: number;  // UGX
  status: DeliveryStatus;
  season: Season;
  /** Not present on older records — predates this field. */
  session?: DeliverySession;
  createdAt: Date;
  updatedAt: Date;
}

// id and timestamps are server-generated; this is what the form sends
export interface BranchDeliveryFormData {
  branchId?: string;
  branchName: string;
  farmerCount: number;
  /** Primary/contact farmer for this batch — display only, doesn't affect farmerCount totals. */
  farmerName?: string;
  commodity: string;
  volume: number;
  volumeUnit?: string;
  estimatedValue: number;
  status: DeliveryStatus;
  season: Season;
  session?: DeliverySession;
}
