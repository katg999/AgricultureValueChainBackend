export interface FarmerDelivery {
  id: string;
  branchDeliveryId?: string;  // links this record back to its parent BranchDelivery batch
  farmerId?: string;
  farmerName: string;
  commodity: string;
  volume: number;
  unitPrice?: number;
  estimatedValue: number;
  grade?: string;
  gradeName?: string;
  inputLoanDeduction?: number;
  phone?: string;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  season: string;
  session?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarmerDeliveryCreateDTO {
  farmerName: string;
  commodity: string;
  volume: number;
  season: string;
  session?: string;
  notes?: string;
}

export interface FarmerDeliveryUpdateDTO {
  farmerName?: string;
  commodity?: string;
  volume?: number;
  season?: string;
  session?: string;
  notes?: string;
}