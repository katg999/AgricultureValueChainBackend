import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';

// Shared components
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

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
  status: 'active' | 'pending' | 'suspended';
  onboardingProgress: number;
  lastActivity: string;
}

/**
 * Cooperatives List Component
 * 
 * Displays all registered cooperatives in a table view.
 * Provides search, filter, and navigation to onboarding.
 * 
 * Features:
 * - Searchable cooperative list
 * - Status filtering
 * - Country filtering
 * - Add new cooperative
 * - Export report
 * - Click to view details
 * 
 * Flow:
 * List → Click "Add organisation" → Onboarding flow
 * List → Click row → Cooperative details
 */
@Component({
  selector: 'app-cooperatives-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableComponent,
    ButtonComponent
  ],
  templateUrl: './cooperatives-list.component.html',
  styleUrls: ['./cooperatives-list.component.css']
})
export class CooperativesListComponent implements OnInit {

  /**
   * Table columns configuration
   */
  columns: TableColumn[] = [
    { key: 'name', label: 'ORGANISATION NAME', sortable: true, width: '25%' },
    { key: 'country', label: 'COUNTRY', sortable: true, width: '12%' },
    { key: 'branches', label: 'BRANCHES', sortable: true, width: '10%' },
    { key: 'activeFarmers', label: 'ACTIVE FARMERS', sortable: true, width: '15%' },
    { key: 'season', label: 'SEASON', width: '12%' },
    { key: 'status', label: 'STATUS', width: '13%' },
    { key: 'onboarding', label: 'ONBOARDING', width: '13%' }
  ];

  /**
   * Cooperative data
   */
  cooperatives: Cooperative[] = [
    {
      id: 'COOP-UG-092',
      name: 'Banyankole Kweterana',
      code: 'COOP-UG-092',
      country: 'Uganda',
      branches: 12,
      activeFarmers: 4250,
      season: 'Harvest Q3',
      status: 'active',
      onboardingProgress: 100,
      lastActivity: '2 mins ago'
    },
    {
      id: 'COOP-UG-089',
      name: 'Bugisu Cooperative Union',
      code: 'COOP-UG-089',
      country: 'Uganda',
      branches: 28,
      activeFarmers: 15800,
      season: 'Post-Harvest',
      status: 'pending',
      onboardingProgress: 75,
      lastActivity: '1 hour ago'
    },
    {
      id: 'COOP-UG-112',
      name: 'West Acholi Cooperative',
      code: 'COOP-UG-112',
      country: 'Uganda',
      branches: 8,
      activeFarmers: 2100,
      season: 'Planting',
      status: 'suspended',
      onboardingProgress: 100,
      lastActivity: '2 days ago'
    },
    {
      id: 'COOP-UG-015',
      name: 'Nyari-Kigyezi Cooperative',
      code: 'COOP-UG-015',
      country: 'Uganda',
      branches: 15,
      activeFarmers: 6720,
      season: 'Harvest Q3',
      status: 'active',
      onboardingProgress: 100,
      lastActivity: '45 mins ago'
    }
  ];

  /**
   * Filtered data for display
   */
  filteredCooperatives: Cooperative[] = [];

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

  // ADDED for export 
  /**
   * Export loading state
   */
  isExporting = false;

  constructor(private router: Router, private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('Cooperatives List | UGAAP');
    // Initialize filtered data
    this.filteredCooperatives = [...this.cooperatives];
  }

  /**
   * Handle search input
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Handle status filter change
   */
  onStatusChange(): void {
    this.applyFilters();
  }

  /**
   * Handle country filter change
   */
  onCountryChange(): void {
    this.applyFilters();
  }

  /**
   * Apply all filters
   */
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
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      case 'suspended':
        return 'suspended';
      default:
        return 'pending';
    }
  }

  /**
   * Get display text for status
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'pending':
        return 'PENDING SETUP';
      case 'suspended':
        return 'SUSPENDED';
      default:
        return status.toUpperCase();
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