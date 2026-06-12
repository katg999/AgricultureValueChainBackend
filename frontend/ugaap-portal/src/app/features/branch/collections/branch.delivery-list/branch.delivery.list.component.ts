import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay } from 'rxjs';

import { BranchDelivery, BranchDeliveryFormData, DeliveryStatus, Season } from '../branch.delivery.model';
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
  selectedSeason = '';

  statusOptions: DeliveryStatus[] = [];
  commodityOptions: string[] = [];
  seasonOptions: Season[] = [];
  openActionMenuId: string | null = null;
  menuPosition: { top?: number; bottom?: number; right: number } = { right: 0 };
  showAddDeliveryModal = false;
  addDeliveryForm!: BranchDeliveryFormData;

  private readonly filterState$ = new BehaviorSubject({
    searchTerm: '',
    selectedSeason: '',
  });

  constructor(
    private svc: BranchDeliveryService,
    private router: Router,
    private session: SessionService
  ) {}

  ngOnInit(): void {
    this.statusOptions = this.svc.getStatusOptions();
    this.commodityOptions = this.svc.getCommodityOptions();
    this.seasonOptions = this.svc.getSeasonOptions();
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
  }

  ngOnDestroy(): void {
    this.filterState$.complete();
  }

  applyFilter(): void {
    this.filterState$.next({
      searchTerm: this.searchTerm,
      selectedSeason: this.selectedSeason,
    });
  }

  setSeasonFilter(season: string): void {
    this.selectedSeason = season;
    this.applyFilter();
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
      season: delivery.season,
    }).subscribe();
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
      season: delivery.season,
    }).subscribe();
    this.openActionMenuId = null;
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

    this.svc.addDelivery({
      ...this.addDeliveryForm,
      farmerCount: Number(this.addDeliveryForm.farmerCount),
      volume: Number(this.addDeliveryForm.volume),
      estimatedValue: Number(this.addDeliveryForm.estimatedValue),
    }).subscribe();
    this.closeAddDeliveryModal();
  }

  trackByDeliveryId(_index: number, delivery: BranchDelivery): string {
    return delivery.id;
  }

  trackByOption(_index: number, option: string): string {
    return option;
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
      farmerCount: 0,
      commodity: this.commodityOptions[0] ?? 'Maize',
      volume: 0,
      estimatedValue: 0,
      status: 'Pending',
      season: 'Wet Season',
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
      this.addDeliveryForm.status &&
      this.addDeliveryForm.season
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
        d.status.toLowerCase().includes(term);

      const matchSeason =
        !filter.selectedSeason || d.season === filter.selectedSeason;

      return matchSearch && matchSeason;
    });
  }
}
