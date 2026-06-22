// core/services/permissions.service.ts
//
// Central permission checker. Everything that needs to know "can this user
// do X?" goes through here — the sidebar, route guards, the *hasPermission
// directive and any component logic.
//
// Sources of truth:
//   • The user's granted permission ids live on the session (AuthUser.permissions).
//   • The full catalog of possible permissions lives in core/constants/permissions.ts.
//
// Full-access rules:
//   • A user holding the "*" wildcard can do everything.
//   • LEGACY: a user whose session carries NO permissions at all is treated as
//     full-access. This keeps existing logins working until the backend starts
//     issuing granular permission ids. Flip TREAT_EMPTY_AS_FULL_ACCESS to false
//     once every login response includes permissions.

import { Injectable, computed, inject } from '@angular/core';
import { SessionService } from './session.service';
import { ALL_PERMISSIONS_WILDCARD } from '../constants/permissions';
// type-only import — avoids a runtime circular dependency, since
// DashboardConfigService injects this service for nav filtering
import type { NavItem } from './dashboard-config.service';

/** Until the backend sends granular permissions, empty = see everything */
const TREAT_EMPTY_AS_FULL_ACCESS = true;

@Injectable({ providedIn: 'root' })
export class PermissionsService {

  private session = inject(SessionService);

  // ── Reactive state ──────────────────────────────────────────────────────────

  /** The raw permission ids granted to the current user */
  readonly granted = computed<string[]>(() => this.session.permissions());

  /** True when the user effectively bypasses permission checks */
  readonly isFullAccess = computed<boolean>(() => {
    const perms = this.granted();
    if (perms.includes(ALL_PERMISSIONS_WILDCARD)) return true;
    return TREAT_EMPTY_AS_FULL_ACCESS && perms.length === 0;
  });

  // ── Checks ──────────────────────────────────────────────────────────────────

  /** True if the user holds this exact permission id (e.g. "farmers.approve") */
  has(permission: string): boolean {
    return this.isFullAccess() || this.granted().includes(permission);
  }

  /** True if the user holds ANY of the given permission ids */
  hasAny(permissions: string[]): boolean {
    if (this.isFullAccess()) return true;
    const granted = this.granted();
    return permissions.some(p => granted.includes(p));
  }

  /** True if the user holds ALL of the given permission ids */
  hasAll(permissions: string[]): boolean {
    if (this.isFullAccess()) return true;
    const granted = this.granted();
    return permissions.every(p => granted.includes(p));
  }

  /**
   * True if the user holds ANY permission under a service module.
   * e.g. hasModule('farmers') matches "farmers.view", "farmers.register", …
   * This is the rule that decides whether "Farmers" appears in the sidebar.
   */
  hasModule(moduleKey: string): boolean {
    if (this.isFullAccess()) return true;
    const prefix = `${moduleKey}.`;
    return this.granted().some(p => p.startsWith(prefix));
  }

  // ── Navigation filtering ────────────────────────────────────────────────────

  /**
   * Returns only the nav items the user may see.
   *
   * Visibility rules per item:
   *   • has children  → children are filtered first; the parent stays only if
   *     at least one child survives.
   *   • permissions[] → visible if the user holds ANY of them.
   *   • permissionModule → visible if the user holds ANY permission under it.
   *   • no tags at all → always visible (e.g. the "Main" home link).
   */
  filterNav(items: NavItem[]): NavItem[] {
    if (this.isFullAccess()) return items;

    const visible: NavItem[] = [];
    for (const item of items) {
      if (item.children?.length) {
        const children = this.filterNav(item.children);
        if (children.length > 0) {
          visible.push({ ...item, children });
        }
        continue;
      }
      if (this.isItemVisible(item)) visible.push(item);
    }
    return visible;
  }

  private isItemVisible(item: NavItem): boolean {
    if (item.permissions?.length) return this.hasAny(item.permissions);
    if (item.permissionModule)    return this.hasModule(item.permissionModule);
    return true;
  }
}
