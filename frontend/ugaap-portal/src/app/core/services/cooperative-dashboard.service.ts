// core/services/cooperative-dashboard.service.ts
//
// Supplies all data for the Cooperative Admin home screen.
// Returns Observables so the component is ready for real API calls —
// just swap the `of(...)` bodies for http.get(...) calls.

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  BranchPerformanceRow,
  PaymentBreakdownRow,
  MOCK_COOP_NAME,
  MOCK_COOP_SEASON,
  MOCK_TOTAL_VOLUME,
  MOCK_COOP_STATS,
  MOCK_BRANCH_PERFORMANCE,
  MOCK_PAYMENT_BREAKDOWN,
  MOCK_COOP_ACTIVITIES,
} from '../mock/mock-cooperative';

// Re-export types so components only need to import from the service
export type { BranchPerformanceRow, PaymentBreakdownRow } from '../mock/mock-cooperative';

export interface CoopDashboardMeta {
  cooperativeName: string;
  season:          string;
  totalVolume:     string;
}

@Injectable({ providedIn: 'root' })
export class CooperativeDashboardService {

  getMeta(): Observable<CoopDashboardMeta> {
    return of({
      cooperativeName: MOCK_COOP_NAME,
      season:          MOCK_COOP_SEASON,
      totalVolume:     MOCK_TOTAL_VOLUME,
    });
  }

  getStats(): Observable<typeof MOCK_COOP_STATS> {
    return of([...MOCK_COOP_STATS]);
  }

  getBranchPerformance(): Observable<BranchPerformanceRow[]> {
    return of([...MOCK_BRANCH_PERFORMANCE]);
  }

  getPaymentBreakdown(): Observable<PaymentBreakdownRow[]> {
    return of([...MOCK_PAYMENT_BREAKDOWN]);
  }

  getRecentActivities(): Observable<typeof MOCK_COOP_ACTIVITIES> {
    return of([...MOCK_COOP_ACTIVITIES]);
  }
}
