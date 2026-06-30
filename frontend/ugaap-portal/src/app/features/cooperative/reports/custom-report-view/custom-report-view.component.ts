import {
  Component, OnInit, OnDestroy, AfterViewInit, TemplateRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { ReportConfigService, CustomReportConfig } from '../../../../core/services/reports-state.service';
import { ExportService } from '../../../../core/services/export.service';
import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ChartCardComponent } from '../../../../shared/components/chart-card/chart-card.component';
import { ExportDropdownComponent } from '../../../../shared/components/export-dropdown/export-dropdown.component';
import { CustomReportBuilderComponent } from '../custom-report-builder/custom-report-builder.component';

import { ReportsService } from '../../../../core/services/reports.service';

type BadgeVariant = 'active' | 'pending' | 'inactive' | 'suspended' | 'overdue' | 'settled' | 'partial' | 'verified' | 'failed' | 'draft' | 'open' | 'closed' | 'healthy' | 'low' | 'info';

@Component({
  selector: 'app-custom-report-view',
  standalone: true,
  imports: [
    CommonModule, TableComponent, BadgeComponent, ButtonComponent,
    ChartCardComponent, ExportDropdownComponent, CustomReportBuilderComponent,
  ],
  templateUrl: './custom-report-view.component.html',
  styleUrls: ['./custom-report-view.component.css']
})
export class CustomReportViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusTpl') statusTpl!: TemplateRef<any>;

  config: CustomReportConfig | null = null;
  tableColumns: TableColumn[] = [];
  tableData: any[] = [];
  generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  exportLoading = false;
  showEditor = false;

  currentPage = 1;
  itemsPerPage = 8;

  private chartMap = new Map<string, Chart>();

  constructor(
    private router: Router,
    private stateService: ReportConfigService,
    private exportService: ExportService,
    private reportsService: ReportsService,
  ) {}

  ngOnInit(): void {
    this.config = this.stateService.currentReportConfig;
    if (!this.config) {
      this.router.navigate(['/cooperative/reports']);
      return;
    }
    this.buildTableData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.buildTableColumns();
      this.initSelectedCharts();
    }, 60);
  }

  ngOnDestroy(): void {
    this.chartMap.forEach(c => c.destroy());
    this.chartMap.clear();
  }

  private buildTableData(): void {
    if (!this.config) return;
    const raw = this.reportsService.getCustomReportData(this.config.dataSource);
    const selectedKeys = this.config.columns.filter(c => c.selected).map(c => c.key);
    this.tableData = raw.map(row => {
      const filtered: any = {};
      selectedKeys.forEach(k => (filtered[k] = row[k]));
      return filtered;
    });
  }

  private buildTableColumns(): void {
    if (!this.config) return;
    const selected = this.config.columns.filter(c => c.selected);
    this.tableColumns = selected.map(col => ({
      key: col.key,
      label: col.label,
      sortable: col.type === 'number' || col.type === 'date',
      template: col.type === 'status' ? this.statusTpl : undefined,
    }));
  }

  private initSelectedCharts(): void {
    if (!this.config) return;
    this.config.charts.filter(c => c.selected).forEach(chart => {
      switch (chart.id) {
        case 'trend':        this.initTrendChart(); break;
        case 'distribution': this.initDistChart(); break;
        case 'branch':       this.initBranchChart(); break;
        case 'performers':   this.initPerformersChart(); break;
      }
    });
  }

  private initChart(id: string, key: string, config: any): void {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (!canvas) return;
    const existing = this.chartMap.get(key);
    if (existing) existing.destroy();
    const chart = new Chart(canvas, config);
    this.chartMap.set(key, chart);
  }

  private initTrendChart(): void {
    const { labels, data } = this.reportsService.getDeliveryTrendSeries('monthly');
    this.initChart('cv-trend-chart', 'cv-trend', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Volume (MT)', data,
          borderColor: '#F25D27', backgroundColor: 'rgba(242,93,39,0.08)',
          fill: true, tension: 0.4, borderWidth: 2.5,
          pointBackgroundColor: '#F25D27', pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#200B26', titleColor: '#fff', bodyColor: '#E5E7EB', padding: 10 },
        },
        scales: {
          x: { grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } },
          y: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } },
        },
      },
    });
  }

  private initDistChart(): void {
    const { labels, data } = this.reportsService.getDeliveryStatusSplit();
    const centerPlugin = {
      id: 'centerText',
      beforeDraw: (chart: Chart) => {
        const vals = chart.data.datasets[0].data as number[];
        const total = vals.reduce((s, v) => s + (v as number), 0);
        const { ctx, chartArea } = chart as any;
        if (!chartArea) return;
        ctx.save();
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillStyle = '#200B26';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(total), (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2);
        ctx.restore();
      },
    };
    this.initChart('cv-dist-chart', 'cv-dist', {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: ['#F59E0B', '#10B981', '#3B82F6'], borderWidth: 0 }],
      },
      options: {
        cutout: '65%', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, padding: 16 } },
          tooltip: { backgroundColor: '#200B26', titleColor: '#fff', bodyColor: '#E5E7EB' },
        },
      },
      plugins: [centerPlugin],
    });
  }

  private initBranchChart(): void {
    const { labels, data } = this.reportsService.getDeliveryByBranch();
    this.initChart('cv-branch-chart', 'cv-branch', {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Volume (MT)', data, backgroundColor: '#F25D27', borderRadius: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#200B26', titleColor: '#fff', bodyColor: '#E5E7EB' },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } },
          y: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } },
        },
      },
    });
  }

  private initPerformersChart(): void {
    const { labels, data } = this.reportsService.getTopFarmersDelivery();
    this.initChart('cv-perf-chart', 'cv-perf', {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Qty (MT)', data, backgroundColor: '#F25D27', borderRadius: 6 }],
      },
      options: {
        indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#200B26', titleColor: '#fff', bodyColor: '#E5E7EB' },
        },
        scales: {
          x: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } },
          y: { grid: { display: false }, ticks: { color: '#374151', font: { family: 'Inter', size: 11 } } },
        },
      },
    });
  }

  isChartSelected(id: string): boolean {
    return !!this.config?.charts.find(c => c.id === id && c.selected);
  }

  get selectedChartCount(): number {
    return this.config?.charts.filter(c => c.selected).length ?? 0;
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.tableData.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.tableData.length / this.itemsPerPage));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getStatusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      Graded: 'verified', Paid: 'settled', Pending: 'pending',
      Settled: 'settled', Partial: 'partial', Active: 'active', Inactive: 'inactive',
      Overdue: 'overdue',
    };
    return map[status] ?? 'info';
  }

  onExport(type: 'excel' | 'pdf' | 'csv' | 'print'): void {
    if (!this.config) return;
    this.exportLoading = true;
    const cols = this.config.columns.filter(c => c.selected);
    const flatData = this.tableData.map(row => {
      const out: any = {};
      cols.forEach(c => (out[c.label] = row[c.key]));
      return out;
    });
    const fileName = `${this.config.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    setTimeout(() => {
      try {
        if (type === 'excel') this.exportService.exportToExcel(flatData, fileName, this.config!.dataSource);
        else if (type === 'pdf') this.exportService.exportToPDF(flatData, cols.map(c => ({ key: c.label, label: c.label })), fileName, this.config!.name);
        else if (type === 'csv') this.exportService.exportToCSV(flatData, fileName);
        else this.exportService.printReport('cv-print-area');
      } finally {
        this.exportLoading = false;
      }
    }, 100);
  }

  onEdited(config: CustomReportConfig): void {
    this.stateService.currentReportConfig = config;
    this.config = config;
    this.buildTableData();
    this.chartMap.forEach(c => c.destroy());
    this.chartMap.clear();
    setTimeout(() => { this.buildTableColumns(); this.initSelectedCharts(); }, 60);
  }

  goBack(): void {
    this.router.navigate(['/cooperative/reports']);
  }
}
