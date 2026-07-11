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

// ── Report builder config tables ──────────────────────────────────────────────
// Column definitions and chart/group/sort options per data source.
// Centralised here so the builder and any future summary screens share one source.

const COLUMNS_BY_SOURCE: Record<string, ReportColumn[]> = {
  deliveries: [
    { key: 'branch',        label: 'Branch Name',        selected: true,  type: 'text'     },
    { key: 'farmer',        label: 'Farmer Name',         selected: true,  type: 'text'     },
    { key: 'date',          label: 'Delivery Date',       selected: true,  type: 'date'     },
    { key: 'deliveryId',    label: 'Delivery ID',         selected: false, type: 'text'     },
    { key: 'quantity',      label: 'Quantity (MT)',        selected: true,  type: 'number'   },
    { key: 'grade',         label: 'Grade',               selected: true,  type: 'text'     },
    { key: 'gradeCode',     label: 'Grade Code',          selected: false, type: 'text'     },
    { key: 'value',         label: 'Total Value (UGX)',   selected: true,  type: 'currency' },
    { key: 'paymentStatus', label: 'Payment Status',      selected: false, type: 'status'   },
    { key: 'gradedBy',      label: 'Graded By',           selected: false, type: 'text'     },
    { key: 'status',        label: 'Status',              selected: true,  type: 'status'   },
  ],
  grading: [
    { key: 'branch',       label: 'Branch Name',    selected: true,  type: 'text'   },
    { key: 'gradeA',       label: 'Grade A (MT)',   selected: true,  type: 'number' },
    { key: 'gradeB',       label: 'Grade B (MT)',   selected: true,  type: 'number' },
    { key: 'gradeC',       label: 'Grade C (MT)',   selected: true,  type: 'number' },
    { key: 'rejected',     label: 'Rejected (MT)',  selected: true,  type: 'number' },
    { key: 'total',        label: 'Total (MT)',     selected: true,  type: 'number' },
    { key: 'qualityScore', label: 'Quality Score',  selected: false, type: 'number' },
    { key: 'gradedBy',     label: 'Graded By',      selected: false, type: 'text'   },
  ],
  payments: [
    { key: 'farmer',      label: 'Farmer Name',        selected: true,  type: 'text'     },
    { key: 'branch',      label: 'Branch',             selected: true,  type: 'text'     },
    { key: 'delivered',   label: 'Delivered (MT)',      selected: true,  type: 'number'   },
    { key: 'value',       label: 'Total Value (UGX)',  selected: true,  type: 'currency' },
    { key: 'paid',        label: 'Amount Paid (UGX)',  selected: true,  type: 'currency' },
    { key: 'outstanding', label: 'Outstanding (UGX)', selected: true,  type: 'currency' },
    { key: 'status',      label: 'Payment Status',     selected: true,  type: 'status'   },
  ],
  members: [
    { key: 'name',       label: 'Farmer Name',        selected: true,  type: 'text'     },
    { key: 'branch',     label: 'Branch',             selected: true,  type: 'text'     },
    { key: 'registered', label: 'Registered',         selected: true,  type: 'date'     },
    { key: 'deliveries', label: 'Total Deliveries',   selected: true,  type: 'number'   },
    { key: 'totalValue', label: 'Total Value (UGX)', selected: true,  type: 'currency' },
    { key: 'lastActive', label: 'Last Active',        selected: true,  type: 'date'     },
    { key: 'status',     label: 'Status',             selected: true,  type: 'status'   },
  ],
};

const CHART_OPTIONS: ChartOption[] = [
  { id: 'trend',        label: 'Trend line chart',           type: 'line',           selected: true  },
  { id: 'distribution', label: 'Distribution donut chart',   type: 'donut',          selected: true  },
  { id: 'branch',       label: 'Branch comparison bar chart', type: 'bar',            selected: false },
  { id: 'performers',   label: 'Top performers chart',        type: 'horizontal-bar', selected: false },
];

const GROUP_BY_OPTIONS: Record<string, string[]> = {
  deliveries: ['Branch', 'Farmer', 'Grade', 'Status'],
  grading:    ['Branch', 'Grade'],
  payments:   ['Branch', 'Farmer', 'Status'],
  members:    ['Branch', 'Status'],
};

const SORT_BY_OPTIONS: Record<string, string[]> = {
  deliveries: ['Branch Name', 'Farmer Name', 'Delivery Date', 'Quantity (MT)', 'Total Value (UGX)'],
  grading:    ['Branch Name', 'Grade A (MT)', 'Grade B (MT)', 'Total (MT)', 'Quality Score'],
  payments:   ['Farmer Name', 'Branch', 'Total Value (UGX)', 'Outstanding (UGX)'],
  members:    ['Farmer Name', 'Branch', 'Registered', 'Total Deliveries'],
};

// Holds the report configuration the user built in the builder so it can be read
// by custom-report-view after the router transition (avoids query-param serialisation).
@Injectable({ providedIn: 'root' })
export class ReportConfigService {
  currentReportConfig: CustomReportConfig | null = null;

  // Deep-copy on each call so callers can mutate without affecting the source tables.
  getColumnsBySource(source: CustomReportConfig['dataSource']): ReportColumn[] {
    return (COLUMNS_BY_SOURCE[source] ?? []).map(c => ({ ...c }));
  }

  getChartOptions(): ChartOption[] {
    return CHART_OPTIONS.map(c => ({ ...c }));
  }

  getGroupByOptions(source: CustomReportConfig['dataSource']): string[] {
    return [...(GROUP_BY_OPTIONS[source] ?? [])];
  }

  getSortByOptions(source: CustomReportConfig['dataSource']): string[] {
    return [...(SORT_BY_OPTIONS[source] ?? [])];
  }
}

// Backwards-compat alias — remove once all imports are updated.
export { ReportConfigService as ReportsStateService };
