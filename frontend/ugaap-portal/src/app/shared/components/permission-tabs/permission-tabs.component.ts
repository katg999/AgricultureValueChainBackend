// shared/components/permission-tabs/permission-tabs.component.ts
//
// Tabbed permission picker used by the role forms.
//
// One tab per service (Farmers, Inventory, Users, …) from the central catalog
// in core/constants/permissions.ts. Selecting a tab reveals everything a user
// can do under that service, broken down into granular checkboxes.
//
// API:
//   [scope]       — 'platform' | 'cooperative' | 'branch'; controls which
//                   services appear (a cooperative role form doesn't show
//                   platform-only services like Cooperatives or Settings).
//   [(selected)]  — two-way bound array of granted permission ids,
//                   e.g. ['farmers.view', 'farmers.register'].

import { Component, computed, input, model, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import {
  PermissionScope, PermissionService, catalogForScope,
} from '../../../core/constants/permissions';

@Component({
  selector: 'app-permission-tabs',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './permission-tabs.component.html',
  styleUrls: ['./permission-tabs.component.css'],
})
export class PermissionTabsComponent {

  /** Which area's services to offer */
  readonly scope = input<PermissionScope>('cooperative');

  /** Granted permission ids — two-way bound to the parent form */
  readonly selected = model<string[]>([]);

  /** Key of the service tab currently open */
  readonly activeKey = signal<string | null>(null);

  // ── Derived state ───────────────────────────────────────────────────────────

  /** Services offered for the current scope */
  readonly services = computed<PermissionService[]>(() => catalogForScope(this.scope()));

  /** The service whose permissions are displayed in the panel */
  readonly activeService = computed<PermissionService | null>(() => {
    const services = this.services();
    if (services.length === 0) return null;
    return services.find(s => s.key === this.activeKey()) ?? services[0];
  });

  /** Total selected across all services — for the parent's summary line */
  readonly totalSelected = computed(() => this.selected().length);

  // ── Tab helpers ─────────────────────────────────────────────────────────────

  selectTab(key: string): void {
    this.activeKey.set(key);
  }

  isActive(service: PermissionService): boolean {
    return this.activeService()?.key === service.key;
  }

  /** How many permissions are ticked under one service — drives the tab badge */
  countForService(service: PermissionService): number {
    const granted = new Set(this.selected());
    return service.permissions.filter(p => granted.has(p.id)).length;
  }

  // ── Checkbox helpers ────────────────────────────────────────────────────────

  isChecked(id: string): boolean {
    return this.selected().includes(id);
  }

  toggle(id: string, checked: boolean): void {
    const current = new Set(this.selected());
    checked ? current.add(id) : current.delete(id);
    this.selected.set([...current]);
  }

  isServiceFullySelected(service: PermissionService): boolean {
    const granted = new Set(this.selected());
    return service.permissions.every(p => granted.has(p.id));
  }

  isServicePartiallySelected(service: PermissionService): boolean {
    const n = this.countForService(service);
    return n > 0 && n < service.permissions.length;
  }

  toggleService(service: PermissionService, checked: boolean): void {
    const current = new Set(this.selected());
    service.permissions.forEach(p => checked ? current.add(p.id) : current.delete(p.id));
    this.selected.set([...current]);
  }
}
