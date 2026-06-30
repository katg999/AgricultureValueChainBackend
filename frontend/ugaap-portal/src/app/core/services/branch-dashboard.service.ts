// core/services/branch-dashboard.service.ts
//
// Supplies all data for the Branch staff home screen AND the stat-card summaries
// used on individual branch feature pages (collections, farmers, inventory).
// Swap `of(...)` bodies for http.get(...) when the API is ready.

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  TodayDelivery,
  MOCK_BRANCH_STATS,
  MOCK_TODAY_DELIVERIES,
  MOCK_BRANCH_DASH_ACTIVITIES,
} from '../mock/mock-branch';

export type { TodayDelivery } from '../mock/mock-branch';

// Stat-card summaries for individual branch feature pages.
// Each key maps to the page that displays those cards.
// When the API is ready, replace with real HTTP calls keyed by branchId.
export interface BranchPageStats {
  collections: {
    todayVolumeMt: string;
    gradingQueue:  number;
    approvedToday: number;
    rejectedToday: number;
  };
  farmers: {
    total:              number;
    active:             number;
    pending:            number;
    newMonth:           number;
    collectionProgress: number; // % of season target collected
  };
  inventory: {
    stockOnHandMt:  string;
    capacityPct:    number;
    lowStockItems:  number;
    pendingRequests: number;
  };
}

const MOCK_BRANCH_PAGE_STATS: BranchPageStats = {
  collections: {
    todayVolumeMt: '2.4 MT',
    gradingQueue:  18,
    approvedToday: 4,
    rejectedToday: 1,
  },
  farmers: {
    total:              142,
    active:             128,
    pending:            11,
    newMonth:           3,
    collectionProgress: 78,
  },
  inventory: {
    stockOnHandMt:   '15.6 MT',
    capacityPct:     68,
    lowStockItems:   2,
    pendingRequests: 1,
  },
};

@Injectable({ providedIn: 'root' })
export class BranchDashboardService {

  // ── Home screen data ──────────────────────────────────────────────────────

  getStats(): Observable<typeof MOCK_BRANCH_STATS> {
    return of([...MOCK_BRANCH_STATS]);
  }

  getTodayDeliveries(): Observable<TodayDelivery[]> {
    return of([...MOCK_TODAY_DELIVERIES]);
  }

  getRecentActivities(): Observable<typeof MOCK_BRANCH_DASH_ACTIVITIES> {
    return of([...MOCK_BRANCH_DASH_ACTIVITIES]);
  }

  // ── Individual page stat cards ────────────────────────────────────────────
  // Pages (collections, farmers, inventory) call these instead of hardcoding.

  getCollectionsStats(): Observable<BranchPageStats['collections']> {
    return of({ ...MOCK_BRANCH_PAGE_STATS.collections });
  }

  getFarmersStats(): Observable<BranchPageStats['farmers']> {
    return of({ ...MOCK_BRANCH_PAGE_STATS.farmers });
  }

  getInventoryStats(): Observable<BranchPageStats['inventory']> {
    return of({ ...MOCK_BRANCH_PAGE_STATS.inventory });
  }
}
