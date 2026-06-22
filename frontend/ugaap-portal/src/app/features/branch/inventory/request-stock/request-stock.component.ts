import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ToastService } from '../../../../core/services/toast.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import {
  InventoryService,
  RequestUrgency,
  StockRequest,
  StockRequestPayload,
  StockRequestStatus,
} from '../../../shared-inventory-domain/inventory.service';

type BadgeVariant =
  | 'active' | 'pending' | 'inactive' | 'suspended' | 'overdue' | 'settled'
  | 'partial' | 'verified' | 'failed' | 'draft' | 'open' | 'closed'
  | 'healthy' | 'low' | 'issued' | 'received' | 'info';

interface RequestForm {
  itemName: string;
  category: string;
  unit: string;
  quantity: string;
  urgency: RequestUrgency;
  preferredDeliveryDate: string;
  reason: string;
}

@Component({
  selector: 'app-request-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    CellDirective,
    InputComponent,
    ModalComponent,
    PageHeaderComponent,
    StatCardComponent,
  ],
  templateUrl: './request-stock.component.html',
  styleUrl: './request-stock.component.css',
})
export class RequestStockComponent implements OnInit {
  cols: TableColumn[] = [
    { key: 'itemName',              header: 'ITEM NAME',     class: 'item-name-cell' },
    { key: 'category',              header: 'CATEGORY' },
    { key: 'quantity',              header: 'QTY',           class: 'qty-cell' },
    { key: 'urgency',               header: 'URGENCY' },
    { key: 'submittedAt',           header: 'SUBMITTED',     class: 'date-cell' },
    { key: 'preferredDeliveryDate', header: 'DELIVERY DATE', class: 'date-cell' },
    { key: 'status',                header: 'STATUS' },
    { key: 'actions',               header: 'ACTIONS',       width: '60px' },
  ];

  // ── Form state ────────────────────────────────────────────────────────────
  form: RequestForm = this.emptyForm();
  submitting = false;

  // ── History table state ───────────────────────────────────────────────────
  requests: StockRequest[] = [];
  filteredRequests: StockRequest[] = [];
  searchQuery = '';
  currentPage = 1;
  readonly pageSize = 5;

  // ── Kebab menu state ──────────────────────────────────────────────────────
  openKebabId: string | null = null;
  kebabPosition: { top?: number; bottom?: number; right: number } = { top: 0, right: 0 };

  // ── Modal state ───────────────────────────────────────────────────────────
  showRequestModal = false;
  showDetailModal = false;
  showCancelModal = false;
  selectedRequest: StockRequest | null = null;
  cancellingRequest = false;

  // ── Select options ────────────────────────────────────────────────────────
  readonly categories = ['FERTILIZER', 'SEEDS', 'EQUIPMENT', 'PACKAGING', 'TOOLS'];
  readonly units = ['Bags', 'Kgs', 'Units', 'Sacks', 'Pieces'];
  readonly urgencyOptions: { value: RequestUrgency; label: string }[] = [
    { value: 'low',    label: 'Low'    },
    { value: 'medium', label: 'Medium' },
    { value: 'high',   label: 'High'   },
  ];

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.inventoryService.listStockRequests().subscribe(rows => {
      this.requests = rows;
      this.applyFilters();
    });
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  get totalRequests(): number   { return this.requests.length; }
  get pendingCount(): number    { return this.requests.filter(r => r.status === 'pending').length; }
  get approvedCount(): number   { return this.requests.filter(r => r.status === 'approved' || r.status === 'fulfilled').length; }
  get rejectedCount(): number   { return this.requests.filter(r => r.status === 'rejected').length; }
  get fulfilledCount(): number  { return this.requests.filter(r => r.status === 'fulfilled').length; }

  // ── Pagination ────────────────────────────────────────────────────────────
  get visibleRequests(): StockRequest[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRequests.slice(start, start + this.pageSize);
  }

  get totalFiltered(): number { return this.filteredRequests.length; }
  get totalPages(): number    { return Math.max(Math.ceil(this.totalFiltered / this.pageSize), 1); }
  get visiblePages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  get pageStart(): number {
    return this.totalFiltered === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalFiltered);
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  applyFilters(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredRequests = this.requests.filter(r => {
      if (!q) return true;
      return (
        r.itemName.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.urgency.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  goToPage(page: number): void { this.currentPage = Math.min(Math.max(page, 1), this.totalPages); }
  prevPage(): void { this.goToPage(this.currentPage - 1); }
  nextPage(): void { this.goToPage(this.currentPage + 1); }

  // ── Form actions ──────────────────────────────────────────────────────────
  canSubmit(): boolean {
    return (
      !this.submitting &&
      this.form.itemName.trim().length >= 2 &&
      !!this.form.category &&
      !!this.form.unit &&
      Number(this.form.quantity) >= 1
    );
  }

  submitRequest(): void {
    if (!this.canSubmit()) return;
    this.submitting = true;

    const payload: StockRequestPayload = {
      itemName: this.form.itemName.trim(),
      category: this.form.category,
      unit: this.form.unit,
      quantity: Number(this.form.quantity),
      urgency: this.form.urgency,
      ...(this.form.preferredDeliveryDate && { preferredDeliveryDate: this.form.preferredDeliveryDate }),
      ...(this.form.reason.trim() && { reason: this.form.reason.trim() }),
    };

    // finalize guarantees submitting is reset whether the call succeeds, fails,
    // or the observable completes without emitting (e.g. component destroyed mid-flight).
    this.inventoryService.submitStockRequest(payload)
      .pipe(finalize(() => { this.submitting = false; }))
      .subscribe({
        next: req => {
          this.requests = [req, ...this.requests];
          this.applyFilters();
          this.toastService.success('Stock request submitted to cooperative HQ');
          this.closeRequestModal();
        },
        error: () => {
          this.toastService.error('Failed to submit request', 'Please try again.');
        },
      });
  }

  openRequestModal(): void {
    this.form = this.emptyForm();
    this.showRequestModal = true;
  }

  closeRequestModal(): void {
    this.showRequestModal = false;
    this.form = this.emptyForm();
  }

  // ── Kebab menu ────────────────────────────────────────────────────────────
  @HostListener('document:click')
  onDocumentClick(): void { this.openKebabId = null; }

  // position:fixed dropdown anchored with getBoundingClientRect so it escapes
  // the table's overflow:hidden. Opens upward when there's insufficient space below.
  toggleKebab(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.openKebabId === id) { this.openKebabId = null; return; }
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

  // ── Detail modal ──────────────────────────────────────────────────────────
  onViewDetails(row: StockRequest, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedRequest = row;
    this.showDetailModal = true;
    this.openKebabId = null;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedRequest = null;
  }

  // ── Cancel confirmation modal ─────────────────────────────────────────────
  onCancelRequest(row: StockRequest, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedRequest = row;
    this.showCancelModal = true;
    this.openKebabId = null;
  }

  confirmCancel(): void {
    if (!this.selectedRequest) return;
    this.cancellingRequest = true;

    this.inventoryService.cancelStockRequest(this.selectedRequest.id).subscribe({
      next: () => {
        this.requests = this.requests.filter(r => r.id !== this.selectedRequest!.id);
        this.applyFilters();
        this.toastService.success('Request cancelled');
        this.cancellingRequest = false;
        this.closeCancelModal();
      },
      error: () => {
        this.toastService.error('Failed to cancel request', 'Please try again.');
        this.cancellingRequest = false;
        this.closeCancelModal();
      },
    });
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedRequest = null;
  }

  // ── Badge helpers ─────────────────────────────────────────────────────────
  getStatusVariant(status: StockRequestStatus): BadgeVariant {
    switch (status) {
      case 'pending':   return 'pending';
      case 'approved':  return 'info';
      case 'rejected':  return 'overdue';
      case 'fulfilled': return 'settled';
    }
  }

  getUrgencyVariant(urgency: RequestUrgency): BadgeVariant {
    switch (urgency) {
      case 'low':    return 'settled';
      case 'medium': return 'partial';
      case 'high':   return 'overdue';
    }
  }

  trackById(_: number, row: StockRequest): string { return row.id; }

  get today(): string { return new Date().toISOString().slice(0, 10); }

  private emptyForm(): RequestForm {
    return {
      itemName: '',
      category: 'FERTILIZER',
      unit: 'Bags',
      quantity: '',
      urgency: 'medium',
      preferredDeliveryDate: '',
      reason: '',
    };
  }
}
