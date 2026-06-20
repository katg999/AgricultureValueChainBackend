// features/cooperative/collection-hubs/collection-hubs-list/collection-hubs-list.component.ts

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { CollectionHub, HubStatus, CollectionHubsService } from '../collection-hubs.service';

type StatusFilter = 'all' | HubStatus;

@Component({
  selector: 'app-collection-hubs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ModalComponent, HasPermissionDirective, EmptyStateComponent],
  templateUrl: './collection-hubs-list.component.html',
  styleUrls: ['./collection-hubs-list.component.css'],
})
export class CollectionHubsListComponent {

  private hubsService = inject(CollectionHubsService);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly hubs = this.hubsService.hubs;

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

  // ── Detail modal ─────────────────────────────────────────────────────────────
  showDetailModal = false;
  selectedHub: CollectionHub | null = null;

  // ── Delete confirm modal ─────────────────────────────────────────────────────
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

  // ── Actions ──────────────────────────────────────────────────────────────────

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
    const name = this.hubToDelete.name;
    this.hubsService.delete(this.hubToDelete.id);
    this.closeDeleteModal();
    this.toast.success('Hub deleted', `${name} has been removed.`);
  }

  toggleStatus(hub: CollectionHub): void {
    const next: HubStatus = hub.status === 'active' ? 'inactive' : 'active';
    if (next === 'inactive' && !confirm(
      `Deactivate ${hub.name}? Farmers will no longer be directed to this hub.`)) {
      return;
    }
    this.hubsService.setStatus(hub.id, next);
    this.toast.success(
      next === 'active' ? 'Hub reactivated' : 'Hub deactivated',
      `${hub.name} is now ${next}.`,
    );
  }

  // ── Template helpers ─────────────────────────────────────────────────────────

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
