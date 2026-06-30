// core/services/cooperative-dashboard.service.ts
//
// Supplies all data for the Cooperative Admin home screen.
// Automatically switches between mock and HTTP endpoints based on global config.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { USE_MOCK } from '../mock/mock-config';
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
import { StatCardData } from '../../shared/components/stat-card/stat-card.component';

// Re-export types so components only need to import from the service
export type { BranchPerformanceRow, PaymentBreakdownRow } from '../mock/mock-cooperative';

export interface CoopDashboardMeta {
  cooperativeName: string;
  season:          string;
  totalVolume:     string;
}

export interface CoopActivity {
  title:      string;
  subtitle?:  string;
  timestamp:  string;
  action?:    string;
  actionIcon?: string;
  color:      string;
}

@Injectable({ providedIn: 'root' })
export class CooperativeDashboardService {
  private apiUrl = 'http://localhost:8083/api/v1/cooperative-dashboard';

  constructor(private http: HttpClient) {}

  getMeta(): Observable<CoopDashboardMeta> {
    return of({
      cooperativeName: MOCK_COOP_NAME,
      season:          MOCK_COOP_SEASON,
      totalVolume:     MOCK_TOTAL_VOLUME,
    });
  }

  getStats(): Observable<StatCardData[]> {
    if (USE_MOCK) {
      return of([...MOCK_COOP_STATS] as StatCardData[]);
    }
    return this.http.get<StatCardData[]>(`${this.apiUrl}/stats`).pipe(
      catchError(() => of([])),
    );
  }

  getBranchPerformance(): Observable<BranchPerformanceRow[]> {
    if (USE_MOCK) {
      return of([...MOCK_BRANCH_PERFORMANCE]);
    }
    return this.http.get<BranchPerformanceRow[]>(`${this.apiUrl}/branch-performance`).pipe(
      catchError(() => of([])),
    );
  }

  getPaymentBreakdown(): Observable<PaymentBreakdownRow[]> {
    if (USE_MOCK) {
      return of([...MOCK_PAYMENT_BREAKDOWN]);
    }
    return this.http.get<PaymentBreakdownRow[]>(`${this.apiUrl}/payment-breakdown`).pipe(
      catchError(() => of([])),
    );
  }

  getRecentActivities(): Observable<CoopActivity[]> {
    if (USE_MOCK) {
      return of([...MOCK_COOP_ACTIVITIES]);
    }
    return this.http.get<CoopActivity[]>(`${this.apiUrl}/recent-activities`).pipe(
      catchError(() => of([])),
    );
  }
}
