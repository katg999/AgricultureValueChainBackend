import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { ToastService } from '../../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { BranchService, CooperativeBranch } from '../../../../core/services/branch.service';

interface ActivityItem {
  title: string;
  time: string;
}

@Component({
  selector: 'app-branch-dashboard',
  standalone: true,
  templateUrl: './branch-dash.component.html',
  styleUrls: ['./branch-dash.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    StatCardComponent,
    DataTableComponent,
    CellDirective,
  ],
})
export class BranchDashboardComponent implements OnInit {
  branches: CooperativeBranch[] = [];
  activities: ActivityItem[] = [];

  searchQuery = '';
  selectedStatus: '' | 'ACTIVE' | 'PENDING' = '';

  cols: TableColumn[] = [
    { key: 'name',     header: 'Branch Name', class: 'fw-600' },
    { key: 'location', header: 'Location',    class: 'text-muted' },
    { key: 'farmers',  header: 'Farmers' },
    { key: 'centres',  header: 'Centres' },
    { key: 'status',   header: 'Status' },
    { key: 'actions',  header: 'Action', width: '60px' },
  ];

  currentPage = 1;
  itemsPerPage = 5;
  activeMenuId: number | null = null;

  private toast = inject(ToastService);
  private branchService = inject(BranchService);

  // Exposed to template for the stat card
  get assignedAgents(): number { return this.branchService.assignedAgentsCount; }

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.branchService.listCooperativeBranches().subscribe(branches => {
      this.branches = branches;
    });

    this.branchService.getActivities().subscribe(activities => {
      this.activities = activities;
    });

    this.applyNavigationState();
  }

  private applyNavigationState(): void {
    const state = history.state as { newBranch?: { name: string; location: string; branchCode: string; country: string; managerName: string } };
    if (!state?.newBranch) return;

    const nb = state.newBranch;
    // Push through the service so branches$ stays the single source of truth
    this.branchService.addCooperativeBranch({
      name: nb.name, location: nb.location,
      farmers: 0, centres: 0, status: 'PENDING', branchCode: '',
    });
    // Subscribe once more to pick up the newly added branch
    this.branchService.branches$.subscribe(branches => {
      this.branches = branches;
    });

    this.toast.success('Branch registered', `${nb.name} has been added and is pending activation.`);
    history.replaceState({}, '');
  }

  // ── Filtering ─────────────────────────────────────────────────────────────

  get filteredBranches(): CooperativeBranch[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.branches.filter(b => {
      const matchSearch = !q ||
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q);
      const matchStatus = !this.selectedStatus || b.status === this.selectedStatus;
      return matchSearch && matchStatus;
    });
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.closeMenu();
  }

  // ── Stat card computed values ─────────────────────────────────────────────

  get totalActiveBranches(): number { return this.branches.filter(b => b.status === 'ACTIVE').length; }
  get totalCentres(): number        { return this.branches.reduce((s, b) => s + b.centres, 0); }
  get totalFarmers(): number        { return this.branches.reduce((s, b) => s + b.farmers, 0); }
  get totalBranches(): number       { return this.filteredBranches.length; }

  // ── Pagination ────────────────────────────────────────────────────────────

  get paginatedBranches(): CooperativeBranch[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredBranches.slice(start, start + this.itemsPerPage);
  }

  get pagesArray(): number[] {
    return Array.from({ length: Math.ceil(this.totalBranches / this.itemsPerPage) }, (_, i) => i + 1);
  }

  prevPage(): void { if (this.currentPage > 1) { this.currentPage--; this.closeMenu(); } }
  nextPage(): void { if (this.currentPage * this.itemsPerPage < this.totalBranches) { this.currentPage++; this.closeMenu(); } }
  goToPage(page: number): void { if (page !== this.currentPage) { this.currentPage = page; this.closeMenu(); } }

  // ── Kebab menu ────────────────────────────────────────────────────────────

  toggleMenu(branchId: number, event: Event): void {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === branchId ? null : branchId;
  }

  closeMenu(): void { this.activeMenuId = null; }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.kebab-container')) this.activeMenuId = null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  RegisterBranch(): void {
    this.router.navigate(['/cooperative/branches/onboarding']);
  }

  onViewBranch(branch: CooperativeBranch, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenu();
    this.router.navigate(['/cooperative/branches', branch.id, 'detail']);
  }

  onEditBranch(branch: CooperativeBranch, event?: Event): void {
    if (event) event.stopPropagation();
    this.toast.info('Coming soon', `Edit form for "${branch.name}" will be available shortly.`);
    this.closeMenu();
  }

  openMapView(): void {
    this.toast.info('Coming soon', 'Interactive map view is being built and will be available soon.');
  }
}
