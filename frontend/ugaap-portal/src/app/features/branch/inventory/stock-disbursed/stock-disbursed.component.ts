import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import {
  BranchDisbursement,
  FarmerAllocation,
  InventoryScope,
  InventoryService,
  RecoveryStatus,
} from '../../../shared-inventory-domain/inventory.service';

type BadgeVariant = 'settled' | 'partial' | 'overdue' | 'issued' | 'received' | 'info';
type AllocationStatus = RecoveryStatus | 'issued' | 'received';

interface Allocation {
  id: string;
  destinationName: string;
  destinationId: string;
  farmerName: string;
  branch: string;
  itemName: string;
  itemType: string;
  quantity: string;
  totalValue: number;
  issueDate: string;
  allocationDate: string;
  outstanding: number;
  status: AllocationStatus;
}

interface Summary {
  totalAllocations: number;
  fullyRecovered: number;
  totalValue: number;
  partiallyRecovered: number;
  overdue: number;
  recoveryRate: number;
}


@Component({
  selector: 'app-stock-disbursed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    ModalComponent,
    StatCardComponent,
  ],
  templateUrl: './stock-disbursed.component.html',
  styleUrl: './stock-disbursed.component.css',
})
// Same template, two datasets — scope getter picks the right one based on URL prefix.
export class StockDisbursedComponent implements OnInit {
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 5;

  openKebabId: string | null = null;
  kebabPosition: { top?: number; bottom?: number; right: number } = { top: 0, right: 0 };
  showDetailModal = false;
  showEditModal = false;
  selectedAllocation: Allocation | null = null;
  editForm: { status: AllocationStatus; outstanding: string; quantity: string; totalValue: string } = {
    status: 'settled',
    outstanding: '0',
    quantity: '',
    totalValue: '',
  };

  allocations: Allocation[] = [];

  filteredAllocations: Allocation[] = [];

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly inventoryService: InventoryService,
  ) {}

  get scope(): InventoryScope {
    return this.router.url.startsWith('/cooperative') ? 'cooperative' : 'branch';
  }

  get isCooperativeScope(): boolean {
    return this.scope === 'cooperative';
  }

  get pageTitle(): string {
    return this.isCooperativeScope ? 'Stock Issued to Branches' : 'Stock Allocated to Farmers';
  }

  get pageSubtitle(): string {
    return this.isCooperativeScope
      ? 'Track cooperative stock disbursed to each branch.'
      : 'Track inputs allocated from this branch to farmers.';
  }

  get destinationLabel(): string {
    return this.isCooperativeScope ? 'BRANCH' : 'FARMER NAME';
  }

  get summary(): Summary {
    const totalValue = this.allocations.reduce((sum, row) => sum + row.totalValue, 0);
    const fullyRecovered = this.allocations.filter(row => row.status === 'settled').length;
    const partiallyRecovered = this.allocations.filter(row => row.status === 'partial').length;
    const overdue = this.allocations.filter(row => row.status === 'overdue').length;
    const recoveredValue = this.allocations.reduce(
      (sum, row) => sum + (row.totalValue - row.outstanding),
      0,
    );

    return {
      totalAllocations: this.allocations.length,
      fullyRecovered,
      totalValue,
      partiallyRecovered,
      overdue,
      recoveryRate: totalValue > 0 ? Math.round((recoveredValue / totalValue) * 100) : 0,
    };
  }

  get visibleAllocations(): Allocation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAllocations.slice(start, start + this.pageSize);
  }

  get totalAllocations(): number {
    return this.filteredAllocations.length;
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.totalAllocations / this.pageSize), 1);
  }

  get visiblePages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get pageStart(): number {
    if (this.totalAllocations === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalAllocations);
  }

  ngOnInit(): void {
    const farmerParam = this.route.snapshot.queryParamMap.get('farmer');
    if (farmerParam) {
      this.searchQuery = farmerParam;
    }

    // Both paths map to the same Allocation shape so the template doesn't care which.
    if (this.isCooperativeScope) {
      this.inventoryService.listBranchDisbursementsForRole$().subscribe(rows => {
        this.allocations = rows.map(row => this.fromBranchDisbursement(row));
        this.applyFilters();
      });
      return;
    }

    this.inventoryService.listFarmerAllocations().subscribe(rows => {
      this.allocations = rows.map(row => this.fromFarmerAllocation(row));
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.trim().toLowerCase();

    this.filteredAllocations = this.allocations.filter(row => {
      if (!q) return true;
      return (
        row.destinationName.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.itemName.toLowerCase().includes(q) ||
        row.itemType.toLowerCase().includes(q) ||
        row.branch.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });

    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openKebabId = null;
  }

  // position:fixed + getBoundingClientRect so the dropdown escapes overflow:hidden parents.
  toggleKebab(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.openKebabId === id) {
      this.openKebabId = null;
      return;
    }
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const dropdownHeight = 90;
    const right = window.innerWidth - rect.right;
    if (window.innerHeight - rect.bottom < dropdownHeight) {
      this.kebabPosition = { bottom: window.innerHeight - rect.top + 4, right };
    } else {
      this.kebabPosition = { top: rect.bottom + 4, right };
    }
    this.openKebabId = id;
  }

  onViewDetails(row: Allocation, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedAllocation = row;
    this.showDetailModal = true;
    this.openKebabId = null;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedAllocation = null;
  }

  get statusOptions(): { value: AllocationStatus; label: string }[] {
    return this.isCooperativeScope
      ? [
          { value: 'issued',   label: 'Issued'   },
          { value: 'received', label: 'Received' },
        ]
      : [
          { value: 'partial', label: 'Partial' },
          { value: 'settled', label: 'Settled' },
          { value: 'overdue', label: 'Overdue' },
        ];
  }

  onEditDetails(row: Allocation, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedAllocation = row;
    this.editForm = {
      status: row.status,
      outstanding: String(row.outstanding),
      quantity: row.quantity,
      totalValue: String(row.totalValue),
    };
    this.showEditModal = true;
    this.openKebabId = null;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAllocation = null;
  }

  saveEdit(): void {
    if (!this.selectedAllocation) return;
    const id = this.selectedAllocation.id;
    this.allocations = this.allocations.map(a =>
      a.id === id
        ? {
            ...a,
            status: this.editForm.status,
            outstanding: Number(this.editForm.outstanding) || 0,
            quantity: this.editForm.quantity,
            totalValue: Number(this.editForm.totalValue) || a.totalValue,
          }
        : a,
    );
    this.applyFilters();
    this.closeEditModal();
  }

  getStatusVariant(status: AllocationStatus): BadgeVariant {
    return status;
  }

  trackById(_: number, row: Allocation): string {
    return row.id;
  }

  private fromBranchDisbursement(row: BranchDisbursement): Allocation {
    return {
      id: row.id,
      destinationName: row.branchName,
      destinationId: row.branchId,
      farmerName: row.branchName,
      branch: row.branchName,
      itemName: row.itemName,
      itemType: row.itemType,
      quantity: `${row.quantity} ${row.unit}`,
      totalValue: row.totalValue,
      issueDate: row.issueDate,
      allocationDate: row.issueDate,
      outstanding: 0,
      status: row.status,
    };
  }

  private fromFarmerAllocation(row: FarmerAllocation): Allocation {
    return {
      id: row.id,
      destinationName: row.farmerName,
      destinationId: row.farmerId,
      farmerName: row.farmerName,
      branch: row.branchName,
      itemName: row.itemName,
      itemType: row.itemType,
      quantity: `${row.quantity} ${row.unit}`,
      totalValue: row.totalValue,
      issueDate: row.issueDate,
      allocationDate: row.issueDate,
      outstanding: row.outstanding,
      status: row.status,
    };
  }
}
