import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Shared components
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { BadgeComponent } from '../../../shared/components/badge/badge';
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
    BadgeComponent,
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

  constructor(private router: Router) {}

  ngOnInit(): void {
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
   * Navigate to add new cooperative
   */
  onAddCooperative(): void {
    this.router.navigate(['/cooperatives/onboarding']);
  }

  /**
   * Export cooperatives report
   */
  onExportReport(): void {
    console.log('Export cooperatives report');
    // TODO: Implement export functionality
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
}
