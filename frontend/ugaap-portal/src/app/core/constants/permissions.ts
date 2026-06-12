// ─────────────────────────────────────────────────────────────────────────────
// core/constants/permissions.ts
//
// Single source of truth for every permission string in the system.
// Format mirrors the Java Permission enum exactly: MODULE:ACTION
// so strings from the backend JWT drop straight in without translation.
//
// Usage in a component:
//   import { PERMISSIONS } from '@core/constants/permissions';
//   this.permissionService.can(PERMISSIONS.MEMBERSHIP_APPROVE)
// ─────────────────────────────────────────────────────────────────────────────

// ── Permission action constants ───────────────────────────────────────────────

export const PERMISSIONS = {

  // ── MEMBERSHIP ───────────────────────────────────────────────────────────────
  // Covers: users, farmers, cooperative members, branch members
  MEMBERSHIP_VIEW:    'MEMBERSHIP:VIEW',
  MEMBERSHIP_CREATE:  'MEMBERSHIP:CREATE',
  MEMBERSHIP_EDIT:    'MEMBERSHIP:EDIT',
  MEMBERSHIP_APPROVE: 'MEMBERSHIP:APPROVE',
  MEMBERSHIP_DELETE:  'MEMBERSHIP:DELETE',

  // ── BRANCHES ─────────────────────────────────────────────────────────────────
  // Covers: creating, editing, and deactivating branch offices
  BRANCHES_VIEW:    'BRANCHES:VIEW',
  BRANCHES_CREATE:  'BRANCHES:CREATE',
  BRANCHES_EDIT:    'BRANCHES:EDIT',
  BRANCHES_APPROVE: 'BRANCHES:APPROVE',
  BRANCHES_DELETE:  'BRANCHES:DELETE',

  // ── INVENTORY ────────────────────────────────────────────────────────────────
  // Covers: stock levels, disbursements to farmers, issue stock, grading, pricing
  INVENTORY_VIEW:    'INVENTORY:VIEW',
  INVENTORY_CREATE:  'INVENTORY:CREATE',
  INVENTORY_EDIT:    'INVENTORY:EDIT',
  INVENTORY_APPROVE: 'INVENTORY:APPROVE',
  INVENTORY_DELETE:  'INVENTORY:DELETE',

  // ── REPORTING ────────────────────────────────────────────────────────────────
  // Covers: viewing, exporting, and scheduling any report in the platform
  REPORTING_VIEW:    'REPORTING:VIEW',
  REPORTING_CREATE:  'REPORTING:CREATE',
  REPORTING_EDIT:    'REPORTING:EDIT',
  REPORTING_APPROVE: 'REPORTING:APPROVE',
  REPORTING_DELETE:  'REPORTING:DELETE',

  // ── ACCESS MANAGEMENT ────────────────────────────────────────────────────────
  // Covers: creating/editing roles, assigning permissions, managing users' access
  ACCESS_MANAGEMENT_VIEW:    'ACCESS_MANAGEMENT:VIEW',
  ACCESS_MANAGEMENT_CREATE:  'ACCESS_MANAGEMENT:CREATE',
  ACCESS_MANAGEMENT_EDIT:    'ACCESS_MANAGEMENT:EDIT',
  ACCESS_MANAGEMENT_APPROVE: 'ACCESS_MANAGEMENT:APPROVE',
  ACCESS_MANAGEMENT_DELETE:  'ACCESS_MANAGEMENT:DELETE',

} as const;

/** Strongly-typed union of every valid permission string */
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ── Role name constants ───────────────────────────────────────────────────────
// Full names match the backend Role.name field stored in the database.
// Short aliases match the role strings used in the frontend (session, routes).

export const ROLES = {
  // Full backend role names (come back in the JWT `roles` claim)
  PLATFORM_ADMIN:    'PLATFORM_ADMIN',
  COOPERATIVE_ADMIN: 'COOPERATIVE_ADMIN',
  BRANCH_MANAGER:    'BRANCH_MANAGER',
  FIELD_AGENT:       'FIELD_AGENT',

  // Short aliases used in frontend route guards and the dev mock user
  PLATFORM:          'platform',
  COOPERATIVE:       'cooperative',
  BRANCH:            'branch',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
