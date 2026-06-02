import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay } from 'rxjs';

import { BranchDelivery, BranchDeliveryFormData, DeliveryStatus } from '../branch.delivery.model';
import { BranchDeliveryService } from '../branch.delivery.service';
import { SessionService } from '../../../../core/services/session.service';

@Component({
  selector: 'app-branch-deliveries',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './branch.delivery.list.component.html',
  styleUrls: ['./branch.delivery.list.component.css'],
})
export class BranchDeliveriesComponent implements OnInit, OnDestroy {
  deliveries$!: Observable<BranchDelivery[]>;
  filteredDeliveries$!: Observable<BranchDelivery[]>;

  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';

  statusOptions: DeliveryStatus[] = [];
  commodityOptions: string[] = [];
  openActionMenuId: string | null = null;
  showAddDeliveryModal = false;
  addDeliveryForm!: BranchDeliveryFormData;

  private readonly filterState$ = new BehaviorSubject({
    searchTerm: '',
    selectedCategory: '',
    selectedStatus: '',
  });

  constructor(
    private svc: BranchDeliveryService,
    private router: Router,
    private route: ActivatedRoute,
    private session: SessionService
  ) {}

  ngOnInit(): void {
    this.statusOptions = this.svc.getStatusOptions();
    this.commodityOptions = this.svc.getCommodityOptions();
    this.addDeliveryForm = this.createAddDeliveryForm();

    this.deliveries$ = this.svc
      .getDeliveriesForBranch(this.session.branchId(), this.currentBranchName)
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));

    // The branch table renders from this stream, so service emissions sync without manual reloads.
    this.filteredDeliveries$ = combineLatest([this.deliveries$, this.filterState$]).pipe(
      map(([deliveries, filter]) => this.filterDeliveries(deliveries, filter)),
    );
  }

  ngOnDestroy(): void {
    this.filterState$.complete();
  }

  applyFilter(): void {
    this.filterState$.next({
      searchTerm: this.searchTerm,
      selectedCategory: this.selectedCategory,
      selectedStatus: this.selectedStatus,
    });
  }

  approve(delivery: BranchDelivery): void {
    this.svc.updateDelivery(delivery.id, {
      branchName: delivery.branchName,
      branchId: delivery.branchId,
      farmerCount: delivery.farmerCount,
      commodity: delivery.commodity,
      volume: delivery.volume,
      estimatedValue: delivery.estimatedValue,
      status: 'Approved',
    });
    this.openActionMenuId = null;
  }

  reject(delivery: BranchDelivery): void {
    this.svc.updateDelivery(delivery.id, {
      branchName: delivery.branchName,
      branchId: delivery.branchId,
      farmerCount: delivery.farmerCount,
      commodity: delivery.commodity,
      volume: delivery.volume,
      estimatedValue: delivery.estimatedValue,
      status: 'Rejected',
    });
    this.openActionMenuId = null;
  }

  toggleActionMenu(deliveryId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openActionMenuId = this.openActionMenuId === deliveryId ? null : deliveryId;
  }

  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  openAddDeliveryModal(): void {
    this.openActionMenuId = null;
    this.addDeliveryForm = this.createAddDeliveryForm();
    this.showAddDeliveryModal = true;
  }

  closeAddDeliveryModal(): void {
    this.showAddDeliveryModal = false;
  }

  submitAddDelivery(): void {
    if (!this.isAddDeliveryFormValid()) return;

    // Adding through the service pushes into the BehaviorSubject store, so the async table updates immediately.
    this.svc.addDelivery({
      ...this.addDeliveryForm,
      farmerCount: Number(this.addDeliveryForm.farmerCount),
      volume: Number(this.addDeliveryForm.volume),
      estimatedValue: Number(this.addDeliveryForm.estimatedValue),
    });
    this.closeAddDeliveryModal();
  }

  trackByDeliveryId(_index: number, delivery: BranchDelivery): string {
    return delivery.id;
  }

  trackByOption(_index: number, option: string): string {
    return option;
  }

  goToFarmerDeliveries(deliveryId?: string): void {
    this.openActionMenuId = null;

    if (deliveryId) {
      this.router.navigate(['../deliveries', deliveryId], { relativeTo: this.route });
    } else {
      this.router.navigate(['../farmer-deliveries'], { relativeTo: this.route });
    }
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

  private get currentBranchName(): string | null {
    const user = this.session.currentUser() as { branchName?: string } | null;
    return user?.branchName ?? null;
  }

  private createAddDeliveryForm(): BranchDeliveryFormData {
    return {
      branchId: this.session.branchId() ?? undefined,
      branchName: this.currentBranchName ?? '',
      farmerCount: 0,
      commodity: this.commodityOptions[0] ?? 'Maize',
      volume: 0,
      estimatedValue: 0,
      status: 'Pending',
    };
  }

  private isAddDeliveryFormValid(): boolean {
    const farmerCount = Number(this.addDeliveryForm.farmerCount);
    const volume = Number(this.addDeliveryForm.volume);
    const estimatedValue = Number(this.addDeliveryForm.estimatedValue);

    return Boolean(
      this.addDeliveryForm.branchName.trim() &&
      this.addDeliveryForm.commodity &&
      Number.isFinite(farmerCount) &&
      farmerCount >= 0 &&
      Number.isFinite(volume) &&
      volume >= 0 &&
      Number.isFinite(estimatedValue) &&
      estimatedValue >= 0 &&
      this.addDeliveryForm.status
    );
  }

  private filterDeliveries(
    deliveries: BranchDelivery[],
    filter: { searchTerm: string; selectedCategory: string; selectedStatus: string },
  ): BranchDelivery[] {
    const term = filter.searchTerm.toLowerCase();

    return deliveries.filter(d => {
      const matchSearch =
        !term ||
        d.branchName.toLowerCase().includes(term) ||
        d.id.toLowerCase().includes(term) ||
        d.commodity.toLowerCase().includes(term);

      const matchCategory =
        !filter.selectedCategory || d.commodity === filter.selectedCategory;

      const matchStatus =
        !filter.selectedStatus || d.status === filter.selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }
}
