// features/cooperative/collection-hubs/collection-hubs-list/collection-hubs-list.component.ts

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { CollectionHub, HubStatus, CollectionHubsService } from '../collection-hubs.service';

type StatusFilter = 'all' | HubStatus;

@Component({
  selector: 'app-collection-hubs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ModalComponent, HasPermissionDirective, DataTableComponent, CellDirective],
  templateUrl: './collection-hubs-list.component.html',
  styleUrls: ['./collection-hubs-list.component.css'],
})
export class CollectionHubsListComponent implements OnInit {

  private hubsService = inject(CollectionHubsService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly hubs = toSignal(this.hubsService.hubs$, { initialValue: [] as CollectionHub[] });

  readonly filteredHubs = computed<CollectionHub[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    return this.hubs().filter(hub => {
      if (status !== 'all' && hub.status !== status) return false;
      if (!q) return true;
      return [hub.name, hub.hubCode, hub.district, hub.location, hub.branchName,
              ...hub.commodities]
        .some(field => field.toLowerCase().includes(q));
    });
  });

  readonly activeCount = computed(() => this.hubs().filter(h => h.status === 'active').length);

  cols: TableColumn[] = [
    { key: 'hubCode',     header: 'CODE',               class: 'mono' },
    { key: 'name',        header: 'NAME' },
    { key: 'location',    header: 'LOCATION / DISTRICT' },
    { key: 'branchName',  header: 'BRANCH' },
    { key: 'capacity',    header: 'CAPACITY LOAD' },
    { key: 'commodities', header: 'COMMODITIES' },
    { key: 'status',      header: 'STATUS' },
    { key: 'actions',     header: 'ACTIONS' },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.hubsService.list().subscribe({
      error: () => this.toast.error('Failed to load hubs', 'Could not reach the server. Please try again.'),
    });
  }

  // ── Detail modal ──────────────────────────────────────────────────────────────

  showDetailModal = false;
  selectedHub: CollectionHub | null = null;

  showDeleteModal = false;
  hubToDelete: CollectionHub | null = null;

  viewHub(hub: CollectionHub): void {
    this.selectedHub = hub;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedHub = null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  createHub(): void {
    this.router.navigate(['/cooperative/collection-hubs/new']);
  }

  editHub(hub: CollectionHub): void {
    this.router.navigate(['/cooperative/collection-hubs', hub.id, 'edit']);
  }

  confirmDelete(hub: CollectionHub): void {
    this.hubToDelete = hub;
    this.showDeleteModal = true;
    this.showDetailModal = false;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.hubToDelete = null;
  }

  executeDelete(): void {
    if (!this.hubToDelete) return;
    const hub = this.hubToDelete;
    this.closeDeleteModal();
    this.hubsService.delete(hub.id).subscribe({
      next: () => this.toast.success('Hub deleted', `${hub.name} has been removed.`),
      error: () => this.toast.error('Delete failed', `Could not delete ${hub.name}. Please try again.`),
    });
  }

  toggleStatus(hub: CollectionHub): void {
    const next: HubStatus = hub.status === 'active' ? 'inactive' : 'active';
    if (next === 'inactive' && !confirm(
      `Deactivate ${hub.name}? Farmers will no longer be directed to this hub.`)) {
      return;
    }
    this.hubsService.setStatus(hub.id, next).subscribe({
      next: () => this.toast.success(
        next === 'active' ? 'Hub reactivated' : 'Hub deactivated',
        `${hub.name} is now ${next}.`,
      ),
      error: () => this.toast.error('Status update failed', 'Could not update hub status. Please try again.'),
    });
  }

  // ── Template helpers ──────────────────────────────────────────────────────────

  loadPercent(hub: CollectionHub): number {
    if (hub.capacity === 0) return 0;
    return Math.min(Math.round((hub.currentLoad / hub.capacity) * 100), 100);
  }

  loadClass(hub: CollectionHub): string {
    const pct = this.loadPercent(hub);
    if (pct >= 90) return 'load-critical';
    if (pct >= 70) return 'load-warning';
    return 'load-ok';
  }

  trackById(_: number, hub: CollectionHub): string {
    return hub.id;
  }
}
