import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, Subject, takeUntil } from 'rxjs';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { FarmerListItem, FarmerService } from '../../../shared-farmer-domain/farmer.service';

@Component({
  selector: 'app-branch.farmer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, StatCardComponent, EmptyStateComponent],
  templateUrl: './branch.farmer-list.component.html',
  styleUrl: './branch.farmer-list.component.css',
})
export class BranchFarmerListComponent implements OnInit, OnDestroy {
  searchQuery = '';
  openKebabId: string | null = null;

  readonly collectionProgress = 78;

  farmers$!: Observable<FarmerListItem[]>;
  filteredFarmers$!: Observable<FarmerListItem[]>;
  loading = false;
  error: string | null = null;

  private readonly destroy$ = new Subject<void>();
  private readonly filterState$ = new BehaviorSubject({ searchQuery: '' });

  constructor(
    private router: Router,
    private farmerService: FarmerService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.farmers$ = this.farmerService.watchForBranch();

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
    this.filterState$.next({ searchQuery: this.searchQuery });
  }

  refresh(): void {
    this.loading = true;
    this.error = null;

    // HTTP hydration updates FarmerService.farmers$; the template remains async-pipe driven.
    this.farmerService
      .listForBranch()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message ?? err.message;
          this.loading = false;
        },
      });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openKebabId = null;
  }

  onAddFarmer(): void {
    this.router.navigate(['./register'], { relativeTo: this.route }).then((success) => {
      console.log('Navigation result:', success);
      console.log('Current URL after nav:', this.router.url);
    });
  }

  toggleKebab(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openKebabId = this.openKebabId === id ? null : id;
  }

  onEditFarmer(farmer: FarmerListItem): void {
    this.router.navigate(['/branch/farmers/register', farmer.id]);
  }

  onViewProfile(farmer: FarmerListItem): void {
    this.router.navigate(['/branch/farmers/profile', farmer.id]);
  }

  onViewAllocations(farmer: FarmerListItem): void {
    this.router.navigate(['/branch/inventory/stock-disbursed'], {
      queryParams: { farmer: farmer.name },
    });
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

  private filterFarmers(
    farmers: FarmerListItem[],
    filter: { searchQuery: string },
  ): FarmerListItem[] {
    const q = filter.searchQuery.trim().toLowerCase();
    if (!q) return farmers;

    return farmers.filter((farmer) =>
      farmer.id.toLowerCase().includes(q) ||
      farmer.name.toLowerCase().includes(q) ||
      farmer.branch.toLowerCase().includes(q) ||
      farmer.primaryCommodity.toLowerCase().includes(q) ||
      farmer.status.toLowerCase().includes(q) ||
      farmer.stage.toLowerCase().includes(q),
    );
  }
}
