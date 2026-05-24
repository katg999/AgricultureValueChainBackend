export type UnitOfMeasure = 'KG' | 'MT' | 'LITRES' | 'PIECES' | 'BAG';
export type RepaymentRuleType = 'standard' | 'accelerated' | 'deferred';
export type DeliveryStatus = 'Pending' | 'Processed' | 'Cancelled';

export interface DeliveryRegistrationForm {
  isActive: boolean;
  farmerName: string;
  commodityCategory: 'maize' | 'beans' | 'coffee' | 'sorghum' | '';
  quantity: number;
  unitOfMeasure: string;
  estimatedValue: number;
  repaymentRule: RepaymentRuleType;
  notes?: string;
}

export interface FarmerDelivery extends DeliveryRegistrationForm {
  id: string;
  dateDelivered: string;
  status: DeliveryStatus;
}

export type DeliveryRecord = FarmerDelivery;
