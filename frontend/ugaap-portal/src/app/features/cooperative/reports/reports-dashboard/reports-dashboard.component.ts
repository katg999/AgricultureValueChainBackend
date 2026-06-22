import {
  Component, OnDestroy, AfterViewInit, TemplateRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';
import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ChartCardComponent } from '../../../../shared/components/chart-card/chart-card.component';
import { TabNavComponent, TabItem } from '../../../../shared/components/tab-nav/tab-nav.component';
import { ExportDropdownComponent } from '../../../../shared/components/export-dropdown/export-dropdown.component';
import { ExportService } from '../../../../core/services/export.service';
import { ReportsStateService, CustomReportConfig } from '../../../../core/services/reports-state.service';
import { CustomReportBuilderComponent } from '../custom-report-builder/custom-report-builder.component';

// ── Mock data ──────────────────────────────────────────────────────────────────

const DELIVERIES_DATA = [
  { branch: 'Hoima',   farmer: 'Okello John',     date: '2026-05-15', quantity: 12.4, grade: 'A', value: '3,720,000',  status: 'Graded'  },
  { branch: 'Masindi', farmer: 'Mugisha Peter',    date: '2026-05-14', quantity: 8.6,  grade: 'B', value: '2,150,000',  status: 'Paid'    },
  { branch: 'Gulu',    farmer: 'Nakato Sarah',     date: '2026-05-14', quantity: 15.2, grade: 'A', value: '4,560,000',  status: 'Graded'  },
  { branch: 'Lira',    farmer: 'Apio Grace',       date: '2026-05-13', quantity: 7.8,  grade: 'C', value: '1,560,000',  status: 'Pending' },
  { branch: 'Mbale',   farmer: 'Otim Charles',     date: '2026-05-13', quantity: 10.5, grade: 'A', value: '3,150,000',  status: 'Paid'    },
  { branch: 'Hoima',   farmer: 'Lubega James',     date: '2026-05-12', quantity: 14.1, grade: 'B', value: '3,525,000',  status: 'Graded'  },
  { branch: 'Masindi', farmer: 'Namukasa Ruth',    date: '2026-05-12', quantity: 6.3,  grade: 'A', value: '1,890,000',  status: 'Pending' },
  { branch: 'Gulu',    farmer: 'Ogenga Patrick',   date: '2026-05-11', quantity: 19.7, grade: 'A', value: '5,910,000',  status: 'Paid'    },
  { branch: 'Lira',    farmer: 'Kamukama Denis',   date: '2026-05-11', quantity: 9.2,  grade: 'B', value: '2,300,000',  status: 'Graded'  },
  { branch: 'Soroti',  farmer: 'Atukunda Mary',    date: '2026-05-10', quantity: 11.8, grade: 'A', value: '3,540,000',  status: 'Pending' },
];

const GRADING_DATA = [
  { branch: 'Hoima',   gradeA: 129, gradeB: 56, gradeC: 18, rejected: 12, total: 215, qualityScore: 87 },
  { branch: 'Masindi', gradeA: 64,  gradeB: 48, gradeC: 21, rejected: 9,  total: 142, qualityScore: 82 },
  { branch: 'Gulu',    gradeA: 44,  gradeB: 32, gradeC: 14, rejected: 8,  total: 98,  qualityScore: 78 },
  { branch: 'Lira',    gradeA: 39,  gradeB: 28, gradeC: 12, rejected: 8,  total: 87,  qualityScore: 75 },
  { branch: 'Mbale',   gradeA: 34,  gradeB: 24, gradeC: 10, rejected: 8,  total: 76,  qualityScore: 73 },
  { branch: 'Soroti',  gradeA: 28,  gradeB: 20, gradeC: 9,  rejected: 7,  total: 64,  qualityScore: 70 },
];

const PAYMENTS_DATA = [
  { farmer: 'Okello John',     branch: 'Hoima',   delivered: 24.5, value: '7,350,000',  paid: '7,350,000',  outstanding: '0',          status: 'Settled' },
  { farmer: 'Mugisha Peter',   branch: 'Masindi', delivered: 21.3, value: '5,325,000',  paid: '3,000,000',  outstanding: '2,325,000',  status: 'Partial' },
  { farmer: 'Nakato Sarah',    branch: 'Gulu',    delivered: 18.7, value: '5,610,000',  paid: '5,610,000',  outstanding: '0',          status: 'Settled' },
  { farmer: 'Apio Grace',      branch: 'Lira',    delivered: 16.2, value: '3,240,000',  paid: '0',          outstanding: '3,240,000',  status: 'Pending' },
  { farmer: 'Otim Charles',    branch: 'Mbale',   delivered: 14.8, value: '4,440,000',  paid: '4,440,000',  outstanding: '0',          status: 'Settled' },
  { farmer: 'Lubega James',    branch: 'Hoima',   delivered: 13.6, value: '3,400,000',  paid: '2,000,000',  outstanding: '1,400,000',  status: 'Partial' },
  { farmer: 'Ogenga Patrick',  branch: 'Gulu',    delivered: 11.2, value: '3,360,000',  paid: '0',          outstanding: '3,360,000',  status: 'Overdue' },
  { farmer: 'Kamukama Denis',  branch: 'Soroti',  delivered: 9.8,  value: '2,940,000',  paid: '2,940,000',  outstanding: '0',          status: 'Settled' },
];

const MEMBERS_DATA = [
  { name: 'Okello John',    branch: 'Hoima',   registered: '2023-03-15', deliveries: 8, totalValue: '24,000,000', lastActive: '2026-05-15', status: 'Active'   },
  { name: 'Mugisha Peter',  branch: 'Masindi', registered: '2022-11-20', deliveries: 6, totalValue: '15,000,000', lastActive: '2026-05-14', status: 'Active'   },
  { name: 'Nakato Sarah',   branch: 'Gulu',    registered: '2023-06-10', deliveries: 5, totalValue: '18,000,000', lastActive: '2026-05-14', status: 'Active'   },
  { name: 'Apio Grace',     branch: 'Lira',    registered: '2024-01-05', deliveries: 3, totalValue: '9,000,000',  lastActive: '2026-04-20', status: 'Inactive' },
  { name: 'Otim Charles',   branch: 'Mbale',   registered: '2022-08-22', deliveries: 7, totalValue: '21,000,000', lastActive: '2026-05-13', status: 'Active'   },
  { name: 'Lubega James',   branch: 'Hoima',   registered: '2023-09-12', deliveries: 6, totalValue: '18,000,000', lastActive: '2026-05-12', status: 'Active'   },
  { name: 'Ogenga Patrick', branch: 'Gulu',    registered: '2021-05-03', deliveries: 9, totalValue: '28,000,000', lastActive: '2026-05-11', status: 'Active'   },
  { name: 'Kamukama Denis', branch: 'Soroti',  registered: '2023-07-18', deliveries: 4, totalValue: '12,000,000', lastActive: '2026-05-10', status: 'Active'   },
  { name: 'Atukunda Mary',  branch: 'Soroti',  registered: '2024-02-28', deliveries: 2, totalValue: '6,000,000',  lastActive: '2026-04-30', status: 'Inactive' },
  { name: 'Namukasa Ruth',  branch: 'Masindi', registered: '2023-11-08', deliveries: 5, totalValue: '15,500,000', lastActive: '2026-05-08', status: 'Active'   },
];

type BadgeVariant = 'active' | 'pending' | 'inactive' | 'suspended' | 'overdue' | 'settled' | 'partial' | 'verified' | 'failed' | 'draft' | 'open' | 'closed' | 'healthy' | 'low' | 'info';

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    StatsCardComponent, TableComponent, BadgeComponent,
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
    private stateService: ReportsStateService,
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
    const map: Record<string, any[]> = {
      deliveries: DELIVERIES_DATA,
      grading:    GRADING_DATA,
      payments:   PAYMENTS_DATA,
      members:    MEMBERS_DATA,
    };
    return map[this.activeTab] ?? [];
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
    const data = { deliveries: DELIVERIES_DATA, grading: GRADING_DATA, payments: PAYMENTS_DATA, members: MEMBERS_DATA }[tab] ?? [];
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
    const { labels, data } = this.getDeliveryTrendSeries(this.deliveryPeriod);

    this.initChart('delivery-trend-chart', 'delivery-trend', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Deliveries (MT)', data,
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
        labels: ['Hoima', 'Masindi', 'Gulu', 'Lira', 'Mbale', 'Soroti'],
        datasets: [{ label: 'Volume (MT)', data: [215, 142, 98, 87, 76, 64], backgroundColor: '#F25D27', borderRadius: 6 }],
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
        labels: ['Pending', 'Graded', 'Paid'],
        datasets: [{ data: [45, 230, 265], backgroundColor: ['#F59E0B', '#10B981', '#3B82F6'], borderWidth: 0 }],
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
        labels: ['Ogenga P.', 'Okello J.', 'Mugisha P.', 'Nakato S.', 'Atukunda M.'],
        datasets: [{ label: 'Qty (MT)', data: [24.5, 21.3, 18.7, 16.2, 14.8], backgroundColor: '#200B26', borderRadius: 6 }],
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

  private getDeliveryTrendSeries(period: string): { labels: string[]; data: number[] } {
    const map: Record<string, { labels: string[]; data: number[] }> = {
      monthly: { labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],      data: [92, 108, 134, 156, 148, 215] },
      weekly:  { labels: ['Wk 44','Wk 46','Wk 48','Wk 50','Wk 52','Wk 2','Wk 4','Wk 6','Wk 8','Wk 10'], data: [38, 42, 51, 48, 55, 61, 58, 72, 68, 78] },
      daily:   { labels: ['15 May','16','17','18','19','20','21','22','23','24','25','26','27','28'], data: [18, 12, 24, 16, 20, 8, 15, 22, 19, 25, 14, 18, 21, 28] },
    };
    return map[period] ?? map['monthly'];
  }

  updateDeliveryPeriod(period: 'daily' | 'weekly' | 'monthly'): void {
    this.deliveryPeriod = period;
    const { labels, data } = this.getDeliveryTrendSeries(period);
    const chart = this.chartMap.get('delivery-trend');
    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.update();
    }
  }

  // ── GRADING charts ────────────────────────────────────────────────────────

  private initGradingCharts(): void {
    this.initChart('grading-dist-chart', 'grading-dist', {
      type: 'doughnut',
      data: {
        labels: ['Grade A', 'Grade B', 'Grade C', 'Rejected'],
        datasets: [{ data: [338, 188, 84, 44], backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'], borderWidth: 0 }],
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
        labels: ['Hoima', 'Masindi', 'Gulu', 'Lira', 'Mbale', 'Soroti'],
        datasets: [
          { label: 'Grade A', data: [129, 64, 44, 39, 34, 28], backgroundColor: '#10B981', stack: 's' },
          { label: 'Grade B', data: [56,  48, 32, 28, 24, 20], backgroundColor: '#3B82F6', stack: 's' },
          { label: 'Grade C', data: [18,  21, 14, 12, 10,  9], backgroundColor: '#F59E0B', stack: 's' },
          { label: 'Rejected', data: [12,  9,  8,  8,  8,  7], backgroundColor: '#EF4444', stack: 's' },
        ],
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
        labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Avg Quality Score',
          data: [78, 80, 79, 82, 83, 81],
          borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)',
          fill: true, tension: 0.4, borderWidth: 2.5,
          pointBackgroundColor: '#10B981', pointRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipDefaults },
        scales: {
          x: this.scaleDefaults,
          y: { ...this.scaleDefaults, min: 60, max: 100 },
        },
      },
    });

    this.initChart('grading-rejection-chart', 'grading-rejection', {
      type: 'bar',
      data: {
        labels: ['Hoima', 'Masindi', 'Gulu', 'Lira', 'Mbale', 'Soroti'],
        datasets: [{ label: 'Rejection Rate (%)', data: [5.6, 6.3, 8.2, 9.2, 10.5, 10.9], backgroundColor: '#EF4444', borderRadius: 6 }],
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
    this.initChart('payment-status-chart', 'payment-status', {
      type: 'bar',
      data: {
        labels: ['Hoima', 'Masindi', 'Gulu', 'Lira', 'Mbale', 'Soroti'],
        datasets: [
          { label: 'Settled', data: [32, 18, 12, 8, 7, 5],  backgroundColor: '#10B981', stack: 's' },
          { label: 'Partial', data: [8,  12,  6, 5, 4, 3],  backgroundColor: '#F59E0B', stack: 's' },
          { label: 'Pending', data: [4,   6,  3, 4, 3, 2],  backgroundColor: '#EF4444', stack: 's' },
        ],
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
        labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Payments (M UGX)',
          data: [28, 34, 42, 38, 45, 52],
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
        ctx.fillText('78%', cx, cy);
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#9CA3AF';
        ctx.fillText('Recovery Rate', cx, cy + 14);
        ctx.restore();
      },
    };

    this.initChart('payment-recovery-chart', 'payment-recovery', {
      type: 'doughnut',
      data: {
        datasets: [{ data: [78, 22], backgroundColor: ['#10B981', '#F3F4F6'], borderWidth: 0 }],
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
        labels: ['Masindi', 'Hoima', 'Lira', 'Gulu', 'Mbale', 'Soroti'],
        datasets: [{ label: 'Outstanding (M UGX)', data: [12.6, 8.4, 5.8, 6.2, 3.4, 2.1], backgroundColor: '#F25D27', borderRadius: 6 }],
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
    this.initChart('member-trend-chart', 'member-trend', {
      type: 'line',
      data: {
        labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'New Members',
          data: [8, 12, 6, 14, 10, 14],
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
        labels: ['Hoima', 'Masindi', 'Mbale', 'Gulu', 'Soroti', 'Lira'],
        datasets: [{ label: 'Members', data: [124, 98, 86, 82, 78, 74], backgroundColor: '#200B26', borderRadius: 6 }],
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
        labels: ['Active', 'Inactive'],
        datasets: [{ data: [425, 117], backgroundColor: ['#10B981', '#F3F4F6'], borderWidth: 0 }],
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
        labels: ['Ogenga P.', 'Okello J.', 'Otim C.', 'Lubega J.', 'Mugisha P.'],
        datasets: [{ label: 'Deliveries', data: [9, 8, 7, 6, 6], backgroundColor: '#8B5CF6', borderRadius: 6 }],
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
