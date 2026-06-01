import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, Subject, takeUntil } from 'rxjs';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { FarmerListItem, FarmerService } from '../../../shared-farmer-domain/farmer.service';

@Component({
  selector: 'app-farmer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './farmer-list.component.html',
  styleUrl: './farmer-list.component.css',
})
export class FarmerListComponent implements OnInit, OnDestroy {
  searchQuery = '';
  selectedBranch = 'All Branches';
  selectedStatus = 'Pending';
  selectedCommodity = 'All Commodities';
  selectedStage = 'All Stages';

  readonly statuses = ['All Statuses', 'Active', 'Pending', 'Rejected', 'Suspended'];
  readonly stages = ['All Stages', 'Registered', 'Verified', 'Financed'];
  readonly collectionProgress = 78;

  farmers$!: Observable<FarmerListItem[]>;
  filteredFarmers$!: Observable<FarmerListItem[]>;
  loading = false;
  error: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly filterState$ = new BehaviorSubject({
    searchQuery: '',
    selectedBranch: 'All Branches',
    selectedStatus: 'Pending',
    selectedCommodity: 'All Commodities',
    selectedStage: 'All Stages',
  });

  constructor(
    private router: Router,
    private farmerService: FarmerService,
  ) {}

  ngOnInit(): void {
    this.farmers$ = this.farmerService.watchForCooperative();

    // The table is derived from the shared stream, so approvals update without a manual reload.
    this.filteredFarmers$ = combineLatest([this.farmers$, this.filterState$]).pipe(
      map(([farmers, filter]) => this.filterFarmers(farmers, filter)),
    );

    this.refresh();
  }

  ngOnDestroy(): void {
    this.filterState$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(): void {
    this.filterState$.next({
      searchQuery: this.searchQuery,
      selectedBranch: this.selectedBranch,
      selectedStatus: this.selectedStatus,
      selectedCommodity: this.selectedCommodity,
      selectedStage: this.selectedStage,
    });
  }

  refresh(): void {
    this.loading = true;
    this.error = null;

    // Fetch once to hydrate the store; rendering stays subscribed to FarmerService.farmers$.
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

  onApproveFarmer(farmer: FarmerListItem): void {
    if (!confirm(`Are you sure you want to approve ${farmer.name}?`)) return;

    this.farmerService.approve(farmer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => undefined,
        error: err => alert(err?.error?.message ?? 'Approve failed.'),
      });
  }

  onReviewFarmer(farmer: FarmerListItem): void {
    this.router.navigate(['/cooperative/farmers/approval', farmer.id]);
  }

  branches(farmers: FarmerListItem[]): string[] {
    return ['All Branches', ...new Set(farmers.map(farmer => farmer.branch))];
  }

  commodities(farmers: FarmerListItem[]): string[] {
    return ['All Commodities', ...new Set(farmers.map(farmer => farmer.primaryCommodity))];
  }

  newRegistrations(farmers: FarmerListItem[]): string {
    return String(farmers.filter(farmer => farmer.status === 'Pending').length);
  }

  portfolioAtRisk(farmers: FarmerListItem[]): string {
    const total = farmers.reduce((sum, farmer) => {
      const n = Number(farmer.balance.replace(/,/g, ''));
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
