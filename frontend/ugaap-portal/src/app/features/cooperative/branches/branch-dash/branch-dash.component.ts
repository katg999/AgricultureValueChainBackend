import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule} from '@angular/router';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { ToastService }      from '../../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';

// Branch model (must include id for pagination and menu)
interface Branch {
  id: number;
  name: string;
  location: string;
  farmers: number;
  centres: number;
  status: 'ACTIVE' | 'PENDING';
  branchCode: string; // links to FarmerListItem.branchId in the detail view
}

// Activity item for recent activity table
interface ActivityItem {
  title: string;
  time: string;
}

@Component({
  selector: 'app-branch-dashboard',
  standalone: true,
  templateUrl: './branch-dash.component.html',   // points to the new HTML file
  styleUrls: ['./branch-dash.component.css'],    // points to the new CSS file
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
  // ---------- Data ----------
  branches: Branch[] = [];
  activities: ActivityItem[] = [];

  // ---------- Filter state ----------
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

  // ---------- Pagination state ----------
  currentPage = 1;
  itemsPerPage = 5;
  activeMenuId: number | null = null;

  // Static value for "Assigned Users"
  assignedAgents = 142;

  private toast = inject(ToastService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadBranchData();
    this.loadRecentActivities();
    this.applyNavigationState();
  }

  private applyNavigationState(): void {
    const state = history.state as { newBranch?: { name: string; location: string; branchCode: string; country: string; managerName: string } };
    if (!state?.newBranch) return;

    const nb = state.newBranch;
    this.branches = [
      { id: Date.now(), name: nb.name, location: nb.location, farmers: 0, centres: 0, status: 'PENDING', branchCode: '' },
      ...this.branches,
    ];

    this.toast.success('Branch registered', `${nb.name} has been added and is pending activation.`);

    // Clear the state so a page refresh doesn't re-add the branch
    history.replaceState({}, '');
  }

  // ---------- Filter logic ----------
  get filteredBranches(): Branch[] {
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

  // ---------- Computed Properties for Stats Cards ----------
  get totalActiveBranches(): number {
    return this.branches.filter(b => b.status === 'ACTIVE').length;
  }

  get totalCentres(): number {
    return this.branches.reduce((sum, b) => sum + b.centres, 0);
  }

  get totalFarmers(): number {
    return this.branches.reduce((sum, b) => sum + b.farmers, 0);
  }

  get totalBranches(): number {
    return this.filteredBranches.length;
  }

  // ---------- Pagination Helpers ----------
  get paginatedBranches(): Branch[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredBranches.slice(start, start + this.itemsPerPage);
  }

  get pagesArray(): number[] {
    return Array.from({ length: Math.ceil(this.totalBranches / this.itemsPerPage) }, (_, i) => i + 1);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.closeMenu();
    }
  }

  nextPage(): void {
    if (this.currentPage * this.itemsPerPage < this.totalBranches) {
      this.currentPage++;
      this.closeMenu();
    }
  }

  goToPage(page: number): void {
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.closeMenu();
    }
  }

  // ---------- Kebab Menu Logic ----------
  toggleMenu(branchId: number, event: Event): void {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === branchId ? null : branchId;
  }

  closeMenu(): void {
    this.activeMenuId = null;
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.kebab-container')) {
      this.activeMenuId = null;
    }
  }

  // ---------- Action Handlers (called from template) ----------


  RegisterBranch(): void {
    this.router.navigate(['/cooperative/branches/onboarding']);

    


  }

  onViewBranch(branch: Branch, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenu();
    this.router.navigate(['/cooperative/branches', branch.id, 'detail']);
  }

  onEditBranch(branch: Branch, event?: Event): void {
    if (event) event.stopPropagation();
    this.toast.info('Coming soon', `Edit form for "${branch.name}" will be available shortly.`);
    this.closeMenu();
  }

  openMapView(): void {
    this.toast.info('Coming soon', 'Interactive map view is being built and will be available soon.');
  }

  // ---------- Data Loaders (preserved and enhanced with ids) ----------
  private loadBranchData(): void {
    this.branches = [
      { id: 1,  name: 'Kampala Central Hub',    location: 'Kampala, Central Region', farmers: 1240, centres: 5, status: 'ACTIVE',  branchCode: 'BR-KLA' },
      { id: 2,  name: 'Gulu Northern Branch',   location: 'Gulu, Northern Uganda',   farmers: 876,  centres: 3, status: 'ACTIVE',  branchCode: 'BR-GUL' },
      { id: 3,  name: 'Mbarara Dairy Centre',   location: 'Mbarara, Western',        farmers: 2034, centres: 6, status: 'ACTIVE',  branchCode: 'BR-MBA' },
      { id: 4,  name: 'Jinja East Office',      location: 'Jinja, Eastern',          farmers: 567,  centres: 2, status: 'PENDING', branchCode: 'BR-JIN' },
      { id: 5,  name: 'Fort Portal Collection', location: 'Fort Portal, West',       farmers: 342,  centres: 1, status: 'ACTIVE',  branchCode: 'BR-FPT' },
      { id: 6,  name: 'Mbale Highlands Branch', location: 'Mbale, Eastern',          farmers: 985,  centres: 4, status: 'ACTIVE',  branchCode: 'BR-MBL' },
      { id: 7,  name: 'Soroti Regional',        location: 'Soroti, Teso',            farmers: 428,  centres: 2, status: 'PENDING', branchCode: 'BR-SOR' },
      { id: 8,  name: 'Arua West Nile',         location: 'Arua, West Nile',         farmers: 763,  centres: 3, status: 'ACTIVE',  branchCode: 'BR-ARU' },
      { id: 9,  name: 'Masaka Green',           location: 'Masaka, Central',         farmers: 592,  centres: 2, status: 'ACTIVE',  branchCode: 'BR-MSK' },
      { id: 10, name: 'Lira Cooperative',       location: 'Lira, Lango',             farmers: 311,  centres: 1, status: 'ACTIVE',  branchCode: 'BR-LIR' },
    ];
  }

  private loadRecentActivities(): void {
    this.activities = [
      { title: 'New branch registered in Gulu', time: '2 hours ago' },
      { title: 'Collection centre added in Mbarara', time: 'Yesterday' },
      { title: 'Farmer enrollment increased by 12% in Kampala', time: '3 days ago' },
      { title: 'Field agent assignment updated for Jinja', time: '5 days ago' },
      { title: 'Weekly collection report generated', time: '1 week ago' },
    ];
  }
}