export type DeliveryStatus = 'Pending' | 'Approved' | 'Rejected';
export type Season = 'Wet Season' | 'Dry Season';

export interface BranchDelivery {
  id: string;
  branchId?: string;       // not present on older records; don't rely on it for filtering alone
  branchName: string;
  farmerCount: number;
  commodity: string;
  volume: number;          // kg
  estimatedValue: number;  // UGX
  status: DeliveryStatus;
  season: Season;
  createdAt: Date;
  updatedAt: Date;
}

// id and timestamps are server-generated; this is what the form sends
export interface BranchDeliveryFormData {
  branchId?: string;
  branchName: string;
  farmerCount: number;
  commodity: string;
  volume: number;
  estimatedValue: number;
  status: DeliveryStatus;
  season: Season;
}
