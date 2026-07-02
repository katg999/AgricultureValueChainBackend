import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  MOCK_REPORT_DELIVERIES_DATA,
  MOCK_REPORT_GRADING_DATA,
  MOCK_REPORT_PAYMENTS_DATA,
  MOCK_REPORT_MEMBERS_DATA,
  MOCK_CUSTOM_REPORT_DATA,
  MOCK_DELIVERY_TREND,
  MOCK_DELIVERY_BY_BRANCH,
  MOCK_DELIVERY_STATUS_SPLIT,
  MOCK_TOP_FARMERS_DELIVERY,
  MOCK_GRADING_DISTRIBUTION,
  MOCK_GRADING_BY_BRANCH,
  MOCK_QUALITY_TREND,
  MOCK_REJECTION_RATES,
  MOCK_PAYMENT_STATUS_BY_BRANCH,
  MOCK_PAYMENT_TREND,
  MOCK_RECOVERY_RATE,
  MOCK_OUTSTANDING_BY_BRANCH,
  MOCK_MEMBER_TREND,
  MOCK_MEMBERS_BY_BRANCH,
  MOCK_ACTIVE_MEMBER_SPLIT,
  MOCK_TOP_FARMERS_DELIVERIES,
  ChartSeries,
  StackedChartSeries,
} from '../mock/mock-cooperative';

export type { ChartSeries, StackedChartSeries };
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

  // ── Chart series getters ──────────────────────────────────────────────────
  // Synchronous — chart init in ngAfterViewInit needs data immediately.
  // Swap for HTTP calls in a future API layer without touching the component.

  getDeliveryTrendSeries(period: 'daily' | 'weekly' | 'monthly'): ChartSeries {
    return MOCK_DELIVERY_TREND[period] ?? MOCK_DELIVERY_TREND['monthly'];
  }

  getDeliveryByBranch():    ChartSeries { return MOCK_DELIVERY_BY_BRANCH;    }
  getDeliveryStatusSplit(): ChartSeries { return MOCK_DELIVERY_STATUS_SPLIT; }
  getTopFarmersDelivery():  ChartSeries { return MOCK_TOP_FARMERS_DELIVERY;  }

  getGradingDistribution():  ChartSeries        { return MOCK_GRADING_DISTRIBUTION;    }
  getGradingByBranch():      StackedChartSeries { return MOCK_GRADING_BY_BRANCH;       }
  getQualityTrend():         ChartSeries        { return MOCK_QUALITY_TREND;           }
  getRejectionRates():       ChartSeries        { return MOCK_REJECTION_RATES;         }

  getPaymentStatusByBranch(): StackedChartSeries { return MOCK_PAYMENT_STATUS_BY_BRANCH; }
  getPaymentTrend():           ChartSeries       { return MOCK_PAYMENT_TREND;             }
  getRecoveryRate():           number            { return MOCK_RECOVERY_RATE;             }
  getOutstandingByBranch():    ChartSeries       { return MOCK_OUTSTANDING_BY_BRANCH;     }

  getMemberTrend():           ChartSeries { return MOCK_MEMBER_TREND;           }
  getMembersByBranch():       ChartSeries { return MOCK_MEMBERS_BY_BRANCH;      }
  getActiveMemberSplit():     ChartSeries { return MOCK_ACTIVE_MEMBER_SPLIT;    }
  getTopFarmersByDeliveries(): ChartSeries { return MOCK_TOP_FARMERS_DELIVERIES; }
}
