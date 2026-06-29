import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

import { MOCK_FARMER_DELIVERY_RECORDS } from '../../../../core/mock/mock-branch';

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
      // Filter mock records for this specific batch and map to FarmerDelivery shape.
      const batchFarmers: FarmerDelivery[] = MOCK_FARMER_DELIVERY_RECORDS
        .filter(r => r.deliveryBatchId === batchId)
        .map(r => ({
          id:             r.id,
          farmerId:       r.farmerId,
          farmerName:     r.farmerName,
          commodity:      r.commodity,
          volume:         r.volume,
          unitPrice:      r.unitPrice,
          estimatedValue: r.estimatedValue,
          grade:          r.grade,
          status:         r.status as FarmerDelivery['status'],
          season:         r.season as string,
          session:        r.session as string | undefined,
          createdAt:      new Date(r.deliveryDate),
          updatedAt:      new Date(r.deliveryDate),
        }));
      this.farmerDeliveries$ = of(batchFarmers);
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
