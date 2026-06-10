import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
=======
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
>>>>>>> 9dee8b400e3f8ea25a26ca7d0d86f8ac2a364f3e
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, Subject, takeUntil, tap } from 'rxjs';

import { InputComponent } from '../../../../shared/components/input/input.component';
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';
import { FarmerListItem, FarmerService } from '../../../shared-farmer-domain/farmer.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-farmer-list',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, FormsModule, InputComponent],
=======
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, StatsCardComponent],
>>>>>>> 9dee8b400e3f8ea25a26ca7d0d86f8ac2a364f3e
  templateUrl: './farmer-list.component.html',
  styleUrl: './farmer-list.component.css',
})
export class FarmerListComponent implements OnInit, OnDestroy {
  searchQuery = '';
  selectedBranch = 'All Branches';
  selectedStatus = 'All Statuses';
  selectedCommodity = 'All Commodities';
  selectedStage = 'All Stages';
  openMenuId: string | null = null;

  readonly statuses = ['All Statuses', 'Active', 'Pending', 'Rejected', 'Suspended'];
  readonly stages = ['All Stages', 'Registered', 'Verified', 'Financed'];
  readonly collectionProgress = 78;

  // ── Pagination ───────────────────────────────────────────────────────────
  currentPage = 1;
  readonly itemsPerPage = 10;
  totalCount = 0;

  get startIndex(): number { return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endIndex(): number { return Math.min(this.currentPage * this.itemsPerPage, this.totalCount); }
  get pagesArray(): number[] {
    return Array.from({ length: Math.ceil(this.totalCount / this.itemsPerPage) }, (_, i) => i + 1);
  }

  farmers$!: Observable<FarmerListItem[]>;
  filteredFarmers$!: Observable<FarmerListItem[]>;
  paginatedFarmers$!: Observable<FarmerListItem[]>;
  loading = false;
  error: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly filterState$ = new BehaviorSubject({
    searchQuery: '',
    selectedBranch: 'All Branches',
    selectedStatus: 'All Statuses',
    selectedCommodity: 'All Commodities',
    selectedStage: 'All Stages',
  });
  private readonly pageState$ = new BehaviorSubject<number>(1);

  private toast = inject(ToastService);

  constructor(
    private router: Router,
    private farmerService: FarmerService,
  ) {}

  ngOnInit(): void {
    this.farmers$ = this.farmerService.watchForCooperative();

    this.filteredFarmers$ = combineLatest([this.farmers$, this.filterState$]).pipe(
      map(([farmers, filter]) => this.filterFarmers(farmers, filter)),
    );

    // Track total for pagination info, then slice for the current page
    this.paginatedFarmers$ = combineLatest([this.filteredFarmers$, this.pageState$]).pipe(
      tap(([farmers]) => { this.totalCount = farmers.length; }),
      map(([farmers, page]) =>
        farmers.slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage),
      ),
    );

    this.refresh();
  }

  ngOnDestroy(): void {
    this.filterState$.complete();
    this.pageState$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.pageState$.next(1);
    this.filterState$.next({
      searchQuery: this.searchQuery,
      selectedBranch: this.selectedBranch,
      selectedStatus: this.selectedStatus,
      selectedCommodity: this.selectedCommodity,
      selectedStage: this.selectedStage,
    });
  }

  // ── Pagination methods ────────────────────────────────────────────────────
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageState$.next(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.endIndex < this.totalCount) {
      this.currentPage++;
      this.pageState$.next(this.currentPage);
    }
  }

  goToPage(page: number): void {
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.pageState$.next(page);
    }
  }

  refresh(): void {
    this.loading = true;
    this.error = null;

    this.farmerService.listForCooperative()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.loading = false; },
        error: err => {
          this.error = err?.error?.message ?? err.message;
          this.loading = false;
        },
      });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuId = null;
  }

  toggleMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeMenu(): void {
    this.openMenuId = null;
  }

  onApproveFarmer(farmer: FarmerListItem): void {
<<<<<<< HEAD
    this.closeMenu();
    if (!confirm(`Are you sure you want to approve ${farmer.name}?`)) return;
=======
    if (!confirm(`Approve ${farmer.name}? They will be granted active farmer status.`)) return;
>>>>>>> 9dee8b400e3f8ea25a26ca7d0d86f8ac2a364f3e

    this.farmerService.approve(farmer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.toast.success('Farmer approved', `${farmer.name} is now an active farmer.`),
        error: err => this.toast.error('Approval failed', err?.error?.message ?? 'Could not approve this farmer. Please try again.'),
      });
  }

  onRejectFarmer(farmer: FarmerListItem): void {
    this.closeMenu();
    if (!confirm(`Are you sure you want to reject ${farmer.name}?`)) return;

    this.farmerService.reject(farmer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => undefined,
        error: err => alert(err?.error?.message ?? 'Reject failed.'),
      });
  }

  onReviewFarmer(farmer: FarmerListItem): void {
    this.closeMenu();
    this.router.navigate(['/cooperative/farmers/approval', farmer.id]);
  }

  branches(farmers: FarmerListItem[]): string[] {
    return ['All Branches', ...new Set(farmers.map(f => f.branch))];
  }

  commodities(farmers: FarmerListItem[]): string[] {
    return ['All Commodities', ...new Set(farmers.map(f => f.primaryCommodity))];
  }

  newRegistrations(farmers: FarmerListItem[]): number {
    return farmers.filter(f => f.status === 'Pending').length;
  }

  portfolioAtRisk(farmers: FarmerListItem[]): string {
    const total = farmers.reduce((sum, f) => {
      const n = Number(f.balance.replace(/,/g, ''));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    return `${(total / 1_000_000).toFixed(1)}M`;
  }

  trackByFarmerId(_index: number, farmer: FarmerListItem): string {
    return farmer.id;
  }

  trackByOption(_index: number, option: string): string {
    return option;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private filterFarmers(
    farmers: FarmerListItem[],
    filter: {
      searchQuery: string;
      selectedBranch: string;
      selectedStatus: string;
      selectedCommodity: string;
      selectedStage: string;
    },
  ): FarmerListItem[] {
    const q = filter.searchQuery.trim().toLowerCase();

    return farmers.filter(farmer => {
      const matchSearch =
        !q ||
        farmer.id.toLowerCase().includes(q) ||
        farmer.name.toLowerCase().includes(q) ||
        farmer.branch.toLowerCase().includes(q) ||
        farmer.primaryCommodity.toLowerCase().includes(q);
      const matchBranch = filter.selectedBranch === 'All Branches' || farmer.branch === filter.selectedBranch;
      const matchStatus = filter.selectedStatus === 'All Statuses' || farmer.status === filter.selectedStatus;
      const matchCommodity = filter.selectedCommodity === 'All Commodities' || farmer.primaryCommodity === filter.selectedCommodity;
      const matchStage = filter.selectedStage === 'All Stages' || farmer.stage === filter.selectedStage;

      return matchSearch && matchBranch && matchStatus && matchCommodity && matchStage;
    });
  }
}
