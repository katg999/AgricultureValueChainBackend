import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, tap } from 'rxjs';
import { BranchDelivery, DeliverySession, DeliveryStatus, Season } from '../../../branch/collections/branch.delivery.model';
import { BranchDeliveryService } from '../../../branch/collections/branch.delivery.service';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';

@Component({
  selector: 'app-cooperative-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery.cooperative.list.component.html',
  styleUrls: ['./delivery.cooperative.list.component.css'],
})
export class CooperativeDeliveriesComponent implements OnInit {
  branchDeliveries$!: Observable<BranchDelivery[]>;
  filteredDeliveries$!: Observable<BranchDelivery[]>;
  paginatedDeliveries$!: Observable<BranchDelivery[]>;

  searchTerm = '';
  selectedSeason = '';

  // Tracks which row's kebab menu is currently open.
  openActionMenuId: string | null = null;

  currentPage = 1;
  readonly itemsPerPage = 10;
  totalCount = 0;

  get startIndex(): number { return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endIndex(): number { return Math.min(this.currentPage * this.itemsPerPage, this.totalCount); }
  get pagesArray(): number[] {
    return Array.from({ length: Math.ceil(this.totalCount / this.itemsPerPage) }, (_, i) => i + 1);
  }

  private readonly filterState$ = new BehaviorSubject({
    searchTerm: '',
    selectedSeason: '',
  });
  private readonly pageState$ = new BehaviorSubject<number>(1);

  constructor(
    private svc: BranchDeliveryService,
    private router: Router,
    private sessionConfig: DeliverySessionConfigService,
  ) {}

  ngOnInit(): void {
    // Cooperative sees ALL branch deliveries (not filtered by branchId).
    this.branchDeliveries$ = this.svc.getDeliveries().pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    // Step 1 — apply search + season filter.
    this.filteredDeliveries$ = combineLatest([this.branchDeliveries$, this.filterState$]).pipe(
      map(([deliveries, filter]) => this.filterDeliveries(deliveries, filter)),
    );

    // Step 2 — paginate the already-filtered list.
    // tap() captures the total count for the footer before the slice happens.
    this.paginatedDeliveries$ = combineLatest([this.filteredDeliveries$, this.pageState$]).pipe(
      tap(([deliveries]) => { this.totalCount = deliveries.length; }),
      map(([deliveries, page]) =>
        deliveries.slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage),
      ),
    );
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.pageState$.next(1);
    this.filterState$.next({
      searchTerm: this.searchTerm,
      selectedSeason: this.selectedSeason,
    });
  }

  setSeasonFilter(season: string): void {
    this.selectedSeason = season;
    this.applyFilter();
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

  @HostListener('document:click')
  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  toggleActionMenu(delivery: BranchDelivery, event: MouseEvent): void {
    event.stopPropagation();
    this.openActionMenuId = this.openActionMenuId === delivery.id ? null : delivery.id;
  }

  // Navigate to the cooperative-scoped farmer list for this batch.
  // from=cooperative tells FarmerDeliveriesListComponent to back-link to here, not the branch view.
  viewFarmers(delivery: BranchDelivery): void {
    this.openActionMenuId = null;
    this.router.navigate(
      ['/cooperative/collections/farmers'],
      { queryParams: { batch: delivery.id, from: 'cooperative' } },
    );
  }

  trackByDeliveryId(_index: number, delivery: BranchDelivery): string {
    return delivery.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  totalValue(deliveries: BranchDelivery[]): number {
    return deliveries.reduce((s, d) => s + d.estimatedValue, 0);
  }
  totalFarmers(deliveries: BranchDelivery[]): number {
    return deliveries.reduce((s, d) => s + d.farmerCount, 0);
  }
  totalVolume(deliveries: BranchDelivery[]): number {
    return deliveries.reduce((s, d) => s + d.volume, 0);
  }
  approvedCount(deliveries: BranchDelivery[]): number {
    return deliveries.filter(d => d.status === 'Approved').length;
  }

  formatUGX(v: number): string {
    return new Intl.NumberFormat('en-UG').format(v);
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

      const matchSeason = !filter.selectedSeason || d.season === filter.selectedSeason;

      return matchSearch && matchSeason;
    });
  }
}
