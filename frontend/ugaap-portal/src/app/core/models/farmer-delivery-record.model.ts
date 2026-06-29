import type { DeliveryStatus, Season, DeliverySession } from '../../features/branch/collections/branch.delivery.model';

// Individual farmer delivery record — the atomic unit beneath a BranchDelivery batch.
//
// Batching rules (set per cooperative in Organisation Setup):
//   Session-based cooperative  → batch = commodity + session + day
//   Season-only cooperative    → batch = commodity + day  (session field absent)
//
// Pricing rules (set per cooperative in Organisation Setup):
//   Grade-based cooperative    → grade present; unitPrice = base × grade multiplier
//   Flat-price cooperative     → grade absent;  unitPrice = flat commodity price
//
// estimatedValue always = volume × unitPrice, regardless of pricing mode.
export interface FarmerDeliveryRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  cooperativeId: string;
  branchId: string;
  deliveryBatchId: string;   // foreign key → BranchDelivery.id
  commodity: string;
  volume: number;
  volumeUnit: string;        // 'KG', 'Bags', 'MT', etc.
  grade?: string;            // absent for flat-price cooperatives
  unitPrice: number;         // per volumeUnit
  estimatedValue: number;    // volume × unitPrice
  season: Season;
  session?: DeliverySession; // absent for season-only cooperatives
  deliveryDate: string;      // ISO date  e.g. '2025-06-05'
  status: DeliveryStatus;
}
