import {
  Component, OnInit, OnDestroy, AfterViewInit, TemplateRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { ReportsStateService, CustomReportConfig } from '../../../../core/services/reports-state.service';
import { ExportService } from '../../../../core/services/export.service';
import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ChartCardComponent } from '../../../../shared/components/chart-card/chart-card.component';
import { ExportDropdownComponent } from '../../../../shared/components/export-dropdown/export-dropdown.component';
import { CustomReportBuilderComponent } from '../custom-report-builder/custom-report-builder.component';

type BadgeVariant = 'active' | 'pending' | 'inactive' | 'suspended' | 'overdue' | 'settled' | 'partial' | 'verified' | 'failed' | 'draft' | 'open' | 'closed' | 'healthy' | 'low' | 'info';

const MOCK_DATA: Record<string, any[]> = {
  deliveries: [
    { branch: 'Hoima', farmer: 'Okello John', date: '2026-05-15', deliveryId: 'DEL-001', quantity: 12.4, grade: 'A', gradeCode: 'A1', value: '3,720,000', paymentStatus: 'Paid', gradedBy: 'Mugisha S.', status: 'Graded' },
    { branch: 'Masindi', farmer: 'Mugisha Peter', date: '2026-05-14', deliveryId: 'DEL-002', quantity: 8.6, grade: 'B', gradeCode: 'B2', value: '2,150,000', paymentStatus: 'Paid', gradedBy: 'Nakato R.', status: 'Paid' },
    { branch: 'Gulu', farmer: 'Nakato Sarah', date: '2026-05-14', deliveryId: 'DEL-003', quantity: 15.2, grade: 'A', gradeCode: 'A2', value: '4,560,000', paymentStatus: 'Pending', gradedBy: 'Otim A.', status: 'Graded' },
    { branch: 'Lira', farmer: 'Apio Grace', date: '2026-05-13', deliveryId: 'DEL-004', quantity: 7.8, grade: 'C', gradeCode: 'C1', value: '1,560,000', paymentStatus: 'Pending', gradedBy: 'Lubega P.', status: 'Pending' },
    { branch: 'Mbale', farmer: 'Otim Charles', date: '2026-05-13', deliveryId: 'DEL-005', quantity: 10.5, grade: 'A', gradeCode: 'A1', value: '3,150,000', paymentStatus: 'Paid', gradedBy: 'Ogen C.', status: 'Paid' },
    { branch: 'Hoima', farmer: 'Lubega James', date: '2026-05-12', deliveryId: 'DEL-006', quantity: 14.1, grade: 'B', gradeCode: 'B1', value: '3,525,000', paymentStatus: 'Pending', gradedBy: 'Mugisha S.', status: 'Graded' },
    { branch: 'Soroti', farmer: 'Atukunda Mary', date: '2026-05-11', deliveryId: 'DEL-007', quantity: 11.8, grade: 'A', gradeCode: 'A2', value: '3,540,000', paymentStatus: 'Paid', gradedBy: 'Apio T.', status: 'Paid' },
  ],
  grading: [
    { branch: 'Hoima', gradeA: 129, gradeB: 56, gradeC: 18, rejected: 12, total: 215, qualityScore: 87, gradedBy: 'Mugisha S.' },
    { branch: 'Masindi', gradeA: 64, gradeB: 48, gradeC: 21, rejected: 9, total: 142, qualityScore: 82, gradedBy: 'Nakato R.' },
    { branch: 'Gulu', gradeA: 44, gradeB: 32, gradeC: 14, rejected: 8, total: 98, qualityScore: 78, gradedBy: 'Otim A.' },
    { branch: 'Lira', gradeA: 39, gradeB: 28, gradeC: 12, rejected: 8, total: 87, qualityScore: 75, gradedBy: 'Lubega P.' },
    { branch: 'Mbale', gradeA: 34, gradeB: 24, gradeC: 10, rejected: 8, total: 76, qualityScore: 73, gradedBy: 'Ogen C.' },
    { branch: 'Soroti', gradeA: 28, gradeB: 20, gradeC: 9, rejected: 7, total: 64, qualityScore: 70, gradedBy: 'Apio T.' },
  ],
  payments: [
    { farmer: 'Okello John', branch: 'Hoima', delivered: 24.5, value: '7,350,000', paid: '7,350,000', outstanding: '0', status: 'Settled' },
    { farmer: 'Mugisha Peter', branch: 'Masindi', delivered: 21.3, value: '5,325,000', paid: '3,000,000', outstanding: '2,325,000', status: 'Partial' },
    { farmer: 'Nakato Sarah', branch: 'Gulu', delivered: 18.7, value: '5,610,000', paid: '5,610,000', outstanding: '0', status: 'Settled' },
    { farmer: 'Apio Grace', branch: 'Lira', delivered: 16.2, value: '3,240,000', paid: '0', outstanding: '3,240,000', status: 'Pending' },
    { farmer: 'Otim Charles', branch: 'Mbale', delivered: 14.8, value: '4,440,000', paid: '4,440,000', outstanding: '0', status: 'Settled' },
    { farmer: 'Kamukama Denis', branch: 'Soroti', delivered: 12.1, value: '3,630,000', paid: '2,000,000', outstanding: '1,630,000', status: 'Partial' },
  ],
  members: [
    { name: 'Okello John', branch: 'Hoima', registered: '2023-03-15', deliveries: 8, totalValue: '24,000,000', lastActive: '2026-05-15', status: 'Active' },
    { name: 'Mugisha Peter', branch: 'Masindi', registered: '2022-11-20', deliveries: 6, totalValue: '15,000,000', lastActive: '2026-05-14', status: 'Active' },
    { name: 'Nakato Sarah', branch: 'Gulu', registered: '2023-06-10', deliveries: 5, totalValue: '18,000,000', lastActive: '2026-05-14', status: 'Active' },
    { name: 'Apio Grace', branch: 'Lira', registered: '2024-01-05', deliveries: 3, totalValue: '9,000,000', lastActive: '2026-04-20', status: 'Inactive' },
    { name: 'Otim Charles', branch: 'Mbale', registered: '2022-08-22', deliveries: 7, totalValue: '21,000,000', lastActive: '2026-05-13', status: 'Active' },
  ],
};

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
    private stateService: ReportsStateService,
    private exportService: ExportService,
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
    const raw = MOCK_DATA[this.config.dataSource] || [];
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
    this.initChart('cv-trend-chart', 'cv-trend', {
      type: 'line',
      data: {
        labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Volume (MT)',
          data: [92, 108, 134, 156, 148, 215],
          borderColor: '#F25D27',
          backgroundColor: 'rgba(242,93,39,0.08)',
          fill: true, tension: 0.4, borderWidth: 2.5,
          pointBackgroundColor: '#F25D27', pointRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#200B26', titleColor: '#fff', bodyColor: '#E5E7EB', padding: 10 }
        },
        scales: {
          x: { grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } },
          y: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  }

  private initDistChart(): void {
    const centerPlugin = {
      id: 'centerText',
      beforeDraw: (chart: Chart) => {
        const data = chart.data.datasets[0].data as number[];
        const total = data.reduce((s, v) => s + (v as number), 0);
        const { ctx, chartArea } = chart as any;
        if (!chartArea) return;
        ctx.save();
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillStyle = '#200B26';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(total), (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2);
        ctx.restore();
      }
    };
    this.initChart('cv-dist-chart', 'cv-dist', {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Graded', 'Paid'],
        datasets: [{ data: [45, 230, 265], backgroundColor: ['#F59E0B', '#10B981', '#3B82F6'], borderWidth: 0 }]
      },
      options: {
        cutout: '65%', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, padding: 16 } },
          tooltip: { backgroundColor: '#200B26', titleColor: '#fff', bodyColor: '#E5E7EB' }
        }
      },
      plugins: [centerPlugin]
    });
  }

  private initBranchChart(): void {
    this.initChart('cv-branch-chart', 'cv-branch', {
      type: 'bar',
      data: {
        labels: ['Hoima', 'Masindi', 'Gulu', 'Lira', 'Mbale', 'Soroti'],
        datasets: [{ label: 'Volume (MT)', data: [215, 142, 98, 87, 76, 64], backgroundColor: '#F25D27', borderRadius: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#200B26', titleColor: '#fff', bodyColor: '#E5E7EB' }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } },
          y: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  }

  private initPerformersChart(): void {
    this.initChart('cv-perf-chart', 'cv-perf', {
      type: 'bar',
      data: {
        labels: ['Ogenga Patrick', 'Okello John', 'Mugisha Peter', 'Nakato Sarah', 'Atukunda Mary'],
        datasets: [{ label: 'Qty (MT)', data: [24.5, 21.3, 18.7, 16.2, 14.8], backgroundColor: '#F25D27', borderRadius: 6 }]
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#200B26', titleColor: '#fff', bodyColor: '#E5E7EB' }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } },
          y: { grid: { display: false }, ticks: { color: '#374151', font: { family: 'Inter', size: 11 } } }
        }
      }
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
