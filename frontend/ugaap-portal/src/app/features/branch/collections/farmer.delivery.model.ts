// A FarmerDelivery is one farmer's individual contribution inside a BranchDelivery batch.
// branchDeliveryId links it back to the parent batch so totals can be re-calculated.

import { DeliveryStatus, DeliverySession, Season } from './branch.delivery.model';

export type { DeliverySession };

export interface FarmerDelivery {
  id: string;
  branchDeliveryId?: string;
  branchId?: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  commodity: string;
  volume: number;
  estimatedValue: number;
  notes: string;
  status: DeliveryStatus;
  season: Season;
  /** Optional — a real backend response may not include this field yet; degrade gracefully. */
  session?: DeliverySession;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmerDeliveryFormData {
  branchDeliveryId?: string;
  branchId?: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  commodity: string;
  volume: number;
  estimatedValue: number;
  notes: string;
  status: DeliveryStatus;
  season: Season;
  session: DeliverySession;
}
