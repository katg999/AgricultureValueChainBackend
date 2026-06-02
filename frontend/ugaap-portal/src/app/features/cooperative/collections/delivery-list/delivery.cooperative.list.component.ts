import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, Subject, takeUntil } from 'rxjs';
import { BranchDelivery, BranchDeliveryFormData, DeliveryStatus } from '../../../branch/collections/branch.delivery.model';
import { BranchDeliveryService } from '../../../branch/collections/branch.delivery.service';
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';

@Component({
  selector: 'app-cooperative-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StatsCardComponent],
  templateUrl: './delivery.cooperative.list.component.html',
  styleUrls: ['./delivery.cooperative.list.component.css'],
})
export class CooperativeDeliveriesComponent implements OnInit, OnDestroy {
  /** The cooperative view consumes branch deliveries from the shared service instead of a static array. */
  branchDeliveries$!: Observable<BranchDelivery[]>;
  filteredDeliveries$!: Observable<BranchDelivery[]>;
  searchTerm = '';
  selectedCategory = '';

  isEditRoute = false;
  editingDelivery: BranchDelivery | null = null;
  form!: FormGroup;
  openActionMenuId: string | null = null;

  statusOptions: DeliveryStatus[] = [];
  commodityOptions: string[] = [];

  private readonly destroy$ = new Subject<void>();
  private readonly filterState$ = new BehaviorSubject({
    searchTerm: '',
    selectedCategory: '',
  });

  constructor(
    private svc: BranchDeliveryService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.statusOptions = this.svc.getStatusOptions();
    this.commodityOptions = this.svc.getCommodityOptions();

    this.branchDeliveries$ = this.svc.getDeliveries().pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    // Keep cooperative summaries and table rows reactive to pending mock approvals from the store.
    this.filteredDeliveries$ = combineLatest([this.branchDeliveries$, this.filterState$]).pipe(
      map(([deliveries, filter]) => this.filterDeliveries(deliveries, filter)),
    );

    combineLatest([this.branchDeliveries$, this.route.paramMap])
      .pipe(takeUntil(this.destroy$))
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(): void {
    this.filterState$.next({
      searchTerm: this.searchTerm,
      selectedCategory: this.selectedCategory,
    });
  }

  toggleActionMenu(delivery: BranchDelivery, event: MouseEvent): void {
    event.stopPropagation();
    this.editingDelivery = delivery;
    this.openActionMenuId = this.openActionMenuId === delivery.id ? null : delivery.id;
  }

  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  /** Route-driven editing replaces the old inline modal state and keeps refresh/deep-link behavior intact. */
  openEdit(delivery: BranchDelivery): void {
    this.editingDelivery = delivery;
    this.openActionMenuId = null;
    this.router.navigate(['/cooperative/collections/delivery-list', delivery.id, 'edit']);
  }

  cancelEdit(): void {
    this.editingDelivery = null;
    this.router.navigate(['/cooperative/collections/delivery-list']);
  }

  saveEdit(): void {
    if (!this.form) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.editingDelivery) return;
    const formData: BranchDeliveryFormData = this.form.value;
    this.svc.updateDelivery(this.editingDelivery.id, formData);
    this.cancelEdit();
  }

  trackByDeliveryId(_index: number, delivery: BranchDelivery): string {
    return delivery.id;
  }

  trackByOption(_index: number, option: string): string {
    return option;
  }

  /** Aggregated summary stats for the cooperative header */
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

  private buildEditForm(delivery: BranchDelivery): void {
    this.form = this.fb.group({
      branchId: [delivery.branchId],
      branchName: [delivery.branchName, Validators.required],
      farmerCount: [delivery.farmerCount, [Validators.required, Validators.min(1)]],
      commodity: [delivery.commodity, Validators.required],
      volume: [delivery.volume, [Validators.required, Validators.min(0)]],
      estimatedValue: [delivery.estimatedValue, [Validators.required, Validators.min(0)]],
      status: [delivery.status, Validators.required],
    });
  }

  private filterDeliveries(
    deliveries: BranchDelivery[],
    filter: { searchTerm: string; selectedCategory: string },
  ): BranchDelivery[] {
    const term = filter.searchTerm.trim().toLowerCase();

    return deliveries.filter(d => {
      const matchSearch =
        !term ||
        d.branchName.toLowerCase().includes(term) ||
        d.id.toLowerCase().includes(term) ||
        d.commodity.toLowerCase().includes(term);
      const matchCategory = !filter.selectedCategory || d.commodity === filter.selectedCategory;
      return matchSearch && matchCategory;
    });
  }
}
