import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ToggleSwitchComponent } from '../../../../shared/components/toggle-switch/toggle-switch.component';
import {
  ReportColumn,
  ChartOption,
  CustomReportConfig,
} from '../../../../core/services/reports-state.service';

export type { ReportColumn, ChartOption, CustomReportConfig };

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
    { key: 'name',        label: 'Farmer Name',        selected: true,  type: 'text'     },
    { key: 'branch',      label: 'Branch',             selected: true,  type: 'text'     },
    { key: 'registered',  label: 'Registered',         selected: true,  type: 'date'     },
    { key: 'deliveries',  label: 'Total Deliveries',   selected: true,  type: 'number'   },
    { key: 'totalValue',  label: 'Total Value (UGX)', selected: true,  type: 'currency' },
    { key: 'lastActive',  label: 'Last Active',        selected: true,  type: 'date'     },
    { key: 'status',      label: 'Status',             selected: true,  type: 'status'   },
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

@Component({
  selector: 'app-custom-report-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, InputComponent, ToggleSwitchComponent],
  templateUrl: './custom-report-builder.component.html',
  styleUrls: ['./custom-report-builder.component.css']
})
export class CustomReportBuilderComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() generated = new EventEmitter<CustomReportConfig>();

  config: CustomReportConfig = {
    name: '',
    dataSource: 'deliveries',
    columns: [],
    charts: [],
    groupBy: 'Branch',
    sortBy: 'Quantity (MT)',
    sortOrder: 'desc',
    dateRange: { start: '', end: '' },
  };

  generating = false;

  get currentColumns(): ReportColumn[] { return this.config.columns; }
  get currentCharts(): ChartOption[] { return this.config.charts; }
  get groupByOptions(): string[] { return GROUP_BY_OPTIONS[this.config.dataSource] || []; }
  get sortByOptions(): string[] { return SORT_BY_OPTIONS[this.config.dataSource] || []; }

  ngOnInit(): void {
    this.onDataSourceChange(this.config.dataSource);
  }

  onDataSourceChange(source: string): void {
    const src = source as CustomReportConfig['dataSource'];
    this.config.dataSource = src;
    // Deep-copy so mutations don't affect the template
    this.config.columns = COLUMNS_BY_SOURCE[src].map(c => ({ ...c }));
    this.config.charts = CHART_OPTIONS.map(c => ({ ...c }));
    this.config.groupBy = GROUP_BY_OPTIONS[src][0];
    this.config.sortBy = SORT_BY_OPTIONS[src][0];
  }

  toggleColumn(col: ReportColumn): void {
    col.selected = !col.selected;
  }

  selectAllColumns(): void {
    this.config.columns.forEach(c => (c.selected = true));
  }

  deselectAllColumns(): void {
    this.config.columns.forEach(c => (c.selected = false));
  }

  get selectedColumnCount(): number {
    return this.config.columns.filter(c => c.selected).length;
  }

  get selectedChartCount(): number {
    return this.config.charts.filter(c => c.selected).length;
  }

  get previewText(): string {
    const cols = this.selectedColumnCount;
    const charts = this.selectedChartCount;
    const startLabel = this.config.dateRange.start || 'selected start';
    const endLabel = this.config.dateRange.end || 'today';
    return `This report will include ${cols} column${cols !== 1 ? 's' : ''} and ${charts} chart${charts !== 1 ? 's' : ''}, grouped by ${this.config.groupBy}, sorted by ${this.config.sortBy} ${this.config.sortOrder === 'desc' ? 'descending' : 'ascending'}, for the period ${startLabel} – ${endLabel}.`;
  }

  generateReport(): void {
    if (!this.config.name.trim()) return;
    this.generating = true;
    setTimeout(() => {
      this.generating = false;
      this.generated.emit({ ...this.config });
      this.closed.emit();
    }, 600);
  }

  onClose(): void {
    this.closed.emit();
  }
}
