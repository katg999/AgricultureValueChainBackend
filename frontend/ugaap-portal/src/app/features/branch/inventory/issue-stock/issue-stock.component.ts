import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import {
  BranchOption,
  FarmerOption,
  InventoryScope,
  InventoryService,
  RepaymentMethod,
  StockItem,
} from '../../../shared-inventory-domain/inventory.service';

interface InputType {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
}

interface IssueStockForm {
  stockItemId: string;
  branchId: string;
  quantity: string;
  season: string;
  repaymentMethod: RepaymentMethod | '';
  deductionRate: string;
  acknowledged: boolean;
}

interface RecentIssuance {
  id: string;
  farmerName: string;
  farmerId: string;
  initials: string;
  avatarColor: string;
  item: string;
  quantity: string;
  value: number;
  time: string;
  destination: string;
}

@Component({
  selector: 'app-issue-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
    PageHeaderComponent,
  ],
  templateUrl: './issue-stock.component.html',
  styleUrl: './issue-stock.component.css',
})
export class IssueStockComponent {
  farmerSearch = '';
  selectedFarmer: FarmerOption | null = null;
  searchResults: FarmerOption[] = [];
  calculatedValue = 0;

  farmers: FarmerOption[] = [];
  branches: BranchOption[] = [];
  stockItems: StockItem[] = [];
  inputTypes: InputType[] = [];

  readonly seasons = ['Wet Season', 'Dry Season'];

  readonly repaymentMethods: { value: RepaymentMethod; label: string }[] = [
    { value: 'post-harvest-deduction', label: 'Post-Harvest Deduction' },
    { value: 'installments',           label: 'Monthly Installments'   },
    { value: 'lump-sum',               label: 'Lump Sum'               },
  ];

  form: IssueStockForm = {
    stockItemId: '',
    branchId: '',
    quantity: '',
    season: '',
    repaymentMethod: '',
    deductionRate: '',
    acknowledged: false,
  };

  recentIssuances: RecentIssuance[] = [
    {
      id: 'ISS-1001',
      farmerName: 'Amina Nakato',
      farmerId: 'F-1001',
      initials: 'AN',
      avatarColor: '#f25d27',
      item: 'NPK Fertilizer',
      quantity: '4 Bags',
      value: 720000,
      time: '09:14',
      destination: 'Amina Nakato',
    },
    {
      id: 'ISS-1002',
      farmerName: 'Gulu Branch',
      farmerId: 'BR-GUL',
      initials: 'GB',
      avatarColor: '#22a65a',
      item: 'Maize Seeds',
      quantity: '300 Kgs',
      value: 4500000,
      time: '10:05',
      destination: 'Gulu Branch',
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly inventoryService: InventoryService,
  ) {
    this.branches = this.inventoryService.getBranches();
    this.farmers = this.inventoryService.getFarmersForCurrentBranch();
    this.inventoryService.listStock(this.scope).subscribe(items => {
      this.stockItems = items;
      this.inputTypes = items.map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        unitPrice: item.unitPrice,
      }));
    });
  }

  get scope(): InventoryScope {
    return this.router.url.startsWith('/cooperative') ? 'cooperative' : 'branch';
  }

  get isCooperativeScope(): boolean {
    return this.scope === 'cooperative';
  }

  get pageTitle(): string {
    return this.isCooperativeScope ? 'Issue Stock to Branch' : 'Issue Stock to Farmer';
  }

  get pageSubtitle(): string {
    return this.isCooperativeScope
      ? 'Disburse cooperative stock to a branch for farmer allocation.'
      : 'Record a new input allocation for a farmer.';
  }

  get currentUnit(): string {
    return this.selectedInputType?.unit ?? 'Units';
  }

  private get selectedInputType(): InputType | undefined {
    return this.inputTypes.find(input => input.id === this.form.stockItemId);
  }

  searchFarmers(): void {
    const query = this.farmerSearch.trim().toLowerCase();

    if (!query) {
      this.searchResults = [];
      return;
    }

    this.searchResults = this.farmers.filter(
      farmer =>
        farmer.name.toLowerCase().includes(query) ||
        farmer.id.toLowerCase().includes(query) ||
        farmer.phone.includes(query),
    );
  }

  selectFarmer(farmer: FarmerOption): void {
    this.selectedFarmer = farmer;
    this.farmerSearch = `${farmer.name} (${farmer.id})`;
    this.searchResults = [];
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }

  recalculateValue(): void {
    const quantity = Number(this.form.quantity) || 0;
    this.calculatedValue = this.selectedInputType ? quantity * this.selectedInputType.unitPrice : 0;
  }

  canSubmit(): boolean {
    const hasDestination = this.isCooperativeScope ? Boolean(this.form.branchId) : Boolean(this.selectedFarmer);
    const hasRepaymentTerms = this.isCooperativeScope ||
      (Boolean(this.form.repaymentMethod) &&
        Number(this.form.deductionRate) > 0 &&
        Number(this.form.deductionRate) <= 100);

    return Boolean(
      hasDestination &&
        this.form.stockItemId &&
        this.form.season &&
        Number(this.form.quantity) > 0 &&
        hasRepaymentTerms &&
        this.form.acknowledged,
    );
  }

  issueInput(): void {
    if (!this.canSubmit()) return;

    const quantity = Number(this.form.quantity);

    if (this.isCooperativeScope) {
      this.inventoryService.issueStockToBranch({
        stockItemId: this.form.stockItemId,
        branchId: this.form.branchId,
        quantity,
        season: this.form.season,
      }).subscribe(row => {
        this.prependIssuance(row.branchName, row.branchId, row.itemName, row.quantity, row.unit, row.totalValue);
        this.resetForm();
      });
      return;
    }

    if (!this.selectedFarmer) return;

    this.inventoryService.issueStockToFarmer({
      stockItemId: this.form.stockItemId,
      farmerId: this.selectedFarmer.id,
      quantity,
      season: this.form.season,
      repaymentMethod: this.form.repaymentMethod as RepaymentMethod,
      deductionRate: Number(this.form.deductionRate),
    }).subscribe(row => {
      this.prependIssuance(row.farmerName, row.farmerId, row.itemName, row.quantity, row.unit, row.totalValue);
      this.resetForm();
    });
  }

  cancel(): void {
    this.router.navigate([this.isCooperativeScope ? '/cooperative/inventory/current-stock' : '/branch/inventory/current-stock']);
  }

  trackById(_: number, row: RecentIssuance): string {
    return row.id;
  }

  private resetForm(): void {
    this.farmerSearch = '';
    this.selectedFarmer = null;
    this.searchResults = [];
    this.calculatedValue = 0;
    this.form = {
      stockItemId: '',
      branchId: '',
      quantity: '',
      season: '',
      repaymentMethod: '',
      deductionRate: '',
      acknowledged: false,
    };
  }

  private prependIssuance(
    destination: string,
    destinationId: string,
    item: string,
    quantity: number,
    unit: string,
    value: number,
  ): void {
    const issuance: RecentIssuance = {
      id: `ISS-${Date.now()}`,
      farmerName: destination,
      farmerId: destinationId,
      initials: this.getInitials(destination),
      avatarColor: '#533c59',
      item,
      quantity: `${quantity} ${unit}`,
      value,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      destination,
    };

    this.recentIssuances = [issuance, ...this.recentIssuances];
  }
}
