export interface FarmerDelivery {
phone: any;
unitPrice: any;
inputLoanDeduction: any;
gradeName: any;
  id: string; // Map to Backend UUID
  farmerId?: string;
  farmerName: string;
  commodity: string;
  volume: number;
  estimatedValue: number;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  season: string;
  session?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Matches FarmerDeliveryCreateDTO
export interface FarmerDeliveryCreateDTO {
  farmerName: string;
  commodity: string;
  volume: number;
  season: string;
  session?: string;
  notes?: string;
  // include other required fields matching your Spring validator constraints
}

// Matches FarmerDeliveryUpdateDTO
export interface FarmerDeliveryUpdateDTO {
  farmerName?: string;
  commodity?: string;
  volume?: number;
  season?: string;
  session?: string;
  notes?: string;
}




// // A FarmerDelivery is one farmer's individual contribution inside a BranchDelivery batch.
// // branchDeliveryId links it back to the parent batch so totals can be re-calculated.

// import { DeliveryStatus, DeliverySession, Season } from './branch.delivery.model';

// export type { DeliverySession };

// export interface FarmerDelivery {
//   id: string;
//   branchDeliveryId?: string;
//   branchId?: string;
//   farmerId: string;
//   farmerName: string;
//   phone: string;
//   commodity: string;
//   volume: number;
//   /** UGX per KG locked in at the moment of recording — comes from CooperativePricingService. */
//   unitPrice?: number;
//   /** estimatedValue serves as the gross value: volume × unitPrice. */
//   estimatedValue: number;
//   /** Input loan recovery deducted from gross to get the farmer's net payment. */
//   inputLoanDeduction?: number;
//   /** Grade code (A/B/C/R) — only populated when the cooperative has grade mode ON. */
//   grade?: string;
//   /** Human-readable grade name, e.g. 'Premium'. Derived from grade code. */
//   gradeName?: string;
//   notes: string;
//   status: DeliveryStatus;
//   season: Season;
//   /** Optional — a real backend response may not include this field yet; degrade gracefully. */
//   session?: DeliverySession;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface FarmerDeliveryFormData {
//   branchDeliveryId?: string;
//   branchId?: string;
//   farmerId: string;
//   farmerName: string;
//   phone: string;
//   commodity: string;
//   volume: number;
//   unitPrice?: number;
//   estimatedValue: number;
//   /** Present only when cooperative grade mode is ON. */
//   grade?: string;
//   gradeName?: string;
//   notes: string;
//   status: DeliveryStatus;
//   season: Season;
//   session: DeliverySession;
// }

// export interface SaveFarmerDeliveryPayload {
//   branch: string;
//   commodity: string;
//   farmerId: string;
//   farmerName: string;
//   quantityDelivered: number; // maps to quantity_delivered
//   unitOfMeasure: string;     // maps to unit_of_measure
//   estimatedDeliveryValue: number; // maps to estimated_delivery_value
//   totalValue: number;        // maps to total_value
//   inputValueUgx: number;     // maps to input_value_ugx (Deductions)
//   status: string;
//   season: Season;
//   session: DeliverySession;
// }