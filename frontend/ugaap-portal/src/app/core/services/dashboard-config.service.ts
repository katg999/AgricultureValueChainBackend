// core/services/dashboard-config.service.ts
//
// Single source of truth for role-based navigation.
//
// How routing works here:
//   Each role gets its own DashboardConfig block below.  The service computes
//   the right block reactively from the session signal, so the sidebar updates
//   the moment the logged-in user changes (e.g. after a role-switch in tests).
//
// Adding a new role:
//   1. Add a const config block following the same pattern.
//   2. Add a case to the switch inside DashboardConfigService.config.
//   3. Add any new icon keys to the @switch in sidebar.component.html.
//
// Adding an icon key:
//   The `icon` string is just a lookup key.  The sidebar template maps it to an
//   SVG via @switch.  Add a matching @case there whenever you introduce a new key.

import { Injectable, computed, inject } from '@angular/core';
import { SessionService } from './session.service';
import { PermissionsService } from './permissions.service';

/**
 * Which "area" of the app the user is currently in.
 * Determined by URL prefix in AdminLayoutComponent, NOT by session role.
 * This lets the sidebar show the right menu no matter how the user got there.
 */
export type UserLevel = 'platform' | 'cooperative' | 'branch';

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface NavItem {
  label: string;

  /** Key matched in the sidebar @switch to render an SVG icon */
  icon: string;

  /** Router path — used directly with [routerLink] */
  route: string;

  /** Optional notification count displayed as a coloured pill */
  badge?: number;

  /** Controls the pill colour — defaults to primary (orange) */
  badgeVariant?: 'primary' | 'warning' | 'success' | 'danger';

  /** Child items turn this into a collapsible submenu instead of a direct link */
  children?: NavItem[];

  /**
   * Service module key from core/constants/permissions.ts (e.g. 'farmers').
   * The item shows only if the user holds ANY permission under that module.
   * Leave both permission fields unset for always-visible items (e.g. Main).
   */
  permissionModule?: string;

  /** Exact permission ids — the item shows if the user holds ANY of them */
  permissions?: string[];
}

export interface DashboardConfig {
  homeRoute: string;
  navItems:  NavItem[];
}

// ── Role configs ──────────────────────────────────────────────────────────────
//
// Route reference — where each path resolves in the codebase:
//
//   /platform/cooperatives          → features/platform/cooperative-list
//   /cooperatives                   → features/cooperatives/cooperatives-list
//   /cooperative/dashboard          → features/cooperative/dashboard
//   /cooperative/configuration      → features/cooperative/configuration  (hub)
//   /cooperative/grade-config       → features/cooperative/grade-config
//   /cooperative/edit-prices        → features/cooperative/edit-prices
//   /collections                    → features/collections/delivery-list  (redirect)
//   /farmers                        → features/farmers/farmer-list        (redirect)
//   /users                          → features/user/users-list
//   /inventory/current-stock        → features/inventory/current-stock    (component exists)
//   /branch/dashboard               → features/branch/dashboard
//   /branch/daily-grading           → features/branch/daily-grading

// Platform admin — oversees all cooperatives on the platform.
// The platform landing page is /platform/dashboard.
const PLATFORM_ADMIN_CONFIG: DashboardConfig = {
  homeRoute: '/platform/dashboard',
  navItems: [
    { label: 'Main',               icon: 'home',     route: '/platform/dashboard',       permissionModule: 'dashboard'    },
    // { label: 'Organisation Setup', icon: 'building', route: '/platform/cooperatives' },
    // Platform has its own user management at /platform/users (not the global /users)
    { label: 'Users',              icon: 'users',    route: '/platform/users',           permissionModule: 'users'        },
    // Cooperatives management — list, onboarding, maker-checker (all under /platform/cooperatives/*)
    { label: 'Cooperatives',       icon: 'building', route: '/platform/cooperatives',    permissionModule: 'cooperatives' },

    // Role & permission management
    { label: 'Roles',              icon: 'roles',    route: '/platform/roles/roles-list', permissionModule: 'roles'       },
    // Platform-wide configuration
    { label: 'System Settings',    icon: 'settings', route: '/platform/settings',        permissionModule: 'settings'     },
  ],
};

// Cooperative admin — manages grading, pricing, collections, farmers and users.
// Configuration expands into a submenu; grade-config and edit-prices are the real child screens.
const COOPERATIVE_ADMIN_CONFIG: DashboardConfig = {
  homeRoute: '/cooperative/dashboard',
  navItems: [
    { label: 'Main', icon: 'home', route: '/cooperative/dashboard', permissionModule: 'dashboard' },

    // Organisation Setup — branches, hubs, profile, bank accounts
    {
      label: 'Organisation Setup',
      icon:  'building',
      route: '/cooperative/organisation-setup',
      permissionModule: 'organisation',
      children: [
        { label: 'Organisation Profile', icon: '', route: '/cooperative/profile',        permissions: ['organisation.view']      },
        { label: 'Branches',             icon: '', route: '/cooperative/branches',       permissions: ['branches.view']          },
        { label: 'Collection Hubs',      icon: '', route: '/cooperative/collection-hubs', permissions: ['collection_hubs.view'] },
        { label: 'Bank Accounts',        icon: '', route: '/cooperative/bank-accounts',  permissions: ['organisation.bank.view'] },
      ],
    },

    // Configuration — grade rules and pricing
    // Configuration is a collapsible parent — clicking it reveals grade setup and pricing and sessions
    {
      label: 'Configuration',
      icon:  'settings',
      route: '/cooperative/configuration',
      permissionModule: 'configuration',
      children: [
        { label: 'Grade Config', icon: '', route: '/cooperative/grade-config', permissions: ['configuration.grades.view'] },
        { label: 'Edit Prices',  icon: '', route: '/cooperative/edit-prices',  permissions: ['configuration.prices.view', 'configuration.prices.edit'] },
        { label: 'Sessions',     icon: '', route: '/cooperative/sessions',     permissions: ['configuration.sessions.view', 'configuration.sessions.edit'] },
      ],
    },

    { label: 'Collection', icon: 'collection', route: '/cooperative/collections', permissionModule: 'collections' },

    // Inventory — stock tracking and issuance
    {
      label: 'Inventory',
      icon:  'inventory',
      route: '/cooperative/inventory',
      permissionModule: 'inventory',
      children: [
        { label: 'Current Stock',   icon: '', route: '/cooperative/inventory/current-stock',   permissions: ['inventory.view']    },
        { label: 'Issue Stock',     icon: '', route: '/cooperative/inventory/issue-stock',     permissions: ['inventory.issue']   },
        { label: 'Stock-disbursed', icon: '', route: '/cooperative/inventory/stock-disbursed', permissions: ['inventory.disburse'] },
      ],
    },

    // User Management — users, roles, agents and farmers
    {
      label: 'User Management',
      icon:  'users',
      route: '/cooperative/user-management',
      permissionModule: 'users',
      children: [
        { label: 'Users',   icon: '', route: '/cooperative/users',   permissions: ['users.view']   },
        { label: 'Roles',   icon: '', route: '/cooperative/roles',   permissions: ['roles.view']   },
        { label: 'Agents',  icon: '', route: '/cooperative/agents',  permissions: ['agents.view']  },
        { label: 'Farmers', icon: '', route: '/cooperative/farmers', permissions: ['farmers.view'] },
      ],
    },
  



    // Finance — payment batches and batch overview
    {
      label: 'Finance',
      icon:  'finance',
      route: '/cooperative/finance',
      permissionModule: 'finance',
      children: [
        { label: 'Batch Overview',  icon: '', route: '/cooperative/finance/batch-processing', permissions: ['finance.view'] },
        { label: 'Payment Batches', icon: '', route: '/cooperative/finance/payment-batches',  permissions: ['finance.view'] },
      ],
    },
  ],
};

// Branch staff — handles daily field operations.
// "Grading stuff is under configuration" — Configuration points to the cooperative
// configuration hub where grade rules and pricing live.
// Daily grading (the actual recording screen) is at /branch/daily-grading.
const BRANCH_CONFIG: DashboardConfig = {
  homeRoute: '/branch/dashboard',
  navItems: [
    { label: 'Main',          icon: 'home',       route: '/branch/dashboard',   permissionModule: 'dashboard'   },
    { label: 'Collection',    icon: 'collection', route: '/branch/collections', permissionModule: 'collections' },
    { label: 'Farmers',       icon: 'farmers',    route: '/branch/farmers',     permissionModule: 'farmers'     },

    {
      label: 'Finance',
      icon:  'finance',
      route: '/branch/finance/batch-processing',
      permissionModule: 'finance',
      children: [
        { label: 'Batch Processing', icon: '', route: '/branch/finance/batch-processing', permissions: ['finance.view', 'finance.batches.create'] },
        { label: 'Batch Farmers',    icon: '', route: '/branch/finance/farmers',          permissions: ['finance.view'] },
      ],
    },

    // Inventory is a collapsible parent — clicking it reveals current stock, issue stock and stock disbursed
   {
      label: 'Inventory',
      icon:  'inventory',
      route: '/branch/inventory',
      permissionModule: 'inventory',
      children: [
        { label: 'Current Stock',   icon: '', route: '/branch/inventory/current-stock',   permissions: ['inventory.view'] },
        { label: 'Issue Input',     icon: '', route: '/branch/inventory/issue-input',     permissions: ['inventory.issue'] },
        { label: 'Stock-disbursed', icon: '', route: '/branch/inventory/stock-disbursed', permissions: ['inventory.disburse'] },
        { label: 'Request Stock',   icon: '', route: '/branch/inventory/request-stock',   permissions: ['inventory.request'] },
      ],
    },
  ],
};

// Service 

@Injectable({ providedIn: 'root' })
export class DashboardConfigService {

  /** Injected lazily via inject() to keep the ctor signature stable */
  private permissions = inject(PermissionsService);

  constructor(private session: SessionService) {}

  // ── URL-based lookup (primary — called by AdminLayoutComponent) ───────────

  /**
   * Returns the full config for a given area level.
   * AdminLayoutComponent derives the level from the current URL prefix
   * and calls this to get the nav items for that area.
   */
  getConfig(level: UserLevel): DashboardConfig {
    switch (level) {
      case 'platform':    return PLATFORM_ADMIN_CONFIG;
      case 'cooperative': return COOPERATIVE_ADMIN_CONFIG;
      case 'branch':      return BRANCH_CONFIG;
    }
  }

  /**
   * Maps a session role string to a UserLevel.
   * Used as a fallback when the URL alone can't determine the area
   * (e.g. shared routes like /collections, /farmers, /users).
   */
  levelForRole(role: string | null): UserLevel {
    switch (role) {
      case 'platform_admin':    return 'platform';
      case 'cooperative_admin': return 'cooperative';
      case 'branch':            return 'branch';
      default:                  return 'branch';
    }
  }

  // ── Permission-aware landing route ──────────────────────────────────────────

  /**
   * First route the user can actually open in the given area, derived from
   * the permission-filtered nav. A user without dashboard access lands on
   * their first permitted section instead; /profile is the final fallback
   * since every authenticated user can open it.
   */
  landingRoute(level: UserLevel): string {
    const visible = this.permissions.filterNav(this.getConfig(level).navItems);
    const first = visible[0];
    if (!first) return '/profile';
    return first.children?.length ? first.children[0].route : first.route;
  }

  // ── Role-based computed signals (kept for backward compatibility) ──────────

  /** Config driven by session role — still used by auth guards and redirects */
  readonly config = computed<DashboardConfig>(() =>
    this.getConfig(this.levelForRole(this.session.userRole()))
  );

  /**
   * Where to send the user after login or a denied navigation.
   * Permission-aware: tracks both the session role and granted permissions.
   */
  readonly homeRoute = computed(() =>
    this.landingRoute(this.levelForRole(this.session.userRole()))
  );

  readonly navItems  = computed(() => this.config().navItems);
}
