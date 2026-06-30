import { Injectable } from '@angular/core';

export interface ReportColumn {
  key: string;
  label: string;
  selected: boolean;
  type: 'text' | 'number' | 'date' | 'currency' | 'status';
}

export interface ChartOption {
  id: string;
  label: string;
  type: 'line' | 'bar' | 'donut' | 'horizontal-bar';
  selected: boolean;
}

export interface CustomReportConfig {
  name: string;
  dataSource: 'deliveries' | 'grading' | 'payments' | 'members';
  columns: ReportColumn[];
  charts: ChartOption[];
  groupBy: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  dateRange: { start: string; end: string };
}

// Holds the report configuration the user built in the builder so it can be read
// by custom-report-view after the router transition (avoids query-param serialisation).
@Injectable({ providedIn: 'root' })
export class ReportConfigService {
  currentReportConfig: CustomReportConfig | null = null;
}

// Backwards-compat alias — remove once all imports are updated.
export { ReportConfigService as ReportsStateService };
