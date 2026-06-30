import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
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
  ReportConfigService,
} from '../../../../core/services/reports-state.service';

export type { ReportColumn, ChartOption, CustomReportConfig };

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

  private reportConfig = inject(ReportConfigService);

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
  get groupByOptions(): string[] { return this.reportConfig.getGroupByOptions(this.config.dataSource); }
  get sortByOptions(): string[] { return this.reportConfig.getSortByOptions(this.config.dataSource); }

  ngOnInit(): void {
    this.onDataSourceChange(this.config.dataSource);
  }

  onDataSourceChange(source: string): void {
    const src = source as CustomReportConfig['dataSource'];
    this.config.dataSource = src;
    this.config.columns = this.reportConfig.getColumnsBySource(src);
    this.config.charts  = this.reportConfig.getChartOptions();
    this.config.groupBy = this.reportConfig.getGroupByOptions(src)[0];
    this.config.sortBy  = this.reportConfig.getSortByOptions(src)[0];
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
