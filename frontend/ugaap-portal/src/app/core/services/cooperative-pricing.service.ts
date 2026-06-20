// core/services/cooperative-pricing.service.ts
//
// Single source of truth for cooperative-wide pricing state.
// Both the edit-prices page and the cooperative profile page read/write through here
// so the "use grades" toggle stays in sync across navigation.

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FlatCommodityPrice {
  commodity: string;
  pricePerKg: number;
}

export interface GradeCommodityPrice {
  id: string;
  branchId: string;
  commodity: string;
  gradeName: string;
  gradeCode: string;
  pricePerKg: number;
}

// Seed grade prices for the mock branches ─────────────────────────────────────
const COMMODITIES = ['Coffee', 'Maize', 'Beans', 'Rice', 'Sorghum', 'Sunflower', 'Groundnuts', 'Sesame', 'Cotton', 'Millet', 'Cassava'];
const GRADES = [
  { name: 'Grade A', code: 'A' },
  { name: 'Grade B', code: 'B' },
  { name: 'Grade C', code: 'C' },
  { name: 'Grade D', code: 'D' },
];
const BASE_PRICES: Record<string, number> = {
  Coffee: 14000, Maize: 1200, Beans: 3500, Rice: 2800, Sorghum: 1000,
  Sunflower: 2000, Groundnuts: 4000, Sesame: 6000, Cotton: 3000, Millet: 900, Cassava: 600,
};
const GRADE_MULTIPLIERS: Record<string, number> = { A: 1.0, B: 0.9, C: 0.75, D: 0.6 };

function seedGradePrices(branchId: string): GradeCommodityPrice[] {
  const rows: GradeCommodityPrice[] = [];
  for (const commodity of COMMODITIES) {
    for (const grade of GRADES) {
      const base = BASE_PRICES[commodity] ?? 1000;
      rows.push({
        id: `${branchId}-${commodity}-${grade.code}`,
        branchId,
        commodity,
        gradeName: grade.name,
        gradeCode: grade.code,
        pricePerKg: Math.round(base * GRADE_MULTIPLIERS[grade.code] / 50) * 50,
      });
    }
  }
  return rows;
}

const SEED_BRANCHES = ['BR-KLA', 'BR-JIN', 'BR-MBA', 'BR-FTP', 'BR-ADJ', 'BR-GUL', 'BR-MBL', 'BR-KIB', 'BR-LIR', 'BR-MBA2'];

const DEFAULT_FLAT_PRICES: FlatCommodityPrice[] = COMMODITIES.map(c => ({
  commodity: c,
  pricePerKg: BASE_PRICES[c] ?? 1000,
}));

@Injectable({ providedIn: 'root' })
export class CooperativePricingService {

  // ── Grade mode toggle ───────────────────────────────────────────────────────

  private _useGrades = new BehaviorSubject<boolean>(false);

  get useGrades(): boolean { return this._useGrades.value; }

  setUseGrades(value: boolean): void { this._useGrades.next(value); }

  // ── Flat prices ─────────────────────────────────────────────────────────────

  private _defaultFlatPrices: FlatCommodityPrice[] = DEFAULT_FLAT_PRICES.map(p => ({ ...p }));
  private _branchFlatOverrides = new Map<string, FlatCommodityPrice[]>();

  getFlatPrices(branchId?: string): FlatCommodityPrice[] {
    if (branchId && this._branchFlatOverrides.has(branchId)) {
      return this._branchFlatOverrides.get(branchId)!.map(p => ({ ...p }));
    }
    return this._defaultFlatPrices.map(p => ({ ...p }));
  }

  updateFlatPrices(prices: FlatCommodityPrice[], branchId?: string): void {
    if (branchId) {
      this._branchFlatOverrides.set(branchId, prices.map(p => ({ ...p })));
    } else {
      this._defaultFlatPrices = prices.map(p => ({ ...p }));
    }
  }

  // ── Grade prices ────────────────────────────────────────────────────────────

  private _gradePrices = new Map<string, GradeCommodityPrice[]>(
    SEED_BRANCHES.map(id => [id, seedGradePrices(id)]),
  );

  getGradePrices(branchId: string): GradeCommodityPrice[] {
    return (this._gradePrices.get(branchId) ?? []).map(p => ({ ...p }));
  }

  updateGradePrices(branchId: string, prices: GradeCommodityPrice[]): void {
    this._gradePrices.set(branchId, prices.map(p => ({ ...p })));
  }
}
