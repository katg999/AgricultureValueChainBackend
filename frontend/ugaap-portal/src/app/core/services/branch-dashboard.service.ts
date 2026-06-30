// core/services/branch-dashboard.service.ts
//
// Supplies all data for the Branch staff home screen AND the stat-card summaries
// used on individual branch feature pages (collections, farmers, inventory).
// Automatically switches between mock and HTTP endpoints based on global config.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { USE_MOCK } from '../mock/mock-config';
import {
  TodayDelivery,
  MOCK_BRANCH_STATS,
  MOCK_TODAY_DELIVERIES,
  MOCK_BRANCH_DASH_ACTIVITIES,
} from '../mock/mock-branch';
import { StatCardData } from '../../shared/components/stat-card/stat-card.component';

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

export interface BranchActivity {
  title:     string;
  subtitle?: string;
  timestamp: string;
  action?:   string;
  color:     string;
}

@Injectable({ providedIn: 'root' })
export class BranchDashboardService {
  private apiUrl = 'http://localhost:8083/api/v1/branch-dashboard';

  constructor(private http: HttpClient) {}

  // ── Home screen data ──────────────────────────────────────────────────────

  getStats(): Observable<StatCardData[]> {
    if (USE_MOCK) {
      return of([...MOCK_BRANCH_STATS] as StatCardData[]);
    }
    return this.http.get<StatCardData[]>(`${this.apiUrl}/stats`).pipe(
      catchError(() => of([])),
    );
  }

  getTodayDeliveries(): Observable<TodayDelivery[]> {
    if (USE_MOCK) {
      return of([...MOCK_TODAY_DELIVERIES]);
    }
    return this.http.get<TodayDelivery[]>(`${this.apiUrl}/today-deliveries`).pipe(
      catchError(() => of([])),
    );
  }

  getRecentActivities(): Observable<BranchActivity[]> {
    if (USE_MOCK) {
      return of([...MOCK_BRANCH_DASH_ACTIVITIES]);
    }
    return this.http.get<BranchActivity[]>(`${this.apiUrl}/recent-activities`).pipe(
      catchError(() => of([])),
    );
  }

  // ── Individual page stat cards ────────────────────────────────────────────

  getCollectionsStats(): Observable<BranchPageStats['collections']> {
    if (USE_MOCK) {
      return of({ ...MOCK_BRANCH_PAGE_STATS.collections });
    }
    return this.http.get<BranchPageStats['collections']>(`${this.apiUrl}/collections-stats`);
  }

  getFarmersStats(): Observable<BranchPageStats['farmers']> {
    if (USE_MOCK) {
      return of({ ...MOCK_BRANCH_PAGE_STATS.farmers });
    }
    return this.http.get<BranchPageStats['farmers']>(`${this.apiUrl}/farmers-stats`);
  }

  getInventoryStats(): Observable<BranchPageStats['inventory']> {
    if (USE_MOCK) {
      return of({ ...MOCK_BRANCH_PAGE_STATS.inventory });
    }
    return this.http.get<BranchPageStats['inventory']>(`${this.apiUrl}/inventory-stats`);
  }
}
