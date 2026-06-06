export type DeliveryStatus = 'Pending' | 'Approved' | 'Rejected';
export type Season = 'Wet Season' | 'Dry Season';

export interface BranchDelivery {
  id: string;
  branchId?: string;
  branchName: string;
  farmerCount: number;
  commodity: string;
  volume: number;          // in KG
  estimatedValue: number;  // in UGX
  status: DeliveryStatus;
  season: Season;
  createdAt: Date;
  updatedAt: Date;
}

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
