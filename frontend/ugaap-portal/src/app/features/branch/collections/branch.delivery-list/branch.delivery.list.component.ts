import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, tap } from 'rxjs';

import { BranchDelivery, DeliveryStatus, DeliverySession, Season } from '../branch.delivery.model';
import { BranchDeliveryService } from '../branch.delivery.service';
import { SessionService } from '../../../../core/services/session.service';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';

@Component({
  selector: 'app-branch-deliveries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './branch.delivery.list.component.html',
  styleUrls: ['./branch.delivery.list.component.css'],
})
export class BranchDeliveriesComponent implements OnInit, OnDestroy {
  deliveries$!: Observable<BranchDelivery[]>;
  filteredDeliveries$!: Observable<BranchDelivery[]>;
  paginatedDeliveries$!: Observable<BranchDelivery[]>;

  searchTerm = '';
  selectedSeason = '';

  currentPage = 1;
  readonly itemsPerPage = 10;
  totalCount = 0;

  get startIndex(): number { return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endIndex(): number { return Math.min(this.currentPage * this.itemsPerPage, this.totalCount); }
  get pagesArray(): number[] {
    return Array.from({ length: Math.ceil(this.totalCount / this.itemsPerPage) }, (_, i) => i + 1);
  }

  openActionMenuId: string | null = null;
  menuPosition: { top?: number; bottom?: number; right: number } = { right: 0 };

  private readonly filterState$ = new BehaviorSubject({
    searchTerm: '',
    selectedSeason: '',
  });
  private readonly pageState$ = new BehaviorSubject<number>(1);

  constructor(
    private svc: BranchDeliveryService,
    private router: Router,
    private session: SessionService,
    private sessionConfig: DeliverySessionConfigService,
  ) {}

  ngOnInit(): void {
    // getDeliveries() hydrates the BehaviorSubject; getDeliveriesForBranch pipes from it.
    this.svc.getDeliveries().subscribe();

    // shareReplay so combineLatest below doesn't re-trigger the HTTP call on each filter change.
    this.deliveries$ = this.svc
      .getDeliveriesForBranch(this.session.branchId(), this.currentBranchName)
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));

    this.filteredDeliveries$ = combineLatest([this.deliveries$, this.filterState$]).pipe(
      map(([deliveries, filter]) => this.filterDeliveries(deliveries, filter)),
    );

    // Paginate the already-filtered list. tap() captures the total count for
    // the pagination footer before the slice happens.
    this.paginatedDeliveries$ = combineLatest([this.filteredDeliveries$, this.pageState$]).pipe(
      tap(([deliveries]) => { this.totalCount = deliveries.length; }),
      map(([deliveries, page]) =>
        deliveries.slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage),
      ),
    );
  }

  ngOnDestroy(): void {
    this.filterState$.complete();
    this.pageState$.complete();
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.pageState$.next(1);
    this.filterState$.next({
      searchTerm: this.searchTerm,
      selectedSeason: this.selectedSeason,
    });
  }

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

  setSeasonFilter(season: string): void {
    this.selectedSeason = season;
    this.applyFilter();
  }

  addFarmerDelivery(): void {
    this.router.navigate(['/branch/collections/deliveries/add']);
  }

  // Routes to the farmers list, scoped to just this delivery batch's farmers.
  viewDelivery(delivery: BranchDelivery): void {
    this.openActionMenuId = null;
    this.router.navigate(['/branch/collections/farmers'], {
      queryParams: { batch: delivery.id },
    });
  }

  editDelivery(delivery: BranchDelivery): void {
    this.openActionMenuId = null;
    this.router.navigate(['/branch/collections/deliveries/edit', delivery.id]);
  }

  toggleActionMenu(deliveryId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.openActionMenuId === deliveryId) {
      this.openActionMenuId = null;
      return;
    }
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const dropdownHeight = 130;
    const right = window.innerWidth - rect.right;
    if (window.innerHeight - rect.bottom < dropdownHeight) {
      this.menuPosition = { bottom: window.innerHeight - rect.top + 4, right };
    } else {
      this.menuPosition = { top: rect.bottom + 4, right };
    }
    this.openActionMenuId = deliveryId;
  }

  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  goToFarmersList(): void {
    this.router.navigate(['/branch/collections/farmers']);
  }

  trackByDeliveryId(_index: number, delivery: BranchDelivery): string {
    return delivery.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  formatUGX(value: number): string {
    return new Intl.NumberFormat('en-UG').format(value);
  }

  statusClass(status: DeliveryStatus): string {
    const map: Record<DeliveryStatus, string> = {
      Pending: 'status-pending',
      Approved: 'status-approved',
      Rejected: 'status-rejected',
    };
    return map[status];
  }

  seasonClass(season: Season): string {
    return season === 'Wet Season' ? 'season-wet' : 'season-dry';
  }

  sessionLabel(id: DeliverySession | undefined): string {
    return this.sessionConfig.getLabel(id);
  }

  statusIcon(status: DeliveryStatus): string {
    const map: Record<DeliveryStatus, string> = {
      Pending:  'ti-clock',
      Approved: 'ti-circle-check',
      Rejected: 'ti-x',
    };
    return map[status];
  }

  totalVolume(deliveries: BranchDelivery[]): number {
    return deliveries.reduce((s, d) => s + d.volume, 0);
  }

  totalValue(deliveries: BranchDelivery[]): number {
    return deliveries.reduce((s, d) => s + d.estimatedValue, 0);
  }

  totalFarmers(deliveries: BranchDelivery[]): number {
    return deliveries.reduce((s, d) => s + d.farmerCount, 0);
  }

  approvedCount(deliveries: BranchDelivery[]): number {
    return deliveries.filter(d => d.status === 'Approved').length;
  }

  totalBranches(deliveries: BranchDelivery[]): number {
    return new Set(deliveries.map(d => d.branchId ?? d.branchName)).size;
  }

  private get currentBranchName(): string {
    const user = this.session.currentUser() as { branchName?: string } | null;
    return user?.branchName ?? this.session.branchId() ?? '';
  }

  private filterDeliveries(
    deliveries: BranchDelivery[],
    filter: { searchTerm: string; selectedSeason: string },
  ): BranchDelivery[] {
    const term = filter.searchTerm.trim().toLowerCase();

    return deliveries.filter(d => {
      const matchSearch =
        !term ||
        d.branchName.toLowerCase().includes(term) ||
        d.id.toLowerCase().includes(term) ||
        d.commodity.toLowerCase().includes(term) ||
        d.status.toLowerCase().includes(term) ||
        d.season.toLowerCase().includes(term) ||
        (d.session ? this.sessionLabel(d.session).toLowerCase().includes(term) : false);

      const matchSeason =
        !filter.selectedSeason || d.season === filter.selectedSeason;

      return matchSearch && matchSeason;
    });
  }
}
