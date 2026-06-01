import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule} from '@angular/router';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';

// Branch model (must include id for pagination and menu)
interface Branch {
  id: number;
  name: string;
  location: string;
  farmers: number;
  centres: number;
  status: 'ACTIVE' | 'PENDING';
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
    RouterModule,
    ButtonComponent,
    AlertComponent,
    SpinnerComponent,
    StatsCardComponent
  ],
})
export class BranchDashboardComponent implements OnInit {
  // ---------- Data ----------
  branches: Branch[] = [];
  activities: ActivityItem[] = [];

  // ---------- Pagination state ----------
  currentPage = 1;
  itemsPerPage = 5;
  activeMenuId: number | null = null;   // stores branch id for open kebab menu

  // Static value for "Assigned Users" 
  assignedAgents = 142;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadBranchData();
    this.loadRecentActivities();
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
    return this.branches.length;
  }

  // ---------- Pagination Helpers ----------
  get paginatedBranches(): Branch[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.branches.slice(start, start + this.itemsPerPage);
  }

  get pagesArray(): number[] {
    const totalPages = Math.ceil(this.totalBranches / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
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
    console.log('View branch', branch);
    alert(`View branch: ${branch.name}\nLocation: ${branch.location}\nFarmers: ${branch.farmers}\nCentres: ${branch.centres}`);
    this.closeMenu();
  }

  onEditBranch(branch: Branch, event?: Event): void {
    if (event) event.stopPropagation();
    console.log('Edit branch', branch);
    alert(`Edit branch: ${branch.name} - open edit form`);
    this.closeMenu();
  }

  openMapView(): void {
    console.log('Open map view');
    alert('Interactive map — visualize collection centres distribution');
  }

  // ---------- Data Loaders (preserved and enhanced with ids) ----------
  private loadBranchData(): void {
    this.branches = [
      { id: 1, name: 'Kampala Central Hub', location: 'Kampala, Central Region', farmers: 1240, centres: 5, status: 'ACTIVE' },
      { id: 2, name: 'Gulu Northern Branch', location: 'Gulu, Northern Uganda', farmers: 876, centres: 3, status: 'ACTIVE' },
      { id: 3, name: 'Mbarara Dairy Centre', location: 'Mbarara, Western', farmers: 2034, centres: 6, status: 'ACTIVE' },
      { id: 4, name: 'Jinja East Office', location: 'Jinja, Eastern', farmers: 567, centres: 2, status: 'PENDING' },
      { id: 5, name: 'Fort Portal Collection', location: 'Fort Portal, West', farmers: 342, centres: 1, status: 'ACTIVE' },
      { id: 6, name: 'Mbale Highlands Branch', location: 'Mbale, Eastern', farmers: 985, centres: 4, status: 'ACTIVE' },
      { id: 7, name: 'Soroti Regional', location: 'Soroti, Teso', farmers: 428, centres: 2, status: 'PENDING' },
      { id: 8, name: 'Arua West Nile', location: 'Arua, West Nile', farmers: 763, centres: 3, status: 'ACTIVE' },
      { id: 9, name: 'Masaka Green', location: 'Masaka, Central', farmers: 592, centres: 2, status: 'ACTIVE' },
      { id: 10, name: 'Lira Cooperative', location: 'Lira, Lango', farmers: 311, centres: 1, status: 'ACTIVE' },
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