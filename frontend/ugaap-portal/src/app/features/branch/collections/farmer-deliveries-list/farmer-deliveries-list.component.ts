import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, tap } from 'rxjs';

import { FarmerDelivery } from '../farmer.delivery.model';
import { FarmerDeliveryService } from '../farmer.delivery.service';
import { BranchDelivery, DeliverySession, DeliveryStatus } from '../branch.delivery.model';
import { BranchDeliveryService } from '../branch.delivery.service';
import { SessionService } from '../../../../core/services/session.service';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';
// Needed so the template can check useGrades to show/hide the Grade column.
import { CooperativePricingService } from '../../../../core/services/cooperative-pricing.service';

@Component({
  selector: 'app-farmer-deliveries-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './farmer-deliveries-list.component.html',
  styleUrl: './farmer-deliveries-list.component.css',
})
export class FarmerDeliveriesListComponent implements OnInit, OnDestroy {
  farmerDeliveries$!: Observable<FarmerDelivery[]>;
  paginatedFarmerDeliveries$!: Observable<FarmerDelivery[]>;
  // Set when navigated here via a delivery row's "View" action — scopes the list to that batch.
  batchDelivery: BranchDelivery | null = null;
  // 'cooperative' when drilled into from the cooperative deliveries view; affects back-link.
  fromContext: 'cooperative' | 'branch' = 'branch';

  currentPage = 1;
  readonly itemsPerPage = 10;
  totalCount = 0;

  get startIndex(): number { return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endIndex(): number { return Math.min(this.currentPage * this.itemsPerPage, this.totalCount); }
  get pagesArray(): number[] {
    return Array.from({ length: Math.ceil(this.totalCount / this.itemsPerPage) }, (_, i) => i + 1);
  }

  private readonly pageState$ = new BehaviorSubject<number>(1);

  constructor(
    private readonly farmerDeliveryService: FarmerDeliveryService,
    private readonly branchDeliveryService: BranchDeliveryService,
    private readonly session: SessionService,
    private readonly sessionConfig: DeliverySessionConfigService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    // Must be public so the template can access pricingService.useGrades directly.
    public readonly pricingService: CooperativePricingService,
  ) {}

  ngOnInit(): void {
    const batchId = this.route.snapshot.queryParamMap.get('batch');
    const from    = this.route.snapshot.queryParamMap.get('from');
    this.fromContext   = from === 'cooperative' ? 'cooperative' : 'branch';
    this.batchDelivery = batchId ? this.branchDeliveryService.getDeliveryById(batchId) ?? null : null;

    // getAll() hydrates the service's BehaviorSubject; allForRole$ pipes from it.
    this.farmerDeliveryService.getAll().subscribe();
    this.farmerDeliveries$ = this.farmerDeliveryService.allForRole$(
      this.session.branchId(),
      this.session.userRole(),
      batchId,
    );

    // Paginate the (already-filtered) list. tap() captures the total count
    // for the pagination footer before the slice happens.
    this.paginatedFarmerDeliveries$ = combineLatest([this.farmerDeliveries$, this.pageState$]).pipe(
      tap(([deliveries]) => { this.totalCount = deliveries.length; }),
      map(([deliveries, page]) =>
        deliveries.slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage),
      ),
    );
  }

  ngOnDestroy(): void {
    this.pageState$.complete();
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

  goToBranchDeliveries(): void {
    const target = this.fromContext === 'cooperative'
      ? '/cooperative/collections/delivery-list'
      : '/branch/collections/deliveries';
    this.router.navigate([target]);
  }

  clearBatchFilter(): void {
    this.router.navigate(['/branch/collections/farmers']);
  }

  trackByIndex(index: number): number {
    return index;
  }

  statusClass(status: DeliveryStatus): string {
    const map: Record<DeliveryStatus, string> = {
      Pending: 'status-pending',
      Approved: 'status-approved',
      Rejected: 'status-rejected',
    };
    return map[status];
  }

  formatUGX(value: number): string {
    return new Intl.NumberFormat('en-UG').format(value);
  }

  netPayment(farmer: FarmerDelivery): number {
    return (farmer.estimatedValue || 0) - (farmer.inputLoanDeduction || 0);
  }

  sessionLabel(id: DeliverySession | undefined): string {
    return this.sessionConfig.getLabel(id);
  }

  trackByFarmerDeliveryId(_index: number, item: FarmerDelivery): string {
    return item.id;
  }
}
