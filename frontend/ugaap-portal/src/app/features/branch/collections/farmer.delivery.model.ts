// A FarmerDelivery is one farmer's individual contribution inside a BranchDelivery batch.
// branchDeliveryId links it back to the parent batch so totals can be re-calculated.

import { DeliveryStatus, Season } from './branch.delivery.model';

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
}
