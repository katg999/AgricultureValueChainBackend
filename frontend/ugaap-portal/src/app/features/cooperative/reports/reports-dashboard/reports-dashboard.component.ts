import {
  Component, OnDestroy, AfterViewInit, TemplateRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ChartCardComponent } from '../../../../shared/components/chart-card/chart-card.component';
import { TabNavComponent, TabItem } from '../../../../shared/components/tab-nav/tab-nav.component';
import { ExportDropdownComponent } from '../../../../shared/components/export-dropdown/export-dropdown.component';
import { ExportService } from '../../../../core/services/export.service';
import { ReportConfigService, CustomReportConfig } from '../../../../core/services/reports-state.service';
import { CustomReportBuilderComponent } from '../custom-report-builder/custom-report-builder.component';

import { ReportsService, ReportTab } from '../../../../core/services/reports.service';

type BadgeVariant = 'active' | 'pending' | 'inactive' | 'suspended' | 'overdue' | 'settled' | 'partial' | 'verified' | 'failed' | 'draft' | 'open' | 'closed' | 'healthy' | 'low' | 'info';

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    StatCardComponent, TableComponent, BadgeComponent,
    ButtonComponent, ChartCardComponent, TabNavComponent,
    ExportDropdownComponent, CustomReportBuilderComponent,
  ],
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements AfterViewInit, OnDestroy {

  @ViewChild('deliveryStatusTpl') deliveryStatusTpl!: TemplateRef<any>;
  @ViewChild('paymentStatusTpl')  paymentStatusTpl!:  TemplateRef<any>;
  @ViewChild('memberStatusTpl')   memberStatusTpl!:   TemplateRef<any>;

  // ── Tab config ────────────────────────────────────────────────────────────
  readonly reportTabs: TabItem[] = [
    { id: 'deliveries', label: 'Deliveries' },
    { id: 'grading',    label: 'Grading'    },
    { id: 'payments',   label: 'Payments'   },
    { id: 'members',    label: 'Members'    },
  ];

  activeTab = 'deliveries';

  // ── Filters ───────────────────────────────────────────────────────────────
  filters = { dateRange: 'last30days', branch: 'all', season: '2025-2026' };

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  readonly itemsPerPage = 5;

  // ── Chart state ───────────────────────────────────────────────────────────
  deliveryPeriod: 'daily' | 'weekly' | 'monthly' = 'monthly';
  private chartMap = new Map<string, Chart>();

  // ── Table columns (filled in ngAfterViewInit) ─────────────────────────────
  deliveryColumns: TableColumn[] = [];
  gradingColumns:  TableColumn[] = [];
  paymentColumns:  TableColumn[] = [];
  memberColumns:   TableColumn[] = [];

  // ── UI state ──────────────────────────────────────────────────────────────
  exportLoading = false;
  showReportBuilder = false;

  constructor(
    private router: Router,
    private exportService: ExportService,
    private stateService: ReportConfigService,
    private reportsService: ReportsService,
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setupTableColumns();
      this.initChartsForTab(this.activeTab);
    }, 60);
  }

  ngOnDestroy(): void {
    this.chartMap.forEach(c => c.destroy());
    this.chartMap.clear();
  }

  // ── Tab management ────────────────────────────────────────────────────────

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    setTimeout(() => this.initChartsForTab(tab), 60);
  }

  applyFilters(): void {
    // In production this would trigger a data reload
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  private get activeData(): any[] {
    return this.reportsService.getTabData(this.activeTab as ReportTab);
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.activeData.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.activeData.length / this.itemsPerPage));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ── Active column set for current tab ─────────────────────────────────────

  get activeColumns(): TableColumn[] {
    const map: Record<string, TableColumn[]> = {
      deliveries: this.deliveryColumns,
      grading:    this.gradingColumns,
      payments:   this.paymentColumns,
      members:    this.memberColumns,
    };
    return map[this.activeTab] ?? [];
  }

  // ── Badge variant helpers ─────────────────────────────────────────────────

  getDeliveryStatusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = { Graded: 'verified', Paid: 'settled', Pending: 'pending' };
    return map[status] ?? 'info';
  }

  getPaymentStatusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = { Settled: 'settled', Partial: 'partial', Pending: 'pending', Overdue: 'overdue' };
    return map[status] ?? 'info';
  }

  getMemberStatusVariant(status: string): BadgeVariant {
    return status === 'Active' ? 'active' : 'inactive';
  }

  // ── Table column setup ────────────────────────────────────────────────────

  private setupTableColumns(): void {
    this.deliveryColumns = [
      { key: 'branch',   label: 'Branch',        sortable: true  },
      { key: 'farmer',   label: 'Farmer',         sortable: true  },
      { key: 'date',     label: 'Date',           sortable: true  },
      { key: 'quantity', label: 'Qty (MT)',        sortable: true  },
      { key: 'grade',    label: 'Grade'                           },
      { key: 'value',    label: 'Value (UGX)',     sortable: true  },
      { key: 'status',   label: 'Status',          template: this.deliveryStatusTpl },
    ];
    this.gradingColumns = [
      { key: 'branch',       label: 'Branch',        sortable: true },
      { key: 'gradeA',       label: 'A (MT)',         sortable: true },
      { key: 'gradeB',       label: 'B (MT)',         sortable: true },
      { key: 'gradeC',       label: 'C (MT)',         sortable: true },
      { key: 'rejected',     label: 'Rejected',       sortable: true },
      { key: 'total',        label: 'Total (MT)',      sortable: true },
      { key: 'qualityScore', label: 'Quality Score',  sortable: true },
    ];
    this.paymentColumns = [
      { key: 'farmer',      label: 'Farmer',         sortable: true },
      { key: 'branch',      label: 'Branch',         sortable: true },
      { key: 'delivered',   label: 'Delivered (MT)',  sortable: true },
      { key: 'value',       label: 'Total Value',     sortable: true },
      { key: 'paid',        label: 'Paid (UGX)'                    },
      { key: 'outstanding', label: 'Outstanding'                   },
      { key: 'status',      label: 'Status', template: this.paymentStatusTpl },
    ];
    this.memberColumns = [
      { key: 'name',        label: 'Farmer Name',    sortable: true },
      { key: 'branch',      label: 'Branch',         sortable: true },
      { key: 'registered',  label: 'Registered',     sortable: true },
      { key: 'deliveries',  label: 'Deliveries',     sortable: true },
      { key: 'totalValue',  label: 'Total Value',    sortable: true },
      { key: 'lastActive',  label: 'Last Active',    sortable: true },
      { key: 'status',      label: 'Status', template: this.memberStatusTpl },
    ];
  }

  // ── Export ────────────────────────────────────────────────────────────────

  onExport(type: 'excel' | 'pdf' | 'csv' | 'print', tab: string): void {
    this.exportLoading = true;
    const data = this.reportsService.getTabData(tab as ReportTab);
    const cols = this.activeColumns.filter(c => !c.template).map(c => ({ key: c.key, label: c.label }));
    const flatData = data.map((row: any) => {
      const out: any = {};
      cols.forEach(c => (out[c.label] = row[c.key]));
      return out;
    });
    const fileName = `ugaap_${tab}_${new Date().toISOString().slice(0, 10)}`;
    setTimeout(() => {
      try {
        if (type === 'excel') this.exportService.exportToExcel(flatData, fileName, tab);
        else if (type === 'pdf') this.exportService.exportToPDF(flatData, cols, fileName, `${tab.charAt(0).toUpperCase() + tab.slice(1)} Report`, 'Cooperative Report');
        else if (type === 'csv') this.exportService.exportToCSV(flatData, fileName);
        else this.exportService.printReport('reports-print-area');
      } finally { this.exportLoading = false; }
    }, 100);
  }

  // ── Custom report ─────────────────────────────────────────────────────────

  onReportGenerated(config: CustomReportConfig): void {
    this.stateService.currentReportConfig = config;
    this.router.navigate(['/cooperative/reports/custom-report-view']);
  }

  // ── Chart helpers ─────────────────────────────────────────────────────────

  private initChart(id: string, key: string, cfg: any): void {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (!canvas) return;
    const existing = this.chartMap.get(key);
    if (existing) { existing.destroy(); this.chartMap.delete(key); }
    try {
      this.chartMap.set(key, new Chart(canvas, cfg));
    } catch { /* canvas removed during navigation */ }
  }

  private doughnutCenterPlugin(label: string) {
    return {
      id: `center_${label}`,
      beforeDraw: (chart: any) => {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        ctx.save();
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillStyle = '#200B26';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2);
        ctx.restore();
      }
    };
  }

  private readonly tooltipDefaults = {
    backgroundColor: '#200B26', titleColor: '#ffffff',
    bodyColor: '#E5E7EB', padding: 10, cornerRadius: 8,
  };

  private readonly scaleDefaults = {
    grid: { color: '#F3F4F6' },
    ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } },
  };

  // ── DELIVERIES charts ─────────────────────────────────────────────────────

  private initDeliveryCharts(): void {
    const trend  = this.reportsService.getDeliveryTrendSeries(this.deliveryPeriod);
    const branch = this.reportsService.getDeliveryByBranch();
    const status = this.reportsService.getDeliveryStatusSplit();
    const top    = this.reportsService.getTopFarmersDelivery();

    this.initChart('delivery-trend-chart', 'delivery-trend', {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [{
          label: 'Deliveries (MT)', data: trend.data,
          borderColor: '#F25D27', backgroundColor: 'rgba(242,93,39,0.08)',
          fill: true, tension: 0.4, borderWidth: 2.5,
          pointBackgroundColor: '#F25D27', pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: { x: this.scaleDefaults, y: { ...this.scaleDefaults, beginAtZero: true } },
      },
    });

    this.initChart('delivery-branch-chart', 'delivery-branch', {
      type: 'bar',
      data: {
        labels: branch.labels,
        datasets: [{ label: 'Volume (MT)', data: branch.data, backgroundColor: '#F25D27', borderRadius: 6 }],
      },
      options: {
        indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: {
          x: { ...this.scaleDefaults, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: '#374151', font: { family: 'Inter', size: 11 } } },
        },
      },
    });

    this.initChart('delivery-status-chart', 'delivery-status', {
      type: 'doughnut',
      data: {
        labels: status.labels,
        datasets: [{ data: status.data, backgroundColor: ['#F59E0B', '#10B981', '#3B82F6'], borderWidth: 0 }],
      },
      options: {
        cutout: '65%', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' as const, labels: { font: { family: 'Inter', size: 12 }, padding: 16 } },
          tooltip: this.tooltipDefaults,
        },
      },
      plugins: [this.doughnutCenterPlugin('540')],
    });

    this.initChart('delivery-farmers-chart', 'delivery-farmers', {
      type: 'bar',
      data: {
        labels: top.labels,
        datasets: [{ label: 'Qty (MT)', data: top.data, backgroundColor: '#200B26', borderRadius: 6 }],
      },
      options: {
        indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: {
          x: { ...this.scaleDefaults, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: '#374151', font: { family: 'Inter', size: 11 } } },
        },
      },
    });
  }

  updateDeliveryPeriod(period: 'daily' | 'weekly' | 'monthly'): void {
    this.deliveryPeriod = period;
    const { labels, data } = this.reportsService.getDeliveryTrendSeries(period);
    const chart = this.chartMap.get('delivery-trend');
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.update();
    }
  }

  // ── GRADING charts ────────────────────────────────────────────────────────

  private initGradingCharts(): void {
    const dist    = this.reportsService.getGradingDistribution();
    const branch  = this.reportsService.getGradingByBranch();
    const quality = this.reportsService.getQualityTrend();
    const reject  = this.reportsService.getRejectionRates();

    this.initChart('grading-dist-chart', 'grading-dist', {
      type: 'doughnut',
      data: {
        labels: dist.labels,
        datasets: [{ data: dist.data, backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'], borderWidth: 0 }],
      },
      options: {
        cutout: '65%', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' as const, labels: { font: { family: 'Inter', size: 12 }, padding: 12 } },
          tooltip: this.tooltipDefaults,
        },
      },
      plugins: [this.doughnutCenterPlugin('654 MT')],
    });

    this.initChart('grading-branch-chart', 'grading-branch', {
      type: 'bar',
      data: {
        labels: branch.labels,
        datasets: branch.datasets.map(ds => ({ ...ds, stack: 's' })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' as const, labels: { font: { family: 'Inter', size: 12 }, padding: 12 } },
          tooltip: { ...this.tooltipDefaults, mode: 'index' as const, intersect: false },
        },
        scales: {
          x: { stacked: true, ...this.scaleDefaults },
          y: { stacked: true, beginAtZero: true, ...this.scaleDefaults },
        },
      },
    });

    this.initChart('grading-quality-chart', 'grading-quality', {
      type: 'line',
      data: {
        labels: quality.labels,
        datasets: [{
          label: 'Avg Quality Score', data: quality.data,
          borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)',
          fill: true, tension: 0.4, borderWidth: 2.5,
          pointBackgroundColor: '#10B981', pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: { x: this.scaleDefaults, y: { ...this.scaleDefaults, min: 60, max: 100 } },
      },
    });

    this.initChart('grading-rejection-chart', 'grading-rejection', {
      type: 'bar',
      data: {
        labels: reject.labels,
        datasets: [{ label: 'Rejection Rate (%)', data: reject.data, backgroundColor: '#EF4444', borderRadius: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: {
          x: { ...this.scaleDefaults, grid: { display: false } },
          y: { ...this.scaleDefaults, beginAtZero: true, max: 20 },
        },
      },
    });
  }

  // ── PAYMENTS charts ───────────────────────────────────────────────────────

  private initPaymentCharts(): void {
    const statusByBranch = this.reportsService.getPaymentStatusByBranch();
    const trend          = this.reportsService.getPaymentTrend();
    const recoveryRate   = this.reportsService.getRecoveryRate();
    const outstanding    = this.reportsService.getOutstandingByBranch();

    this.initChart('payment-status-chart', 'payment-status', {
      type: 'bar',
      data: {
        labels: statusByBranch.labels,
        datasets: statusByBranch.datasets.map(ds => ({ ...ds, stack: 's' })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' as const, labels: { font: { family: 'Inter', size: 12 }, padding: 12 } },
          tooltip: { ...this.tooltipDefaults, mode: 'index' as const, intersect: false },
        },
        scales: {
          x: { stacked: true, ...this.scaleDefaults },
          y: { stacked: true, beginAtZero: true, ...this.scaleDefaults },
        },
      },
    });

    this.initChart('payment-trend-chart', 'payment-trend', {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [{
          label: 'Payments (M UGX)', data: trend.data,
          borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)',
          fill: true, tension: 0.4, borderWidth: 2.5,
          pointBackgroundColor: '#3B82F6', pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: { x: this.scaleDefaults, y: { ...this.scaleDefaults, beginAtZero: true } },
      },
    });

    // Half-donut gauge for recovery rate
    const rateLabel = `${recoveryRate}%`;
    const gaugePlugin = {
      id: 'gaugeCenter',
      beforeDraw: (chart: any) => {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        ctx.save();
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = chartArea.bottom - 10;
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillStyle = '#10B981';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(rateLabel, cx, cy);
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#9CA3AF';
        ctx.fillText('Recovery Rate', cx, cy + 14);
        ctx.restore();
      },
    };

    this.initChart('payment-recovery-chart', 'payment-recovery', {
      type: 'doughnut',
      data: {
        datasets: [{ data: [recoveryRate, 100 - recoveryRate], backgroundColor: ['#10B981', '#F3F4F6'], borderWidth: 0 }],
      },
      options: {
        circumference: 180, rotation: -90, cutout: '72%',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
      },
      plugins: [gaugePlugin],
    });

    this.initChart('payment-outstanding-chart', 'payment-outstanding', {
      type: 'bar',
      data: {
        labels: outstanding.labels,
        datasets: [{ label: 'Outstanding (M UGX)', data: outstanding.data, backgroundColor: '#F25D27', borderRadius: 6 }],
      },
      options: {
        indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: {
          x: { ...this.scaleDefaults, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: '#374151', font: { family: 'Inter', size: 11 } } },
        },
      },
    });
  }

  // ── MEMBERS charts ────────────────────────────────────────────────────────

  private initMemberCharts(): void {
    const trend    = this.reportsService.getMemberTrend();
    const branch   = this.reportsService.getMembersByBranch();
    const active   = this.reportsService.getActiveMemberSplit();
    const topFarms = this.reportsService.getTopFarmersByDeliveries();

    this.initChart('member-trend-chart', 'member-trend', {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [{
          label: 'New Members', data: trend.data,
          borderColor: '#F25D27', backgroundColor: 'rgba(242,93,39,0.08)',
          fill: true, tension: 0.4, borderWidth: 2.5,
          pointBackgroundColor: '#F25D27', pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: { x: this.scaleDefaults, y: { ...this.scaleDefaults, beginAtZero: true } },
      },
    });

    this.initChart('member-branch-chart', 'member-branch', {
      type: 'bar',
      data: {
        labels: branch.labels,
        datasets: [{ label: 'Members', data: branch.data, backgroundColor: '#200B26', borderRadius: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: {
          x: { ...this.scaleDefaults, grid: { display: false } },
          y: { ...this.scaleDefaults, beginAtZero: true },
        },
      },
    });

    this.initChart('member-active-chart', 'member-active', {
      type: 'doughnut',
      data: {
        labels: active.labels,
        datasets: [{ data: active.data, backgroundColor: ['#10B981', '#F3F4F6'], borderWidth: 0 }],
      },
      options: {
        cutout: '65%', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' as const, labels: { font: { family: 'Inter', size: 12 }, padding: 16 } },
          tooltip: this.tooltipDefaults,
        },
      },
      plugins: [this.doughnutCenterPlugin('542')],
    });

    this.initChart('member-farmers-chart', 'member-farmers', {
      type: 'bar',
      data: {
        labels: topFarms.labels,
        datasets: [{ label: 'Deliveries', data: topFarms.data, backgroundColor: '#8B5CF6', borderRadius: 6 }],
      },
      options: {
        indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: {
          x: { ...this.scaleDefaults, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: '#374151', font: { family: 'Inter', size: 11 } } },
        },
      },
    });
  }

  // ── Dispatcher ────────────────────────────────────────────────────────────

  private initChartsForTab(tab: string): void {
    switch (tab) {
      case 'deliveries': this.initDeliveryCharts(); break;
      case 'grading':    this.initGradingCharts();  break;
      case 'payments':   this.initPaymentCharts();  break;
      case 'members':    this.initMemberCharts();   break;
    }
  }
}
