import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, tap } from 'rxjs';

import { BranchDelivery, BranchDeliveryFormData, DeliveryStatus, DeliverySession, Season } from '../branch.delivery.model';
import { BranchDeliveryService } from '../branch.delivery.service';
import { SessionService } from '../../../../core/services/session.service';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';
// import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-branch-deliveries',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    //StatCardComponent
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

  // When editing, the existing session (even if its window has passed) stays selectable.
  // When creating new, only sessions that haven't ended yet today are offered.
  get availableSessionOptions(): DeliverySession[] {
    if (this.editingDeliveryId) return this.sessionOptions;
    return this.sessionOptions.filter(s => !this.sessionConfig.isSessionPassed(s));
  }

  statusOptions: DeliveryStatus[] = [];
  commodityOptions: string[] = [];
  seasonOptions: Season[] = [];
  sessionOptions: DeliverySession[] = [];
  volumeUnitOptions: string[] = [];
  openActionMenuId: string | null = null;
  menuPosition: { top?: number; bottom?: number; right: number } = { right: 0 };
  showAddDeliveryModal = false;
  addDeliveryForm!: BranchDeliveryFormData;
  // Set while the Add/Edit modal is editing an existing row — null means "creating new".
  editingDeliveryId: string | null = null;

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
    this.statusOptions = this.svc.getStatusOptions();
    this.commodityOptions = this.svc.getCommodityOptions();
    this.seasonOptions = this.svc.getSeasonOptions();
    this.sessionOptions = this.svc.getSessionOptions();
    this.volumeUnitOptions = this.svc.getVolumeUnitOptions();
    this.addDeliveryForm = this.createAddDeliveryForm();

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

  // Routes to the farmers list, scoped to just this delivery batch's farmers.
  viewDelivery(delivery: BranchDelivery): void {
    this.openActionMenuId = null;
    this.router.navigate(['/branch/collections/farmers'], {
      queryParams: { batch: delivery.id },
    });
  }

  editDelivery(delivery: BranchDelivery): void {
    this.openActionMenuId = null;
    this.editingDeliveryId = delivery.id;
    this.addDeliveryForm = {
      branchId: delivery.branchId,
      branchName: delivery.branchName,
      farmerCount: delivery.farmerCount,
      farmerName: delivery.farmerName ?? '',
      commodity: delivery.commodity,
      volume: delivery.volume,
      volumeUnit: delivery.volumeUnit ?? this.volumeUnitOptions[0] ?? 'KG',
      estimatedValue: delivery.estimatedValue,
      status: delivery.status,
      season: delivery.season,
      session: delivery.session ?? this.sessionOptions[0],
    };
    this.showAddDeliveryModal = true;
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

  openAddDeliveryModal(): void {
    this.openActionMenuId = null;
    this.editingDeliveryId = null;
    this.addDeliveryForm = this.createAddDeliveryForm();
    this.showAddDeliveryModal = true;
  }

  closeAddDeliveryModal(): void {
    this.showAddDeliveryModal = false;
    this.editingDeliveryId = null;
  }

  submitAddDelivery(): void {
    if (!this.isAddDeliveryFormValid()) return;

    const payload: BranchDeliveryFormData = {
      ...this.addDeliveryForm,
      farmerName: this.addDeliveryForm.farmerName?.trim(),
      volume: Number(this.addDeliveryForm.volume),
      estimatedValue: Number(this.addDeliveryForm.estimatedValue),
    };

    const request = this.editingDeliveryId
      ? this.svc.updateDelivery(this.editingDeliveryId, payload)
      : this.svc.addDelivery(payload);

    request.subscribe();
    this.closeAddDeliveryModal();
  }

  // Volume/Estimated Value must stay >= 0 — min="0" only clamps the spinner
  // arrows, so the minus key/paste needs to be blocked separately.
  blockNegativeKey(event: KeyboardEvent): void {
    if (event.key === '-') {
      event.preventDefault();
    }
  }

  blockNegativePaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (pasted.includes('-')) {
      event.preventDefault();
    }
  }

  trackByDeliveryId(_index: number, delivery: BranchDelivery): string {
    return delivery.id;
  }

  trackByOption(_index: number, option: string): string {
    return option;
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

  private createAddDeliveryForm(): BranchDeliveryFormData {
    return {
      branchId: this.session.branchId() ?? undefined,
      branchName: this.currentBranchName,
      // A single named farmer is recorded per quick-add; farmerCount keeps its
      // batch-aggregate meaning for the table/KPIs and is not user-editable here.
      farmerCount: 1,
      farmerName: '',
      commodity: this.commodityOptions[0] ?? 'Maize',
      volume: 0,
      volumeUnit: this.volumeUnitOptions[0] ?? 'KG',
      estimatedValue: 0,
      status: 'Pending',
      season: 'Wet Season',
      session: this.availableSessionOptions[0],
    };
  }

  private isAddDeliveryFormValid(): boolean {
    const volume = Number(this.addDeliveryForm.volume);
    const estimatedValue = Number(this.addDeliveryForm.estimatedValue);

    return Boolean(
      this.addDeliveryForm.branchName.trim() &&
      this.addDeliveryForm.commodity &&
      this.addDeliveryForm.farmerName?.trim() &&
      this.addDeliveryForm.volumeUnit &&
      Number.isFinite(volume) &&
      volume >= 0 &&
      Number.isFinite(estimatedValue) &&
      estimatedValue >= 0 &&
      this.addDeliveryForm.status &&
      this.addDeliveryForm.season &&
      this.addDeliveryForm.session &&
      // Re-checked at submit time in case the modal was left open across a session boundary.
      (Boolean(this.editingDeliveryId) || !this.sessionConfig.isSessionPassed(this.addDeliveryForm.session))
    );
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
