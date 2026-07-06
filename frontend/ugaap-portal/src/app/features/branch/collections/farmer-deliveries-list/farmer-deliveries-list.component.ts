import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { FarmerDelivery } from '../farmer.delivery.model';
import { FarmerDeliveryService } from '../farmer.delivery.service';
import { BranchDelivery, DeliverySession, DeliveryStatus } from '../branch.delivery.model';
import { BranchDeliveryService } from '../branch.delivery.service';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';
import { CooperativePricingService } from '../../../../core/services/cooperative-pricing.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';

@Component({
  selector: 'app-farmer-deliveries-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, CellDirective],
  templateUrl: './farmer-deliveries-list.component.html',
  styleUrl: './farmer-deliveries-list.component.css',
})
export class FarmerDeliveriesListComponent implements OnInit {
  farmerDeliveries$!: Observable<FarmerDelivery[]>;

  // Set when navigated here from a delivery batch row — scopes context info in the header.
  batchDelivery: BranchDelivery | null = null;
  fromContext: 'cooperative' | 'branch' = 'branch';

  // Grade column is inserted conditionally when the cooperative has grade pricing enabled.
  get columns(): TableColumn[] {
    const base: TableColumn[] = [
      { key: 'id',         header: 'Farmer ID', class: 'mono' },
      { key: 'farmerName', header: 'Name' },
      { key: 'commodity',  header: 'Commodity' },
    ];
    if (this.pricingService.useGrades) {
      base.push({ key: 'grade', header: 'Grade' });
    }
    return [
      ...base,
      { key: 'volume',         header: 'Volume' },
      { key: 'unitPrice',      header: 'Unit Price' },
      { key: 'estimatedValue', header: 'Gross Value' },
      { key: 'season',         header: 'Season' },
      { key: 'session',        header: 'Session' },
      { key: 'status',         header: 'Status' },
    ];
  }

  constructor(
    private readonly farmerDeliveryService: FarmerDeliveryService,
    private readonly branchDeliveryService: BranchDeliveryService,
    private readonly sessionConfig: DeliverySessionConfigService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    // Public so the template and the columns getter can access useGrades.
    public readonly pricingService: CooperativePricingService,
  ) {}

  ngOnInit(): void {
    const batchId = this.route.snapshot.queryParamMap.get('batch');
    const from    = this.route.snapshot.queryParamMap.get('from');
    this.fromContext   = from === 'cooperative' ? 'cooperative' : 'branch';
    this.batchDelivery = batchId ? this.branchDeliveryService.getDeliveryById(batchId) ?? null : null;

    if (batchId) {
      // Delegate batch filtering to the service — respects USE_MOCK.
      this.farmerDeliveries$ = this.farmerDeliveryService.getByBatchId(batchId);
    } else {
      // No batch filter — show all farmer deliveries for this branch.
      this.farmerDeliveries$ = this.farmerDeliveryService.deliveries$;
      this.farmerDeliveryService.getPaginated(0, 200).subscribe({ error: () => {} });
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

  statusClass(status: DeliveryStatus): string {
    const map: Record<DeliveryStatus, string> = {
      Pending:  'status-pending',
      Approved: 'status-approved',
      Rejected: 'status-rejected',
    };
    return map[status];
  }

  formatUGX(value: number): string {
    return new Intl.NumberFormat('en-UG').format(value);
  }

  sessionLabel(id: string | undefined): string {
    return this.sessionConfig.getLabel(id as DeliverySession | undefined);
  }
}
