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
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.CooperativeDashboardComponent),
  },

  // ── Configuration hub ───────────────────────────────────────────────────────
  // Landing screen that links to grade-config and edit-prices
  {
    path: 'configuration',
    canActivate: [permissionGuard],
    data: { permissionModule: 'configuration' },
    loadComponent: () =>
      import('./configuration/configuration.component')
        .then(m => m.ConfigurationComponent),
  },

  // ── Grade configuration ─────────────────────────────────────────────────────
  {
    path: 'grade-config',
    canActivate: [permissionGuard],
    data: { permissions: ['configuration.grades.view'] },
    loadComponent: () =>
      import('./configuration/grade-config/grade-config.component')
        .then(m => m.GradeConfigComponent),
  },
  {
    path: 'grade-config/new',
    canActivate: [permissionGuard],
    data: { permissions: ['configuration.grades.create'] },
    loadComponent: () =>
      import('./configuration/grade-form/grade-form.component')
        .then(m => m.GradeFormComponent),
  },
  {
    path: 'grade-config/:id/edit',
    canActivate: [permissionGuard],
    data: { permissions: ['configuration.grades.edit'] },
    loadComponent: () =>
      import('./configuration/grade-form/grade-form.component')
        .then(m => m.GradeFormComponent),
  },

  // ── Pricing ─────────────────────────────────────────────────────────────────
  {
    path: 'edit-prices',
    canActivate: [permissionGuard],
    data: { permissions: ['configuration.prices.view', 'configuration.prices.edit'] },
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
    data: { permissionModule: 'farmers' },
    loadComponent: () =>
      import('./farmers/farmer-list/farmer-list.component')
        .then(m => m.FarmerListComponent),
  },
  {
    path: 'farmers/approval/:id',
    canActivate: [permissionGuard],
    data: { permissions: ['farmers.approve', 'farmers.reject'] },
    loadComponent: () =>
      import('./farmers/farmer-approval/farmer-approval.component')
        .then(m => m.FarmerApprovalComponent),
  },
  { path: 'farmers/approval', redirectTo: 'farmers', pathMatch: 'full' },
  {
    path: 'branches',

    canActivate: [permissionGuard],
    data: { permissionModule: 'branches' },
// =======
//     loadComponent: () =>
//       import('./farmers/farmer-approval/farmer-approval.component')
//         .then(m => m.FarmerApprovalComponent),
//   },
//   { path: 'farmers/approval', redirectTo: 'farmers', pathMatch: 'full' },
//   {
//     path: 'branches',
// >>>>>>> 82790e03fd252287ef071e22636f2f57993c20ce
    loadChildren:()=>
      import('./branches/branch.routes')
        .then(m => m.BRANCH_ROUTES),
  },
  {
    path: 'users',
    canActivate: [permissionGuard],
    data: { permissionModule: 'users' },
    loadChildren: () =>
      import('./user/user.routes')
        .then(m => m.USER_ROUTES),
  },

  // ── Cooperative onboarding wizard ───────────────────────────────────────────
  // Multi-step setup wizard — accessible from cooperative admin context
  {
    path: 'onboarding',
    loadComponent: () =>
      import('../platform/coop-onboarding/cooperative-onboarding.component')
        .then(m => m.CooperativeOnboardingComponent),
  },
  {
    path:'collections',
    canActivate: [permissionGuard],
    data: { permissionModule: 'collections' },
    loadChildren: () =>
      import('./collections/cooperative-collections.routes')
        .then(m => m.COOPERATIVES_COLLECTIONS_ROUTES),
  },
  

  // ── Maker-checker approval flow ─────────────────────────────────────────────
  
  
  // ── Activation success ──────────────────────────────────────────────────────
  // Shown after a cooperative is successfully activated
  {
    path: 'activation-success',
    loadComponent: () =>
      import('./activation-success/activation-success.component')
        .then(m => m.ActivationSuccessComponent),
  },

  // ── Finance ─────────────────────────────────────────────────────────────────
  {
    path: 'finance/batch-processing',
    loadComponent: () =>
      import('./finance/cooperative-finance.component')
        .then(m => m.CooperativeFinanceComponent),
  },
  { path: 'finance', redirectTo: 'finance/batch-processing', pathMatch: 'full' },

  {
    path: 'inventory',
    canActivate: [permissionGuard],
    data: { permissionModule: 'inventory' },
    loadChildren: () =>
      import('./inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES),
  },

  // ── Roles & Permissions ──────────────────────────────────────────────────────
  {
    path: 'roles',
    canActivate: [permissionGuard],
    data: { permissionModule: 'roles' },
    loadChildren: () =>
      import('./roles/roles.routes')
        .then(m => m.ROLES_ROUTES),
  },

  // ── Reports ─────────────────────────────────────────────────────────────────
  {
    path: 'reports',
    canActivate: [permissionGuard],
    data: { permissionModule: 'reports' },
    loadChildren: () =>
      import('./reports/reports.routes')
        .then(m => m.REPORTS_ROUTES),
  },

  // ── Legacy redirects ────────────────────────────────────────────────────────
  // Old route aliases kept so bookmarks and external links don't 404
  { path: 'grading',  redirectTo: 'grade-config', pathMatch: 'full' },
  { path: 'pricing',  redirectTo: 'edit-prices',  pathMatch: 'full' },
];
