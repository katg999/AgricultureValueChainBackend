export interface BranchDelivery {
  id: string;
  status: 'Pending' | 'Completed' | 'In-Progress' | 'Failed';
  branchName: string;
  branchCode: string;
  commodity: string;
  estimatedValueUGX: number;
  repaymentRule: string;
  deliveryDate?: string;
  farmerCount?: number; // Useful for ledger context
}

export interface DeliveryFilter {
  searchTerm?: string;
  branchId?: string;
  category?: string; // e.g., 'Crops', 'Livestock', 'All'
}

export const DELIVERY_STATUS_CONFIG = {
  Pending: { label: 'Pending', color: '#f59e0b' },
  Completed: { label: 'Completed', color: '#10b981' },
  'In-Progress': { label: 'In Progress', color: '#3b82f6' },
  Failed: { label: 'Failed', color: '#ef4444' },
} as const;