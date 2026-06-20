import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FlatCommodityPrice {
  commodity: string;
  pricePerKg: number;
}

export interface GradeCommodityPrice {
  id: string;
  branchId: string;
  commodity: string;
  gradeCode: string;
  gradeName: string;
  pricePerKg: number;
}

export interface GradeOption {
  code: string;
  name: string;
}

export const GRADE_OPTIONS: GradeOption[] = [
  { code: 'A', name: 'Premium'   },
  { code: 'B', name: 'Standard'  },
  { code: 'C', name: 'Low Grade' },
  { code: 'R', name: 'Rejected'  },
];

const DEFAULT_FLAT_PRICES: FlatCommodityPrice[] = [
  { commodity: 'Maize',  pricePerKg: 2_500 },
  { commodity: 'Coffee', pricePerKg: 6_000 },
  { commodity: 'Beans',  pricePerKg: 2_500 },
  { commodity: 'Rice',   pricePerKg: 3_500 },
];

const GRADE_MULTIPLIERS = [
  { code: 'A', name: 'Premium',   mult: 1.30 },
  { code: 'B', name: 'Standard',  mult: 1.00 },
  { code: 'C', name: 'Low Grade', mult: 0.70 },
  { code: 'R', name: 'Rejected',  mult: 0.00 },
];

const ALL_BRANCH_IDS = [
  'BR-KLA', 'BR-JIN', 'BR-MBA', 'BR-FTP',
  'BR-ADJ', 'BR-GUL', 'BR-MBL', 'BR-KIB', 'BR-LIR', 'BR-MBA2',
];

function buildDefaultGradePrices(): GradeCommodityPrice[] {
  let id = 0;
  const rows: GradeCommodityPrice[] = [];
  for (const branchId of ALL_BRANCH_IDS) {
    for (const flat of DEFAULT_FLAT_PRICES) {
      for (const g of GRADE_MULTIPLIERS) {
        rows.push({
          id: `GP-${++id}`,
          branchId,
          commodity: flat.commodity,
          gradeCode: g.code,
          gradeName: g.name,
          pricePerKg: Math.round(flat.pricePerKg * g.mult / 50) * 50,
        });
      }
    }
  }
  return rows;
}

@Injectable({ providedIn: 'root' })
export class CooperativePricingService {

  private readonly _useGrades = new BehaviorSubject<boolean>(false);
  private readonly _flatPrices = new BehaviorSubject<FlatCommodityPrice[]>([...DEFAULT_FLAT_PRICES]);
  private readonly _branchFlatPrices = new BehaviorSubject<Map<string, FlatCommodityPrice[]>>(new Map());
  private readonly _gradePrices = new BehaviorSubject<GradeCommodityPrice[]>(buildDefaultGradePrices());

  readonly useGrades$: Observable<boolean> = this._useGrades.asObservable();

  get useGrades(): boolean          { return this._useGrades.value; }
  get gradeOptions(): GradeOption[] { return GRADE_OPTIONS; }

  setUseGrades(value: boolean): void {
    this._useGrades.next(value);
  }

  getFlatPrices(branchId?: string): FlatCommodityPrice[] {
    if (branchId) {
      const override = this._branchFlatPrices.value.get(branchId);
      if (override) return override.map(p => ({ ...p }));
    }
    return [...this._flatPrices.value];
  }

  hasBranchFlatOverride(branchId: string): boolean {
    return this._branchFlatPrices.value.has(branchId);
  }

  updateFlatPrices(prices: FlatCommodityPrice[], branchId?: string): void {
    if (branchId) {
      const updated = new Map(this._branchFlatPrices.value);
      updated.set(branchId, prices.map(p => ({ ...p })));
      this._branchFlatPrices.next(updated);
    } else {
      this._flatPrices.next(prices.map(p => ({ ...p })));
    }
  }

  getGradePrices(branchId: string): GradeCommodityPrice[] {
    return this._gradePrices.value.filter(p => p.branchId === branchId);
  }

  updateGradePrices(branchId: string, prices: GradeCommodityPrice[]): void {
    const others = this._gradePrices.value.filter(p => p.branchId !== branchId);
    this._gradePrices.next([...others, ...prices]);
  }

  getUnitPrice(branchId: string, commodity: string, gradeCode?: string): number {
    if (this._useGrades.value && gradeCode) {
      const match = this._gradePrices.value.find(
        p => p.branchId === branchId &&
             p.commodity.toLowerCase() === commodity.toLowerCase() &&
             p.gradeCode === gradeCode,
      );
      return match?.pricePerKg ?? 0;
    }
    const branchOverride = this._branchFlatPrices.value.get(branchId);
    const source = branchOverride ?? this._flatPrices.value;
    const flat = source.find(p => p.commodity.toLowerCase() === commodity.toLowerCase());
    return flat?.pricePerKg ?? 0;
  }
}
