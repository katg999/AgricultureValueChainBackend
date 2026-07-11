// features/cooperative/cooperative.routes.ts
//
// All routes that live under /cooperative — the cooperative admin's own section.
//
// Separate but related: /cooperatives/* handles the organisation-level views
// (cooperatives list, onboarding wizard, maker-checker) — see cooperatives.routes.ts.
//
// Every component is lazy-loaded so each screen is its own JS chunk.
// Import paths use relative paths from this file's location.

import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

// Permission tagging:
//   data.permissionModule → user needs ANY permission under that service
//   data.permissions      → user needs ANY of these exact ids
// The sidebar hides untagged-for entries; permissionGuard blocks direct URLs.

export const COOPERATIVE_ROUTES: Routes = [

  // Default — go straight to the dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Dashboard ───────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    data: { title: 'Dashboard', subtitle: 'Cooperative performance at a glance' },
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.CooperativeDashboardComponent),
  },

  // ── Cooperative profile (registration, contacts, bank details) ──────────────
  {
    path: 'profile',
    canActivate: [permissionGuard],
    data: { permissionModule: 'organisation', title: 'Cooperative Profile', subtitle: 'Registration details, contacts and bank accounts' },
    loadComponent: () =>
      import('./profile/cooperative-profile.component')
        .then(m => m.CooperativeProfileComponent),
  },

  // ── Configuration hub ───────────────────────────────────────────────────────
  // Landing screen that links to grade-config and edit-prices
  {
    path: 'configuration',
    canActivate: [permissionGuard],
    data: { permissionModule: 'configuration', title: 'Configuration', subtitle: 'Grading standards, pricing, sessions and approval workflows' },
    loadComponent: () =>
      import('./configuration/configuration.component')
        .then(m => m.ConfigurationComponent),
  },

  // ── Grade configuration ─────────────────────────────────────────────────────
  {
    path: 'grade-config',
    canActivate: [permissionGuard],
    data: { permissions: ['configuration.grades.view'], title: 'Grade Configuration', subtitle: 'Define quality grades and set pricing per branch' },
    loadComponent: () =>
      import('./configuration/grade-config/grade-config.component')
        .then(m => m.GradeConfigComponent),
  },
  {
    path: 'grade-config/new',
    canActivate: [permissionGuard],
    data: { permissions: ['configuration.grades.create'], title: 'New Grade' },
    loadComponent: () =>
      import('./configuration/grade-form/grade-form.component')
        .then(m => m.GradeFormComponent),
  },
  {
    path: 'grade-config/:id/edit',
    canActivate: [permissionGuard],
    data: { permissions: ['configuration.grades.edit'], title: 'Edit Grade' },
    loadComponent: () =>
      import('./configuration/grade-form/grade-form.component')
        .then(m => m.GradeFormComponent),
  },

  // ── Sessions Management ──────────────────────────────────────────────────────
  {
    path: 'sessions',
    canActivate: [permissionGuard],
    data: { permissions: ['configuration.sessions.view', 'configuration.sessions.edit'], title: 'Sessions' },
    loadComponent: () =>
      import('./configuration/sessions/sessions-config.component')
        .then(m => m.SessionsConfigComponent),
  },

  // ── Pricing ─────────────────────────────────────────────────────────────────
  {
    path: 'edit-prices',
    canActivate: [permissionGuard],
    data: { permissions: ['configuration.prices.view', 'configuration.prices.edit'], title: 'Cooperative Pricing', subtitle: 'Set commodity prices per grade and branch' },
    loadComponent: () =>
      import('./edit-prices/edit-prices.component')
        .then(m => m.EditPricesComponent),
  },

  // ── Farmers (cooperative-scoped view) ───────────────────────────────────────
  // Shows farmers belonging to this cooperative specifically.
  // The global /farmers route shows a broader list; this one is cooperative-aware.
  {
    path: 'farmers',
    canActivate: [permissionGuard],
    data: { permissionModule: 'farmers', title: 'Farmers', subtitle: 'All farmers registered across your branches' },
    loadComponent: () =>
      import('./farmers/farmer-list/farmer-list.component')
        .then(m => m.FarmerListComponent),
  },
  {
    path: 'farmers/approval/:id',
    canActivate: [permissionGuard],
    data: { permissions: ['farmers.approve', 'farmers.reject'], title: 'Farmer Approval' },
    loadComponent: () =>
      import('./farmers/farmer-approval/farmer-approval.component')
        .then(m => m.FarmerApprovalComponent),
  },
  { path: 'farmers/approval', redirectTo: 'farmers', pathMatch: 'full' },
  {
    path: 'agents',
    canActivate: [permissionGuard],
    data: { permissionModule: 'agents', title: 'Field Agents', subtitle: 'Agents collecting deliveries on behalf of farmers' },
    loadChildren: () =>
      import('./agents/agents.routes')
        .then(m => m.AGENTS_ROUTES),
  },

  // ── Collection Hubs ─────────────────────────────────────────────────────────
  {
    path: 'collection-hubs',
    canActivate: [permissionGuard],
    data: { permissionModule: 'collection_hubs', title: 'Collection Hubs', subtitle: 'Physical collection points across your branches' },
    loadChildren: () =>
      import('./collection-hubs/collection-hubs.routes')
        .then(m => m.COLLECTION_HUBS_ROUTES),
  },
  {
    path: 'branches',
    canActivate: [permissionGuard],
    data: { permissionModule: 'branches', title: 'Branches', subtitle: 'Branch offices and their staff' },
    loadChildren: () =>
      import('./branches/branch.routes')
        .then(m => m.BRANCH_ROUTES),
  },
  {
    path: 'users',
    canActivate: [permissionGuard],
    data: { permissionModule: 'users', title: 'User Management', subtitle: 'Staff accounts and access across your cooperative' },
    loadChildren: () =>
      import('./user/user.routes')
        .then(m => m.USER_ROUTES),
  },

  // ── Cooperative onboarding wizard ───────────────────────────────────────────
  // Multi-step setup wizard — accessible from cooperative admin context
  {
    path: 'onboarding',
    data: { title: 'Cooperative Setup', subtitle: 'Complete your cooperative registration' },
    loadComponent: () =>
      import('../platform/coop-onboarding/cooperative-onboarding.component')
        .then(m => m.CooperativeOnboardingComponent),
  },
  {
    path:'collections',
    canActivate: [permissionGuard],
    data: { permissionModule: 'collections', title: 'Collections', subtitle: 'All deliveries recorded across your branches' },
    loadChildren: () =>
      import('./collections/cooperative-collections.routes')
        .then(m => m.COOPERATIVES_COLLECTIONS_ROUTES),
  },
  

  // ── Maker-checker approval flow ─────────────────────────────────────────────
  
  
  // ── Activation success ──────────────────────────────────────────────────────
  // Shown after a cooperative is successfully activated
  {
    path: 'activation-success',
    data: { title: 'Activation Complete' },
    loadComponent: () =>
      import('./activation-success/activation-success.component')
        .then(m => m.ActivationSuccessComponent),
  },

  // ── Finance ─────────────────────────────────────────────────────────────────
  {
    path: 'finance/batch-processing',
    data: { title: 'Payment Batches', subtitle: 'Review and approve disbursement batches' },
    loadComponent: () =>
      import('./finance/cooperative-finance.component')
        .then(m => m.CooperativeFinanceComponent),
  },
  { path: 'finance', redirectTo: 'finance/batch-processing', pathMatch: 'full' },

  // Read-only, cooperative-wide view of PaymentBatchService's batches (the system
  // branch staff create/process under /branch/finance/*) — separate from the
  // BatchRecord-based Batch Overview page above, which is a different data model.
  {
    path: 'finance/payment-batches',
    data: { title: 'Payment Batches' },
    loadComponent: () =>
      import('./finance/payment-batches/payment-batches.component')
        .then(m => m.CooperativePaymentBatchesComponent),
  },
  {
    path: 'finance/payment-batches/:id/farmers',
    data: { title: 'Batch Farmers' },
    loadComponent: () =>
      import('./finance/payment-batches/payment-batch-farmers/payment-batch-farmers.component')
        .then(m => m.CooperativePaymentBatchFarmersComponent),
  },

  {
    path: 'inventory',
    canActivate: [permissionGuard],
    data: { permissionModule: 'inventory', title: 'Inventory', subtitle: 'Stock and inputs across all branches' },
    loadChildren: () =>
      import('./inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES),
  },

  // ── Roles & Permissions ──────────────────────────────────────────────────────
  {
    path: 'roles',
    canActivate: [permissionGuard],
    data: { permissionModule: 'roles', title: 'Roles & Permissions', subtitle: 'Control what each staff role can see and do' },
    loadChildren: () =>
      import('./roles/roles.routes')
        .then(m => m.ROLES_ROUTES),
  },

  // ── Reports ─────────────────────────────────────────────────────────────────
  {
    path: 'reports',
    canActivate: [permissionGuard],
    data: { permissionModule: 'reports', title: 'Reports', subtitle: 'Analytics and exports for your cooperative' },
    loadChildren: () =>
      import('./reports/reports.routes')
        .then(m => m.REPORTS_ROUTES),
  },

  // ── Bank accounts (placeholder — redirects to profile where bank details live) ──
  { path: 'bank-accounts', redirectTo: 'profile', pathMatch: 'full' },

  // ── Hub redirects — parent nav items that have no dedicated hub page yet ────
  { path: 'organisation-setup', redirectTo: 'profile',  pathMatch: 'full' },
  { path: 'user-management',    redirectTo: 'users',    pathMatch: 'full' },

  // ── Legacy redirects ────────────────────────────────────────────────────────
  { path: 'grading', redirectTo: 'grade-config', pathMatch: 'full' },
  { path: 'pricing', redirectTo: 'edit-prices',  pathMatch: 'full' },
];
