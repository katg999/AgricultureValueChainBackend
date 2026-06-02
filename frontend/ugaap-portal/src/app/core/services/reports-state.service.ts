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

@Injectable({ providedIn: 'root' })
export class ReportsStateService {
  currentReportConfig: CustomReportConfig | null = null;
}
