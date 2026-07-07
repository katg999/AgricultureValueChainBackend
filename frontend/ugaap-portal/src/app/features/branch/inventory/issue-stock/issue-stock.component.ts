import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import {
  BranchDisbursement,
  BranchOption,
  FarmerAllocation,
  FarmerOption,
  InventoryScope,
  InventoryService,
  RepaymentMethod,
  StockItem,
} from '../../../shared-inventory-domain/inventory.service';

interface InputType {
  id: string;
  name: string;
  category: string;
  categoryClass: string;
  unit: string;
  unitPrice: number;
}

interface IssueStockForm {
  stockItemId: string;
  branchId: string;
  quantity: string;
  season: string;
  deductionRate: string;
}

interface RecentIssuance {
  id: string;
  farmerName: string;
  farmerId: string;
  initials: string;
  avatarColor: string;
  item: string;
  itemCategory: string;
  quantity: string;
  value: number;
  issuedAt: string;
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
    DataTableComponent,
    CellDirective,
  ],
  templateUrl: './issue-stock.component.html',
  styleUrl: './issue-stock.component.css',
})
export class IssueStockComponent implements OnInit {
  farmerSearch = '';
  selectedFarmer: FarmerOption | null = null;
  searchResults: FarmerOption[] = [];
  calculatedValue = 0;

  farmers: FarmerOption[] = [];
  branches: BranchOption[] = [];
  stockItems: StockItem[] = [];
  inputTypes: InputType[] = [];

  readonly seasons = ['Wet Season', 'Dry Season'];

  form: IssueStockForm = {
    stockItemId: '',
    branchId: '',
    quantity: '',
    season: '',
    deductionRate: '',
  };

  submitting = false;

  activeMenuId: string | null = null;
  menuPosition: { top?: number; bottom?: number; right: number } = { top: 0, right: 0 };
  viewingIssuance: RecentIssuance | null = null;
  editingIssuance: RecentIssuance | null = null;
  editForm: { quantity: string; value: string } = { quantity: '', value: '' };

  recentIssuances: RecentIssuance[] = [];

  issuanceCols: TableColumn[] = [
    { key: 'recipient',   header: '' },
    { key: 'item',        header: 'Item Name',   class: 'item-name-cell' },
    { key: 'itemCategory',header: 'Category' },
    { key: 'quantity',    header: 'Quantity' },
    { key: 'value',       header: 'Value' },
    { key: 'issuedAt',    header: 'Date Issued', class: 'recent-row-date' },
    { key: 'actions',     header: '',            width: '48px' },
  ];

  constructor(
    private readonly router: Router,
    private readonly inventoryService: InventoryService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.inventoryService.getFarmersForCurrentBranch().subscribe(f => this.farmers = f);

    // Populate the dropdown immediately from cache, then overwrite when HTTP responds.
    const snapshot = this.inventoryService.getStockItems(this.scope);
    this.stockItems = snapshot;
    this.inputTypes = snapshot.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      categoryClass: item.categoryClass,
      unit: item.unit,
      unitPrice: item.unitPrice,
    }));

    this.inventoryService.listStock(this.scope).subscribe(items => {
      this.stockItems = items;
      this.inputTypes = items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        categoryClass: item.categoryClass,
        unit: item.unit,
        unitPrice: item.unitPrice,
      }));
    });

    if (this.isCooperativeScope) {
      // Recent issuances resolve branch names from this.branches — load it first
      // so the table never flashes a raw branch ID before quietly fixing itself.
      this.inventoryService.getBranches().subscribe(b => {
        this.branches = b;
        this.loadRecentIssuances();
      });
    } else {
      this.inventoryService.getBranches().subscribe(b => this.branches = b);
      this.loadRecentIssuances();
    }
  }

  // URL is the source of truth — the router already sent users to the right prefix.
  get scope(): InventoryScope {
    return this.router.url.startsWith('/cooperative') ? 'cooperative' : 'branch';
  }

  get isCooperativeScope(): boolean {
    return this.scope === 'cooperative';
  }

  get pageTitle(): string {
    return this.isCooperativeScope ? 'Issue Stock to Branch' : 'Issue Input to Farmer';
  }

  get pageSubtitle(): string {
    return this.isCooperativeScope
      ? 'Disburse cooperative stock to a branch for farmer allocation.'
      : 'Record a new input allocation for a farmer.';
  }

  get currentUnit(): string {
    return this.selectedInputType?.unit ?? 'Units';
  }

  get currentUnitPrice(): number {
    return this.selectedInputType?.unitPrice ?? 0;
  }

  get currentCategory(): string {
    return this.selectedInputType?.category ?? '';
  }

  get currentCategoryClass(): string {
    return this.selectedInputType?.categoryClass ?? '';
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
    if (this.submitting) return false;

    const hasDestination = this.isCooperativeScope ? Boolean(this.form.branchId) : Boolean(this.selectedFarmer);
    const hasRepaymentTerms = this.isCooperativeScope ||
      (Number(this.form.deductionRate) >= 0 && Number(this.form.deductionRate) <= 100);

    return Boolean(
      hasDestination &&
        this.form.stockItemId &&
        this.form.season &&
        Number(this.form.quantity) > 0 &&
        hasRepaymentTerms,
    );
  }

  issueInput(): void {
    if (!this.canSubmit()) return;

    this.submitting = true;
    const quantity = Number(this.form.quantity);

    // Coop issues to a branch; branch staff issue to a farmer — different endpoints.
    if (this.isCooperativeScope) {
      this.inventoryService.issueStockToBranch({
        stockItemId: this.form.stockItemId,
        branchId: this.form.branchId,
        quantity,
        season: this.form.season,
      }).subscribe({
        next: () => {
          this.recentIssuances = this.inventoryService.getRecentBranchDisbursements()
            .map(r => this.disbursementToIssuance(r));
          this.resetForm();
          this.toastService.success('Stock issued to branch');
          this.submitting = false;
        },
        error: (err: HttpErrorResponse) => {
          this.toastService.error('Failed to issue stock', this.extractErrorMessage(err));
          this.submitting = false;
        },
      });
      return;
    }

    if (!this.selectedFarmer) {
      this.submitting = false;
      return;
    }

    this.inventoryService.issueStockToFarmer({
      stockItemId: this.form.stockItemId,
      farmerId: this.selectedFarmer.id,
      quantity,
      season: this.form.season,
      repaymentMethod: 'post-harvest-deduction' as RepaymentMethod,
      deductionRate: Number(this.form.deductionRate),
    }).subscribe({
      next: () => {
        this.recentIssuances = this.inventoryService.getRecentFarmerAllocations()
          .map(r => this.allocationToIssuance(r));
        this.resetForm();
        this.toastService.success('Input issued to farmer');
        this.submitting = false;
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.error('Failed to issue input', this.extractErrorMessage(err));
        this.submitting = false;
      },
    });
  }

  // Backend's GlobalExceptionHandler returns { message: "..." } for validation
  // failures (insufficient stock, not found, etc.) — surface that instead of a
  // generic "please try again" that hides the actual reason.
  private extractErrorMessage(err: HttpErrorResponse): string {
    return err.error?.message ?? 'Please try again.';
  }

  cancel(): void {
    this.router.navigate([this.isCooperativeScope ? '/cooperative/inventory/current-stock' : '/branch/inventory/current-stock']);
  }

  trackById(_: number, row: unknown): string {
    return (row as RecentIssuance).id;
  }

  // position:fixed + getBoundingClientRect so the dropdown escapes overflow:hidden parents.
  toggleMenu(id: string, event: MouseEvent): void {
    if (this.activeMenuId === id) {
      this.activeMenuId = null;
      return;
    }
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const dropdownHeight = 90; // approx height of 2 menu items
    const right = window.innerWidth - rect.right;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < dropdownHeight) {
      this.menuPosition = { bottom: window.innerHeight - rect.top + 4, right };
    } else {
      this.menuPosition = { top: rect.bottom + 4, right };
    }
    this.activeMenuId = id;
  }

  openView(row: RecentIssuance): void {
    this.viewingIssuance = row;
    this.activeMenuId = null;
  }

  openEdit(row: RecentIssuance): void {
    this.editingIssuance = { ...row };
    this.editForm = { quantity: row.quantity, value: String(row.value) };
    this.activeMenuId = null;
  }

  closeModals(): void {
    this.viewingIssuance = null;
    this.editingIssuance = null;
  }

  saveEdit(): void {
    if (!this.editingIssuance) return;
    this.recentIssuances = this.recentIssuances.map(r =>
      r.id === this.editingIssuance!.id
        ? { ...r, quantity: this.editForm.quantity, value: Number(this.editForm.value) || r.value }
        : r,
    );
    this.closeModals();
  }

  private loadRecentIssuances(): void {
    if (this.isCooperativeScope) {
      this.recentIssuances = this.inventoryService.getRecentBranchDisbursements()
        .map(r => this.disbursementToIssuance(r));
      this.inventoryService.listBranchDisbursementsForRole$().subscribe(rows => {
        this.recentIssuances = rows.slice(0, 5).map(r => this.disbursementToIssuance(r));
        this.cdr.detectChanges();
      });
    } else {
      this.recentIssuances = this.inventoryService.getRecentFarmerAllocations()
        .map(r => this.allocationToIssuance(r));
      this.inventoryService.listFarmerAllocations().subscribe(rows => {
        this.recentIssuances = rows.slice(0, 5).map(r => this.allocationToIssuance(r));
        this.cdr.detectChanges();
      });
    }
  }

  private disbursementToIssuance(row: BranchDisbursement): RecentIssuance {
    const branchName = this.resolveBranchName(row.branchId, row.branchName);
    return {
      id: row.id,
      farmerName: branchName,
      farmerId: row.branchId,
      initials: this.getInitials(branchName),
      avatarColor: '#533c59',
      item: row.itemName,
      itemCategory: row.itemType,
      quantity: `${row.quantity} ${row.unit}`,
      value: row.totalValue,
      issuedAt: row.issueDate,
      destination: branchName,
    };
  }

  // Backend doesn't resolve branch names (branches live in a different service) —
  // look it up from the branch list this page already fetches.
  private resolveBranchName(branchId: string, fallback: string): string {
    return this.branches.find(b => b.id === branchId)?.name || fallback || branchId;
  }

  private allocationToIssuance(row: FarmerAllocation): RecentIssuance {
    return {
      id: row.id,
      farmerName: row.farmerName,
      farmerId: row.farmerId,
      initials: this.getInitials(row.farmerName),
      avatarColor: '#533c59',
      item: row.itemName,
      itemCategory: row.itemType,
      quantity: `${row.quantity} ${row.unit}`,
      value: row.totalValue,
      issuedAt: row.issueDate,
      destination: row.farmerName,
    };
  }

  // Keeps item + season selected — issuing to several farmers/branches in a
  // row is the common case, and only the recipient + quantity should change
  // between submits. Clearing everything forced a full reselect each time,
  // which just looked like the button was stuck disabled.
  private resetForm(): void {
    this.farmerSearch = '';
    this.selectedFarmer = null;
    this.searchResults = [];
    this.calculatedValue = 0;
    this.form = {
      ...this.form,
      branchId: '',
      quantity: '',
      deductionRate: '',
    };
  }

}
