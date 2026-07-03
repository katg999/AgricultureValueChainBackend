import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import {
  InventoryScope,
  InventoryService,
  StockItem,
} from '../../../shared-inventory-domain/inventory.service';

export interface StockSummary {
  totalTypes: number;
  healthy: number;
  low: number;
  outOfStock: number;
  totalValue: number;
}

const THRESHOLD_MULTIPLIER = 4;

@Component({
  selector: 'app-current-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AlertComponent,
    ButtonComponent,
    StatCardComponent,
    DataTableComponent,
    CellDirective,
  ],
  templateUrl: './current-stock.component.html',
  styleUrls: ['./current-stock.component.css'],
})
export class CurrentStockComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly inventoryService: InventoryService,
  ) {}

  searchQuery = '';

  alertMessage = '';
  importMessage = '';
  isImporting = false;

  summary: StockSummary = {
    totalTypes: 0,
    healthy: 0,
    low: 0,
    outOfStock: 0,
    totalValue: 0,
  };

  branches: string[] = [];

  allItems: StockItem[] = [];

  filteredItems: StockItem[] = [];

  cols: TableColumn[] = [
    { key: 'name',         header: 'ITEM NAME',      class: 'item-name' },
    { key: 'category',     header: 'CATEGORY' },
    { key: 'quantity',     header: 'QUANTITY' },
    { key: 'unit',         header: 'UNIT' },
    { key: 'minThreshold', header: 'MIN. THRESHOLD',  class: 'threshold-cell' },
    { key: 'updatedAt',    header: 'ENTRY DATE',       class: 'date-cell' },
  ];

  get addStockRoute(): string {
    return this.isCooperativeScope
      ? '/cooperative/inventory/add-stock-item'
      : '/branch/inventory/add-stock-item';
  }

  get scope(): InventoryScope {
    return this.router.url.startsWith('/cooperative') ? 'cooperative' : 'branch';
  }

  get isCooperativeScope(): boolean {
    return this.scope === 'cooperative';
  }

  get pageTitle(): string {
    return this.isCooperativeScope ? 'Cooperative Stock Available' : 'Branch Stock Available';
  }

  get pageSubtitle(): string {
    return this.isCooperativeScope
      ? 'Current input stock held by the cooperative and available for branch issue.'
      : 'Current input stock allocated to this branch for farmer disbursement.';
  }

  ngOnInit(): void {
    this.inventoryService.getBranches().subscribe(branches => {
      this.branches = branches.map(b => b.name);
    });

    this.inventoryService.listStock(this.scope).subscribe(items => {
      this.allItems = items;
      this.recomputeSummary();
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.trim().toLowerCase();

    if (!q) {
      this.filteredItems = [...this.allItems];
      return;
    }

    this.filteredItems = this.allItems.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.stockStatus.includes(q) ||
      item.season.toLowerCase().includes(q) ||
      item.supplierName.toLowerCase().includes(q) ||
      item.branchNames.some(b => b.toLowerCase().includes(q)),
    );
  }

  getBarPercent(item: StockItem): number {    //GET BETTER LOGIC FOR THIS
    if (item.stockStatus === 'out' || item.quantity <= 0) return 0;

    const percent = (item.quantity / (item.minThreshold * THRESHOLD_MULTIPLIER)) * 100;
    return Math.min(Math.round(percent), 100);
  }

  addStock(): void {
    this.router.navigate(['../add-stock-item'], { relativeTo: this.route });
  }

  importStock(): void {
    this.isImporting = true;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept =
      '.csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];

      if (file) {
        this.importMessage = `Selected ${file.name} for stock import.`;
      }

      this.isImporting = false;
      fileInput.remove();
    });

    fileInput.addEventListener('cancel', () => {
      this.isImporting = false;
      fileInput.remove();
    });

    document.body.appendChild(fileInput);
    fileInput.click();
  }

  private buildAlertMessage(): string {
    const { low, outOfStock } = this.summary;

    if (low === 0 && outOfStock === 0) return '';

    const parts: string[] = [];

    if (low > 0) {
      parts.push(`${low} item${low > 1 ? 's are' : ' is'} below minimum threshold`);
    }

    if (outOfStock > 0) {
      parts.push(`${outOfStock} item${outOfStock > 1 ? 's are' : ' is'} out of stock`);
    }

    return parts.join(' and ') + '. Review and restock immediately.';
  }

  /** Route for low/out-of-stock cards — branch only; cooperative admins add stock directly */
  get lowItemRoute(): string | undefined {
    return this.isCooperativeScope ? undefined : '/branch/inventory/request-stock';
  }

  private recomputeSummary(): void {
    const low = this.allItems.filter(item => item.stockStatus === 'low').length;
    const outOfStock = this.allItems.filter(item => item.stockStatus === 'out').length;
    const totalValue = this.allItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    this.summary = {
      totalTypes: this.allItems.length,
      healthy: this.allItems.filter(item => item.stockStatus === 'healthy').length,
      low,
      outOfStock,
      totalValue,
    };

    this.alertMessage = this.buildAlertMessage();
  }
}
