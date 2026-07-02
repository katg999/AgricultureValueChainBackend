export interface FlatPriceEntry {
  id: string;
  commodity: string;
  pricePerKg: number;
  branch: string;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface GradePriceEntry {
  id: string;
  commodity: string;
  gradeCode: string;
  gradeName: string;
  pricePerKg: number;
  branch: string;
  effectiveFrom: string;
  effectiveTo: string;
}
