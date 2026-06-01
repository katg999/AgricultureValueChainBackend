import { DeliveryStatus } from './branch.delivery.model';

export interface FarmerDelivery {
  id: string;
  branchDeliveryId?: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  commodity: string;
  volume: number;
  estimatedValue: number;
  notes: string;
  status: DeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmerDeliveryFormData {
  branchDeliveryId?: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  commodity: string;
  volume: number;
  estimatedValue: number;
  notes: string;
  status: DeliveryStatus;
}
