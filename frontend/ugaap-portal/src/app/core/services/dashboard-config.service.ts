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

import { Injectable, computed } from '@angular/core';
import { SessionService } from './session.service';

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
    { label: 'Main',               icon: 'home',     route: '/platform/dashboard'    },
    // { label: 'Organisation Setup', icon: 'building', route: '/platform/cooperatives' },
    // Platform has its own user management at /platform/users (not the global /users)
    { label: 'Users',              icon: 'users',    route: '/platform/users'        },
    // Role & permission management
    { label: 'Roles',              icon: 'roles',    route: '/platform/users/roles-list' },
    // Platform-wide configuration
    { label: 'System Settings',    icon: 'settings', route: '/platform/settings'     },
  ],
};

// Cooperative admin — manages grading, pricing, collections, farmers and users.
// Configuration expands into a submenu; grade-config and edit-prices are the real child screens.
const COOPERATIVE_ADMIN_CONFIG: DashboardConfig = {
  homeRoute: '/cooperative/dashboard',
  navItems: [
    { label: 'Main',               icon: 'home',     route: '/cooperative/dashboard' },
    // Organisation Setup opens the cooperatives management section:
    // cooperatives-list → onboarding → maker-checker (all under /cooperatives/*)
    { label: 'Organisation Setup', icon: 'building', route: '/cooperatives'           },

    // Configuration is a collapsible parent — clicking it reveals grade setup and pricing
    {
      label: 'Configuration',
      icon:  'settings',
      route: '/cooperative/configuration',
      children: [
        { label: 'Grade Config', icon: '', route: '/cooperative/grade-config' },
        { label: 'Edit Prices',  icon: '', route: '/cooperative/edit-prices'  },
      ],
    },

    { label: 'Collection',      icon: 'collection', route: '/cooperative/collections'            },
    
    {label:'Farmers',         icon:'farmers',     route:'/cooperative/farmers' },

    {label:'Branches',         icon:'branch',     route:'/cooperative/branches'               },


    {
      label: 'Finance',
      icon:  'finance',
      route: '/cooperative/finance/batch-processing',
      children: [
        { label: 'Batch Processing', icon: '', route: '/cooperative/finance/batch-processing' },
      ],
    },
    // Inventory is a collapsible parent — clicking it reveals current stock, issue stock and stock disbursed
    {
      label: 'Inventory',
      icon:  'inventory',
      route: '/cooperative/inventory',
      children: [
        { label: 'Current Stock',   icon: '', route: '/cooperative/inventory/current-stock' },
        { label: 'Issue Stock',     icon: '', route: '/cooperative/inventory/issue-stock' },
        { label: 'Stock-disbursed', icon: '', route: '/cooperative/inventory/stock-disbursed' },
      ],
    },

    { label: 'User Management', icon: 'users',      route: '/cooperative/users'                  },

  ],

  

};

// Branch staff — handles daily field operations.
// "Grading stuff is under configuration" — Configuration points to the cooperative
// configuration hub where grade rules and pricing live.
// Daily grading (the actual recording screen) is at /branch/daily-grading.
const BRANCH_CONFIG: DashboardConfig = {
  homeRoute: '/branch/dashboard',
  navItems: [
    { label: 'Main',          icon: 'home',       route: '/branch/dashboard'        },
     { label: 'Collection',    icon: 'collection', route: '/branch/collections'              },
    { label: 'Farmers',       icon: 'farmers',    route: '/branch/farmers'                  },
    
    {
      label: 'Finance',
      icon:  'finance',
      route: '/branch/finance/batch-processing',
      children: [
        { label: 'Batch Processing', icon: '', route: '/branch/finance/batch-processing' },
        { label: 'Batch Farmers',    icon: '', route: '/branch/finance/farmers' },
      ],
    },

    // Inventory is a collapsible parent — clicking it reveals current stock, issue stock and stock disbursed
   {
      label: 'Inventory',
      icon:  'inventory',
      route: '/branch/inventory',
      children: [
        { label: 'Current Stock',   icon: '', route: '/branch/inventory/current-stock' },
        { label: 'Issue Stock',     icon: '', route: '/branch/inventory/issue-stock' },
        { label: 'Stock-disbursed', icon: '', route: '/branch/inventory/stock-disbursed' },
      ],
    },
  ],
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DashboardConfigService {

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

  // ── Role-based computed signals (kept for backward compatibility) ──────────

  /** Config driven by session role — still used by auth guards and redirects */
  readonly config = computed<DashboardConfig>(() =>
    this.getConfig(this.levelForRole(this.session.userRole()))
  );

  readonly homeRoute = computed(() => this.config().homeRoute);
  readonly navItems  = computed(() => this.config().navItems);
}
