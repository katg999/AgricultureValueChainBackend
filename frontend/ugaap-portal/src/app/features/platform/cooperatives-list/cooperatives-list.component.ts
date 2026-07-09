import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { StatCardComponent, StatCardData } from '../../../shared/components/stat-card/stat-card.component';
// import { PlatformCooperativesService } from '../services/platform-cooperatives.service';

/**
 * Cooperative interface
 */
interface Cooperative {
  id: string;
  name: string;
  code: string;
  country: string;
  branches: number;
  activeFarmers: number;
  season: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected' | 'deleted';
  onboardingProgress: number;
  lastActivity: string;
}

@Component({
  selector: 'app-cooperatives-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableComponent,
    ButtonComponent,
    StatCardComponent,
  ],
  templateUrl: './cooperatives-list.component.html',
  styleUrls: ['./cooperatives-list.component.css']
})
export class CooperativesListComponent implements OnInit {

  // private coopsService = inject(PlatformCooperativesService);

  columns: TableColumn[] = [
    { key: 'name', label: 'ORGANISATION NAME', sortable: true, width: '25%' },
    { key: 'country', label: 'COUNTRY', sortable: true, width: '12%' },
    { key: 'branches', label: 'BRANCHES', sortable: true, width: '10%' },
    { key: 'activeFarmers', label: 'ACTIVE FARMERS', sortable: true, width: '15%' },
    { key: 'season', label: 'SEASON', width: '12%' },
    { key: 'status', label: 'STATUS', width: '13%' },
    { key: 'onboarding', label: 'ONBOARDING', width: '13%' }
  ];

  cooperatives: Cooperative[] = [];
  filteredCooperatives: Cooperative[] = [];

  /** Summary stat cards — computed once, updated after any mutation */
  stats: StatCardData[] = [];

  /**
   * Search query
   */
  searchQuery = '';

  /**
   * Selected status filter
   */
  selectedStatus = 'All Statuses';

  /**
   * Selected country filter
   */
  selectedCountry = 'All Countries';

  /**
   * Loading state
   */
  isLoading = false;

  isExporting = false;

  constructor(private router: Router, private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('Cooperatives List | UGAAP');
    this.filteredCooperatives = [...this.cooperatives];
    this.stats = this.buildStats();
  }

  private buildStats(): StatCardData[] {
    const count = (s: Cooperative['status']) =>
      this.cooperatives.filter(c => c.status === s).length;
    return [
      {
        label:  'Active',
        value:  count('active'),
        icon:   'check',
        trend:  'Fully onboarded',
        trendUp: true,
        status: 'active',
      },
      {
        label:   'Pending Review',
        value:   count('pending'),
        icon:    'clock',
        trend:   'Awaiting approval',
        trendUp: false,
        status:  'warning',
      },
      {
        label:   'Rejected',
        value:   count('rejected'),
        icon:    'alert',
        trend:   'Requires follow-up',
        trendUp: false,
        status:  'critical',
      },
      {
        label:  'Deleted',
        value:  count('deleted'),
        icon:   'settings',
        trend:  'Archived records',
      },
    ];
  }

  onSearch(): void { this.applyFilters(); }
  onStatusChange(): void { this.applyFilters(); }
  onCountryChange(): void { this.applyFilters(); }

  applyFilters(): void {
    let filtered = [...this.cooperatives];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(coop =>
        coop.name.toLowerCase().includes(query) ||
        coop.code.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.selectedStatus !== 'All Statuses') {
      filtered = filtered.filter(coop => coop.status === this.selectedStatus.toLowerCase());
    }

    // Country filter
    if (this.selectedCountry !== 'All Countries') {
      filtered = filtered.filter(coop => coop.country === this.selectedCountry);
    }

    this.filteredCooperatives = filtered;
  }

  /**
   * Handle row click - navigate to cooperative details
   */
  onRowClick(cooperative: Cooperative): void {
    console.log('Navigate to cooperative details:', cooperative.id);
    // TODO: Navigate to details page
    // this.router.navigate(['/cooperatives', cooperative.id]);
  }

  /**
   * Navigate to add new cooperative — uses the platform onboarding wizard
   */
  onAddCooperative(): void {
    this.router.navigate(['/platform/cooperatives/onboard']);
  }

  /**
   * Export cooperatives report
   * Exports the currently filtered list as a CSV file.
   * Responsive: works on any device and respects all active filters.
   */
  onExportReport(): void {
    // Prevent multiple exports
    if (this.isExporting || this.filteredCooperatives.length === 0) {
      return;
    }

    this.isExporting = true;

    // Small delay to allow UI to update (loading indicator)
    setTimeout(() => {
      try {
        // 1. CSV headers (user-friendly)
        const headers = [
          'Organisation Name',
          'Code',
          'Country',
          'Branches',
          'Active Farmers',
          'Season',
          'Status',
          'Onboarding %',
          'Last Activity'
        ];

        // 2. Convert filtered cooperatives to CSV rows
        const rows = this.filteredCooperatives.map(coop => [
          this.escapeCsvValue(coop.name),
          this.escapeCsvValue(coop.code),
          this.escapeCsvValue(coop.country),
          coop.branches.toString(),
          coop.activeFarmers.toString(),
          this.escapeCsvValue(coop.season),
          this.getStatusText(coop.status),
          coop.onboardingProgress.toString(),
          this.escapeCsvValue(coop.lastActivity)
        ]);

        // 3. Combine headers and rows
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');

        // 4. Add UTF-8 BOM for special characters
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

        // 5. Trigger download
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `cooperatives_export_${this.getTimestamp()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        this.isExporting = false;
      }
    }, 50);
  }

  /**
   * Get badge variant for status
   * Maps to your existing badge variants
   */
  getStatusVariant(status: string): 'active' | 'pending' | 'suspended' {
    switch (status) {
      case 'active':    return 'active';
      case 'pending':   return 'pending';
      case 'rejected':  return 'suspended';
      case 'deleted':   return 'suspended';
      default:          return 'pending';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':    return 'ACTIVE';
      case 'pending':   return 'PENDING SETUP';
      case 'suspended': return 'SUSPENDED';
      case 'rejected':  return 'REJECTED';
      case 'deleted':   return 'DELETED';
      default:          return status.toUpperCase();
    }
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  //ADDED helper methods for export 
  /**
   * Escapes a value for CSV:
   * - Wraps in double quotes if it contains commas, quotes, or newlines.
   * - Doubles any existing double quotes.
   */
  private escapeCsvValue(value: string | number): string {
    if (value === undefined || value === null) return '';
    let stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      stringValue = stringValue.replace(/"/g, '""');
      return `"${stringValue}"`;
    }
    return stringValue;
  }

  /**
   * Returns a timestamp string for the filename: YYYYMMDD_HHMMSS
   */
  private getTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

}