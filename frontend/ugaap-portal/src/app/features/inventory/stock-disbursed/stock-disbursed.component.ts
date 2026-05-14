import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { BadgeComponent } from '../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

type RecoveryStatus = 'settled' | 'partial' | 'overdue';  //Status categories for allocation recovery, used for badges and filtering
type BadgeVariant = 'settled' | 'partial' | 'overdue' | 'info'; //Badge variants corresponding to recovery status, with 'info' for any additional informational badges
type AlertVariant = 'error' | 'warning' | 'info' | 'success'; //Alert variants for recent issues, used to visually differentiate the severity of messages in the UI

interface Allocation {
  id: string;
  farmerName: string;
  branch: string;
  itemType: string;
  quantity: string;
  totalValue: number;
  issueDate: string;
  allocationDate: string;
  outstanding: number;
  status: RecoveryStatus;
}

interface Summary {
  totalAllocations: number;
  fullyRecovered: number;
  totalValue: number;
  partiallyRecovered: number;
  overdue: number;
  recoveryRate: number;
}

interface Performance {
  inputDisbursement: number;
  produceCollected: number;
  maxValue: number;
}

interface RecentIssue {
  variant: AlertVariant;
  message: string;
}

@Component({
  selector: 'app-stock-disbursed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    PageHeaderComponent,
    StatCardComponent,
  ],
  templateUrl: './stock-disbursed.component.html',
  styleUrl: './stock-disbursed.component.css',
})
export class StockDisbursedComponent implements OnInit { // Main component for managing and displaying stock disbursement data
  searchQuery = '';
  filterItemType = '';
  filterBranch = '';
  showAdvancedFilters = false;
  currentPage = 1;
  readonly pageSize = 5;

  readonly allocations: Allocation[] = [
    {
      id: 'AL-1001',
      farmerName: 'Amina Nakato',
      branch: 'Kampala Central',
      itemType: 'Fertilizer',
      quantity: '25 Bags',
      totalValue: 4500000,
      issueDate: '12/05/24',
      allocationDate: '10/05/24',
      outstanding: 0,
      status: 'settled',
    },
    {
      id: 'AL-1002',
      farmerName: 'Moses Okello',
      branch: 'Gulu Branch',
      itemType: 'Seeds',
      quantity: '120 Kgs',
      totalValue: 1800000,
      issueDate: '14/05/24',
      allocationDate: '13/05/24',
      outstanding: 450000,
      status: 'partial',
    },
    {
      id: 'AL-1003',
      farmerName: 'Sarah Namutebi',
      branch: 'Jinja Branch',
      itemType: 'Equipment',
      quantity: '2 Units',
      totalValue: 2600000,
      issueDate: '15/05/24',
      allocationDate: '15/05/24',
      outstanding: 2600000,
      status: 'overdue',
    },
    {
      id: 'AL-1004',
      farmerName: 'Peter Mugisha',
      branch: 'Mbarara Branch',
      itemType: 'Poultry',
      quantity: '18 Sacks',
      totalValue: 1350000,
      issueDate: '16/05/24',
      allocationDate: '16/05/24',
      outstanding: 0,
      status: 'settled',
    },
    {
      id: 'AL-1005',
      farmerName: 'Grace Atim',
      branch: 'Mbale Branch',
      itemType: 'Tools',
      quantity: '10 Pieces',
      totalValue: 950000,
      issueDate: '17/05/24',
      allocationDate: '17/05/24',
      outstanding: 150000,
      status: 'partial',
    },
    {
      id: 'AL-1006',
      farmerName: 'Daniel Kato',
      branch: 'Kampala Central',
      itemType: 'Fertilizer',
      quantity: '12 Bags',
      totalValue: 2100000,
      issueDate: '18/05/24',
      allocationDate: '18/05/24',
      outstanding: 2100000,
      status: 'overdue',
    },
  ];

  filteredAllocations: Allocation[] = [];

  readonly performance: Performance = {  // Mocked performance data for demonstration
    inputDisbursement: 42.0,
    produceCollected: 57.5,
    maxValue: 60,
  };

  readonly recentIssues: RecentIssue[] = [  // Mocked recent issues for demonstration
    {
      variant: 'warning',
      message: 'Two overdue allocations require branch follow-up this week.',
    },
    {
      variant: 'info',
      message: 'Seed allocations in Gulu Branch are tracking below seasonal plan.',
    },
    {
      variant: 'success',
      message: 'Kampala Central recovered all fertilizer allocations issued last cycle.',
    },
  ];

  get summary(): Summary {
    const totalValue = this.allocations.reduce((sum, row) => sum + row.totalValue, 0);
    const fullyRecovered = this.allocations.filter(row => row.status === 'settled').length;
    const partiallyRecovered = this.allocations.filter(row => row.status === 'partial').length;
    const overdue = this.allocations.filter(row => row.status === 'overdue').length;
    const recoveredValue = this.allocations.reduce(
      (sum, row) => sum + (row.totalValue - row.outstanding),
      0,
    );

    return {
      totalAllocations: this.allocations.length,
      fullyRecovered,
      totalValue,
      partiallyRecovered,
      overdue,
      recoveryRate: Math.round((recoveredValue / totalValue) * 100),
    };
  }

  get itemTypes(): string[] {
    return [...new Set(this.allocations.map(row => row.itemType))];
  }

  get branches(): string[] {
    return [...new Set(this.allocations.map(row => row.branch))];
  }

  get visibleAllocations(): Allocation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAllocations.slice(start, start + this.pageSize);
  }

  get totalAllocations(): number {
    return this.filteredAllocations.length;
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.totalAllocations / this.pageSize), 1);
  }

  get visiblePages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get pageStart(): number {
    if (this.totalAllocations === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalAllocations);
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredAllocations = this.allocations.filter(row => {
      const matchesSearch =
        !query ||
        row.farmerName.toLowerCase().includes(query) ||
        row.id.toLowerCase().includes(query);
      const matchesItemType = !this.filterItemType || row.itemType === this.filterItemType;
      const matchesBranch = !this.filterBranch || row.branch === this.filterBranch;

      return matchesSearch && matchesItemType && matchesBranch;
    });

    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  downloadReport(): void {
    window.alert('Stock disbursement report download will be available soon.');
  }

  getBarPercent(value: number, maxValue: number): number {
    if (maxValue <= 0) return 0;
    return Math.min(Math.round((value / maxValue) * 100), 100);
  }

  getStatusVariant(status: RecoveryStatus): BadgeVariant {
    return status;
  }

  trackById(_: number, row: Allocation): string {
    return row.id;
  }
}
