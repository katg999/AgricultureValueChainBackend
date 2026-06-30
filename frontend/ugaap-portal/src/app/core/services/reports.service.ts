import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  MOCK_REPORT_DELIVERIES_DATA,
  MOCK_REPORT_GRADING_DATA,
  MOCK_REPORT_PAYMENTS_DATA,
  MOCK_REPORT_MEMBERS_DATA,
  MOCK_CUSTOM_REPORT_DATA,
} from '../mock/mock-cooperative';
import { USE_MOCK } from '../mock/mock-config';

// Tab key type keeps callers type-safe when requesting a specific dataset.
export type ReportTab = 'deliveries' | 'grading' | 'payments' | 'members';

@Injectable({ providedIn: 'root' })
export class ReportsService {

  // Each tab's data lives in its own subject so future API calls can update them independently.
  private readonly _deliveries = new BehaviorSubject<any[]>(USE_MOCK ? [...MOCK_REPORT_DELIVERIES_DATA] : []);
  private readonly _grading    = new BehaviorSubject<any[]>(USE_MOCK ? [...MOCK_REPORT_GRADING_DATA]    : []);
  private readonly _payments   = new BehaviorSubject<any[]>(USE_MOCK ? [...MOCK_REPORT_PAYMENTS_DATA]   : []);
  private readonly _members    = new BehaviorSubject<any[]>(USE_MOCK ? [...MOCK_REPORT_MEMBERS_DATA]    : []);

  // Custom report rows keyed by dataSource string (e.g. 'deliveries', 'grading').
  private readonly _customData: Record<string, any[]> = USE_MOCK ? { ...MOCK_CUSTOM_REPORT_DATA } : {};

  readonly deliveries$ = this._deliveries.asObservable();
  readonly grading$    = this._grading.asObservable();
  readonly payments$   = this._payments.asObservable();
  readonly members$    = this._members.asObservable();

  // Synchronous getter used by the reports dashboard to build the paginated view.
  getTabData(tab: ReportTab): any[] {
    const map: Record<ReportTab, BehaviorSubject<any[]>> = {
      deliveries: this._deliveries,
      grading:    this._grading,
      payments:   this._payments,
      members:    this._members,
    };
    return map[tab]?.value ?? [];
  }

  // Used by custom-report-view to look up rows by the report's configured dataSource.
  getCustomReportData(dataSource: string): any[] {
    return this._customData[dataSource] ?? [];
  }
}
