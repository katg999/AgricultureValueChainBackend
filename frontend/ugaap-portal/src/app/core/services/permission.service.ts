// ─────────────────────────────────────────────────────────────────────────────
// core/services/permission.service.ts
//
// Central permission checker for the entire frontend.
//
// HOW IT WORKS (two-layer fallback):
//   1. If the JWT access token contains a non-empty `permissions` array (set by
//      the backend after login), those permissions are used.  This is the normal
//      production path.
//
//   2. If the permissions array is empty (dev mock user, legacy token, or backend
//      not yet issuing granular permissions), the service falls back to the
//      ROLE_PERMISSIONS map defined below — a sensible default for each role.
//
// HOW TO USE IN A COMPONENT:
//   constructor(private perms: PermissionService) {}
//
//   // Show a button only if allowed
//   canApprove = this.perms.can(PERMISSIONS.MEMBERSHIP_APPROVE);
//
//   // Gate a whole section
//   canManageRoles = this.perms.canAny([
//     PERMISSIONS.ACCESS_MANAGEMENT_CREATE,
//     PERMISSIONS.ACCESS_MANAGEMENT_EDIT,
//   ]);
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { Permission, PERMISSIONS, Role, ROLES } from '../constants/permissions';
import { SessionService } from './session.service';

// Role → default permissions map 
// These are the minimum permissions a role gets when the JWT carries no
// explicit permission list.  Adjust to match your business rules.

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

const COOPERATIVE_PERMISSIONS: Permission[] = [
  // Full membership management within their cooperative
  PERMISSIONS.MEMBERSHIP_VIEW,
  PERMISSIONS.MEMBERSHIP_CREATE,
  PERMISSIONS.MEMBERSHIP_EDIT,
  PERMISSIONS.MEMBERSHIP_APPROVE,
  PERMISSIONS.MEMBERSHIP_DELETE,

  // Full branch management
  PERMISSIONS.BRANCHES_VIEW,
  PERMISSIONS.BRANCHES_CREATE,
  PERMISSIONS.BRANCHES_EDIT,
  PERMISSIONS.BRANCHES_APPROVE,
  PERMISSIONS.BRANCHES_DELETE,

  // Full inventory management (stock, grading, pricing, disbursements)
  PERMISSIONS.INVENTORY_VIEW,
  PERMISSIONS.INVENTORY_CREATE,
  PERMISSIONS.INVENTORY_EDIT,
  PERMISSIONS.INVENTORY_APPROVE,
  PERMISSIONS.INVENTORY_DELETE,

  // View and generate reports — cannot approve or delete report configs
  PERMISSIONS.REPORTING_VIEW,
  PERMISSIONS.REPORTING_CREATE,

  // Can manage roles within their cooperative, but not platform-wide
  PERMISSIONS.ACCESS_MANAGEMENT_VIEW,
  PERMISSIONS.ACCESS_MANAGEMENT_CREATE,
  PERMISSIONS.ACCESS_MANAGEMENT_EDIT,
  PERMISSIONS.ACCESS_MANAGEMENT_DELETE,
];

const BRANCH_MANAGER_PERMISSIONS: Permission[] = [
  // Can register and edit farmers; cannot approve or delete
  PERMISSIONS.MEMBERSHIP_VIEW,
  PERMISSIONS.MEMBERSHIP_CREATE,
  PERMISSIONS.MEMBERSHIP_EDIT,

  // Can only view their own branch; cannot create or deactivate branches
  PERMISSIONS.BRANCHES_VIEW,

  // Can manage branch-level stock and issue inputs to farmers
  PERMISSIONS.INVENTORY_VIEW,
  PERMISSIONS.INVENTORY_CREATE,
  PERMISSIONS.INVENTORY_EDIT,

  // Read-only reporting
  PERMISSIONS.REPORTING_VIEW,

  // Can see what roles exist but cannot modify them
  PERMISSIONS.ACCESS_MANAGEMENT_VIEW,
];

const FIELD_AGENT_PERMISSIONS: Permission[] = [
  // Can register new farmers and view existing ones
  PERMISSIONS.MEMBERSHIP_VIEW,
  PERMISSIONS.MEMBERSHIP_CREATE,

  // Read-only access to stock and inventory
  PERMISSIONS.INVENTORY_VIEW,

  // Read-only reporting
  PERMISSIONS.REPORTING_VIEW,

  // Can see their branch but not change anything
  PERMISSIONS.BRANCHES_VIEW,
];

/** Maps every known role string to its default permission set */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Backend full role names (come from the JWT `roles` claim)
  [ROLES.PLATFORM_ADMIN]:    ALL_PERMISSIONS,
  [ROLES.COOPERATIVE_ADMIN]: COOPERATIVE_PERMISSIONS,
  [ROLES.BRANCH_MANAGER]:    BRANCH_MANAGER_PERMISSIONS,
  [ROLES.FIELD_AGENT]:       FIELD_AGENT_PERMISSIONS,

  // Frontend short aliases (used in route guards and the dev mock user)
  [ROLES.PLATFORM]:          ALL_PERMISSIONS,
  [ROLES.COOPERATIVE]:       COOPERATIVE_PERMISSIONS,
  [ROLES.BRANCH]:            BRANCH_MANAGER_PERMISSIONS,
};

// Service 

@Injectable({ providedIn: 'root' })
export class PermissionService {

  constructor(private session: SessionService) {}

  // Core permission checks
  /**
   * Returns true if the current user has the given permission.
   *
   * Checks JWT permissions first; falls back to the role default map when the
   * JWT permissions array is empty (e.g. dev mock user).
   *
   * Example:
   *   if (this.perms.can(PERMISSIONS.MEMBERSHIP_APPROVE)) { ... }
   */
  can(permission: Permission): boolean {
    return this._effectivePermissions().includes(permission);
  }

  /**
   * Returns true if the user has AT LEAST ONE of the given permissions.
   * Use this to show a section that requires any one of several actions.
   *
   * Example: show the Inventory menu if the user can view OR create stock
   *   this.perms.canAny([PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_CREATE])
   */
  canAny(permissions: Permission[]): boolean {
    return permissions.some(p => this.can(p));
  }

  /**
   * Returns true only if the user has ALL of the given permissions.
   * Use this to gate actions that require multiple rights simultaneously.
   *
   * Example: show Save button only if user can both edit AND approve
   *   this.perms.canAll([PERMISSIONS.INVENTORY_EDIT, PERMISSIONS.INVENTORY_APPROVE])
   */
  canAll(permissions: Permission[]): boolean {
    return permissions.every(p => this.can(p));
  }

  //  Role utilities 
  /**
   * Returns the configured default permission set for a given role name.
   * Useful in the role management UI to show what a new role would get.
   *
   * Example:
   *   const defaults = this.perms.getDefaultsForRole('BRANCH_MANAGER');
   */
  getDefaultsForRole(role: Role | string): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
  }

  /**
   * Returns all role names that include the given permission in their defaults.
   * Useful in the permission matrix view to show which roles can do what.
   *
   * Example:
   *   const roles = this.perms.getRolesWithPermission(PERMISSIONS.MEMBERSHIP_APPROVE);
   *   // → ['PLATFORM_ADMIN', 'COOPERATIVE_ADMIN', 'platform', 'cooperative']
   */
  getRolesWithPermission(permission: Permission): string[] {
    return Object.entries(ROLE_PERMISSIONS)
      .filter(([, perms]) => perms.includes(permission))
      .map(([role]) => role);
  }

  /**
   * Returns every permission the current user holds.
   * Useful for building a "my permissions" summary page.
   */
  getMyPermissions(): Permission[] {
    return this._effectivePermissions();
  }

  //  Private helpers 

  /**
   * Resolves which permission set to use.
   * - If the JWT carries permissions → use those (backend is authoritative).
   * - If the JWT permissions array is empty → fall back to role defaults.
   */
  private _effectivePermissions(): Permission[] {
    const fromJwt = this.session.permissions() as Permission[];
    if (fromJwt.length > 0) return fromJwt;

    const role = this.session.userRole();
    return role ? (ROLE_PERMISSIONS[role] ?? []) : [];
  }
}
