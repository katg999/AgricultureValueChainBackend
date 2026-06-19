import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// ── Interfaces ──────────────────────────────────────────────────────────────

// Flat pricing: the whole cooperative pays one price per commodity regardless of grade.
export interface FlatCommodityPrice {
  commodity: string;
  pricePerKg: number;
}

// Grade pricing: price depends on commodity, grade, AND which branch is recording.
// This is richer — a branch that handles premium coffee pays differently than one
// that handles standard maize.
export interface GradeCommodityPrice {
  id: string;
  branchId: string;
  commodity: string;
  gradeCode: string;   // 'A' | 'B' | 'C' | 'R'
  gradeName: string;   // 'Premium' | 'Standard' | 'Low Grade' | 'Rejected'
  pricePerKg: number;
}

export interface GradeOption {
  code: string;
  name: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

// Standard grades used system-wide. Branch staff pick from this list when recording.
export const GRADE_OPTIONS: GradeOption[] = [
  { code: 'A', name: 'Premium'   },
  { code: 'B', name: 'Standard'  },
  { code: 'C', name: 'Low Grade' },
  { code: 'R', name: 'Rejected'  },
];

// Cooperative-level flat prices — active when the grade toggle is OFF.
const DEFAULT_FLAT_PRICES: FlatCommodityPrice[] = [
  { commodity: 'Maize',  pricePerKg: 2_500 },
  { commodity: 'Coffee', pricePerKg: 6_000 },
  { commodity: 'Beans',  pricePerKg: 2_500 },
  { commodity: 'Rice',   pricePerKg: 3_500 },
];

// Grade multipliers applied on the flat base price to derive grade-specific prices.
// Premium (A) pays 30% more than base; Rejected (R) pays nothing.
const GRADE_MULTIPLIERS = [
  { code: 'A', name: 'Premium',   mult: 1.30 },
  { code: 'B', name: 'Standard',  mult: 1.00 },
  { code: 'C', name: 'Low Grade', mult: 0.70 },
  { code: 'R', name: 'Rejected',  mult: 0.00 },
];

// All branch IDs that need pre-seeded grade prices.
const ALL_BRANCH_IDS = [
  'BR-KLA', 'BR-JIN', 'BR-MBA', 'BR-FTP',
  'BR-ADJ', 'BR-GUL', 'BR-MBL', 'BR-KIB', 'BR-LIR', 'BR-MBA2',
];

// Generates grade prices for every branch × commodity × grade combination.
// Prices are rounded to the nearest 50 UGX to look realistic.
// This runs once at service instantiation — purely a mock/seed helper.
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
          // Round to nearest 50 so prices feel like real figures, not raw calculations.
          pricePerKg: Math.round(flat.pricePerKg * g.mult / 50) * 50,
        });
      }
    }
  }
  return rows;
}

// ── Service ──────────────────────────────────────────────────────────────────

/**
 * Single source of truth for cooperative pricing.
 *
 * Two modes, controlled by a cooperative-wide toggle:
 *  - Grades OFF → flat commodity prices (simpler, one price per crop)
 *  - Grades ON  → per-branch, per-commodity, per-grade prices (richer, more accurate)
 *
 * Flat prices support a per-branch override: if a branch has its own flat
 * prices set, those take precedence over the cooperative default.
 * Branch staff don't set prices — they just record deliveries and the price
 * is auto-filled from whichever mode is active here.
 */
@Injectable({ providedIn: 'root' })
export class CooperativePricingService {

  // The toggle lives here so every component can read the same state.
  private readonly _useGrades = new BehaviorSubject<boolean>(false);

  // Cooperative-wide flat prices — the default when grades are OFF.
  private readonly _flatPrices = new BehaviorSubject<FlatCommodityPrice[]>([...DEFAULT_FLAT_PRICES]);

  // Per-branch flat price overrides (keyed by branchId).
  // A branch not in this map falls back to the cooperative default.
  private readonly _branchFlatPrices = new BehaviorSubject<Map<string, FlatCommodityPrice[]>>(new Map());

  // Grade prices — used when grades are ON.
  private readonly _gradePrices = new BehaviorSubject<GradeCommodityPrice[]>(buildDefaultGradePrices());

  // Components that use OnPush change detection subscribe to this.
  readonly useGrades$: Observable<boolean> = this._useGrades.asObservable();

  get useGrades(): boolean          { return this._useGrades.value; }
  get gradeOptions(): GradeOption[] { return GRADE_OPTIONS; }

  // ── Toggle ─────────────────────────────────────────────────────────────────

  setUseGrades(value: boolean): void {
    this._useGrades.next(value);
  }

  // ── Flat prices ────────────────────────────────────────────────────────────

  /**
   * Returns flat prices for the given branch if it has an override,
   * otherwise returns the cooperative default. Omit branchId to get the default.
   */
  getFlatPrices(branchId?: string): FlatCommodityPrice[] {
    if (branchId) {
      const override = this._branchFlatPrices.value.get(branchId);
      if (override) return override.map(p => ({ ...p }));
    }
    return [...this._flatPrices.value];
  }

  /** True when a branch has its own flat prices set (vs inheriting the default). */
  hasBranchFlatOverride(branchId: string): boolean {
    return this._branchFlatPrices.value.has(branchId);
  }

  /**
   * Saves flat prices.
   * Pass branchId to save a branch-specific override; omit to update the cooperative default.
   */
  updateFlatPrices(prices: FlatCommodityPrice[], branchId?: string): void {
    if (branchId) {
      const updated = new Map(this._branchFlatPrices.value);
      updated.set(branchId, prices.map(p => ({ ...p })));
      this._branchFlatPrices.next(updated);
    } else {
      this._flatPrices.next(prices.map(p => ({ ...p })));
    }
  }

  // ── Grade prices ───────────────────────────────────────────────────────────

  getGradePrices(branchId: string): GradeCommodityPrice[] {
    return this._gradePrices.value.filter(p => p.branchId === branchId);
  }

  updateGradePrices(branchId: string, prices: GradeCommodityPrice[]): void {
    // Keep all other branches' prices untouched; replace only this branch's rows.
    const others = this._gradePrices.value.filter(p => p.branchId !== branchId);
    this._gradePrices.next([...others, ...prices]);
  }

  // ── Unit price lookup ──────────────────────────────────────────────────────

  /**
   * The only price lookup method branch code should call.
   * Picks the right table based on whether grades are currently ON or OFF.
   *
   * @param branchId  The recording branch — only matters when grades are ON.
   * @param commodity Which crop (case-insensitive).
   * @param gradeCode The grade selected at delivery time (ignored when grades are OFF).
   * @returns         Price in UGX per KG, or 0 if no match found.
   */
  getUnitPrice(branchId: string, commodity: string, gradeCode?: string): number {
    if (this._useGrades.value && gradeCode) {
      const match = this._gradePrices.value.find(
        p => p.branchId === branchId &&
             p.commodity.toLowerCase() === commodity.toLowerCase() &&
             p.gradeCode === gradeCode,
      );
      return match?.pricePerKg ?? 0;
    }
    // Grade mode OFF — check branch override first, then fall back to cooperative default.
    const branchOverride = this._branchFlatPrices.value.get(branchId);
    const source = branchOverride ?? this._flatPrices.value;
    const flat = source.find(p => p.commodity.toLowerCase() === commodity.toLowerCase());
    return flat?.pricePerKg ?? 0;
  }
}
