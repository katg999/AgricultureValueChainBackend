import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, Subject, takeUntil, tap } from 'rxjs';
import { BranchDelivery, BranchDeliveryFormData, DeliverySession, DeliveryStatus, Season } from '../../../branch/collections/branch.delivery.model';
import { BranchDeliveryService } from '../../../branch/collections/branch.delivery.service';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';

@Component({
  selector: 'app-cooperative-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './delivery.cooperative.list.component.html',
  styleUrls: ['./delivery.cooperative.list.component.css'],
})
export class CooperativeDeliveriesComponent implements OnInit, OnDestroy {
  branchDeliveries$!: Observable<BranchDelivery[]>;
  filteredDeliveries$!: Observable<BranchDelivery[]>;
  paginatedDeliveries$!: Observable<BranchDelivery[]>;

  searchTerm = '';
  selectedSeason = '';

  isEditRoute = false;
  editingDelivery: BranchDelivery | null = null;
  form!: FormGroup;
  openActionMenuId: string | null = null;

  statusOptions: DeliveryStatus[] = [];
  commodityOptions: string[] = [];
  seasonOptions: Season[] = [];

  currentPage = 1;
  readonly itemsPerPage = 10;
  totalCount = 0;

  get startIndex(): number { return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endIndex(): number { return Math.min(this.currentPage * this.itemsPerPage, this.totalCount); }
  get pagesArray(): number[] {
    return Array.from({ length: Math.ceil(this.totalCount / this.itemsPerPage) }, (_, i) => i + 1);
  }

  private readonly destroy$ = new Subject<void>();
  private readonly filterState$ = new BehaviorSubject({
    searchTerm: '',
    selectedSeason: '',
  });
  private readonly pageState$ = new BehaviorSubject<number>(1);

  constructor(
    private svc: BranchDeliveryService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private sessionConfig: DeliverySessionConfigService,
  ) {}

  ngOnInit(): void {
    this.statusOptions = this.svc.getStatusOptions();
    this.commodityOptions = this.svc.getCommodityOptions();
    this.seasonOptions = this.svc.getSeasonOptions();

    // Cooperative sees ALL deliveries across branches.
    this.branchDeliveries$ = this.svc.getDeliveries().pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    // Step 1 — apply search + season filter.
    this.filteredDeliveries$ = combineLatest([this.branchDeliveries$, this.filterState$]).pipe(
      map(([deliveries, filter]) => this.filterDeliveries(deliveries, filter)),
    );

    // Step 2 — paginate the already-filtered list. tap() captures the total count
    // for the pagination footer before the slice happens.
    this.paginatedDeliveries$ = combineLatest([this.filteredDeliveries$, this.pageState$]).pipe(
      tap(([deliveries]) => { this.totalCount = deliveries.length; }),
      map(([deliveries, page]) =>
        deliveries.slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage),
      ),
    );

    // Watch the URL for /:id/edit so the edit modal opens/closes via navigation
    // rather than a local boolean flag — this makes the edit state bookmarkable.
    combineLatest([this.branchDeliveries$, this.route.paramMap])
      .pipe(takeUntil(this.destroy$)) // unsubscribe when component is destroyed to avoid memory leaks
      .subscribe(([deliveries, params]) => {
        const editId = params.get('id');
        this.isEditRoute = Boolean(editId);

        if (!editId) {
          this.editingDelivery = null;
          return;
        }

        const delivery = deliveries.find(row => row.id === editId) ?? null;
        this.editingDelivery = delivery;
        if (delivery) this.buildEditForm(delivery);
      });
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

  openEdit(delivery: BranchDelivery): void {
    this.openActionMenuId = null;
    this.router.navigate(['/cooperative/collections/delivery-list', delivery.id, 'edit']);
  }

  cancelEdit(): void {
    this.editingDelivery = null;
    this.router.navigate(['/cooperative/collections/delivery-list']);
  }

  saveEdit(): void {
    if (!this.form || this.form.invalid) {
      this.form?.markAllAsTouched();
      return;
    }
    if (!this.editingDelivery) return;
    const formData: BranchDeliveryFormData = this.form.value;
    this.svc.updateDelivery(this.editingDelivery.id, formData);
    this.cancelEdit();
  }

  approveDelivery(delivery: BranchDelivery): void {
    this.openActionMenuId = null;
    const formData: BranchDeliveryFormData = {
      branchId: delivery.branchId,
      branchName: delivery.branchName,
      farmerCount: delivery.farmerCount,
      commodity: delivery.commodity,
      volume: delivery.volume,
      estimatedValue: delivery.estimatedValue,
      status: 'Approved',
      season: delivery.season,
    };
    this.svc.updateDelivery(delivery.id, formData);
  }

  rejectDelivery(delivery: BranchDelivery): void {
    this.openActionMenuId = null;
    const formData: BranchDeliveryFormData = {
      branchId: delivery.branchId,
      branchName: delivery.branchName,
      farmerCount: delivery.farmerCount,
      commodity: delivery.commodity,
      volume: delivery.volume,
      estimatedValue: delivery.estimatedValue,
      status: 'Rejected',
      season: delivery.season,
    };
    this.svc.updateDelivery(delivery.id, formData);
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

  private buildEditForm(delivery: BranchDelivery): void {
    this.form = this.fb.group({
      branchId: [delivery.branchId],
      branchName: [delivery.branchName, Validators.required],
      farmerCount: [delivery.farmerCount, [Validators.required, Validators.min(1)]],
      commodity: [delivery.commodity, Validators.required],
      volume: [delivery.volume, [Validators.required, Validators.min(0)]],
      estimatedValue: [delivery.estimatedValue, [Validators.required, Validators.min(0)]],
      status: [delivery.status, Validators.required],
      season: [delivery.season, Validators.required],
    });
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
