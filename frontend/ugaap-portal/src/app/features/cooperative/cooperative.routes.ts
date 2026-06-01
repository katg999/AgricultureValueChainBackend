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
    loadComponent: () =>
      import('./configuration/configuration.component')
        .then(m => m.ConfigurationComponent),
  },

  // ── Grade configuration ─────────────────────────────────────────────────────
  {
    path: 'grade-config',
    loadComponent: () =>
      import('./configuration/grade-config/grade-config.component')
        .then(m => m.GradeConfigComponent),
  },
  {
    path: 'grade-config/new',
    loadComponent: () =>
      import('./configuration/grade-form/grade-form.component')
        .then(m => m.GradeFormComponent),
  },
  {
    path: 'grade-config/:id/edit',
    loadComponent: () =>
      import('./configuration/grade-form/grade-form.component')
        .then(m => m.GradeFormComponent),
  },

  // ── Pricing ─────────────────────────────────────────────────────────────────
  {
    path: 'edit-prices',
    loadComponent: () =>
      import('./edit-prices/edit-prices.component')
        .then(m => m.EditPricesComponent),
  },

  // ── Farmers (cooperative-scoped view) ───────────────────────────────────────
  // Shows farmers belonging to this cooperative specifically.
  // The global /farmers route shows a broader list; this one is cooperative-aware.
  {
    path: 'farmers',
    loadComponent: () =>
      import('./farmer-list/farmer-list.component')
        .then(m => m.FarmerListComponent),
  },
  {
    path: 'branches',
    loadComponent: () =>
      import('./branches/branches')
        .then(m => m.Branches),
  },
  {
    path: 'users',
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
    loadChildren: () =>
      import('./collections/collections.routes')
        .then(m => m.COLLECTIONS_ROUTES),
  },
  

  // ── Maker-checker approval flow ─────────────────────────────────────────────
  {
    path: 'maker-checker',
    loadComponent: () =>
      import('../platform/maker-checker-creation/maker-checker-creation.component')
        .then(m => m.MakerCheckerCreationComponent),
  },
  
  {
    path: "farmer-list",
    loadComponent: () =>
      import('../cooperative/farmer-list/farmer-list.component')
        .then(m => m.FarmerListComponent)
  },

  // ── Activation success ──────────────────────────────────────────────────────
  // Shown after a cooperative is successfully activated
  {
    path: 'activation-success',
    loadComponent: () =>
      import('./activation-success/activation-success.component')
        .then(m => m.ActivationSuccessComponent),
  },

  {
    path: 'inventory',
    loadChildren: () =>
      import('./inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES),
  },

  // ── Reports ─────────────────────────────────────────────────────────────────
  {
    path: 'reports',
    loadChildren: () =>
      import('./reports/reports.routes')
        .then(m => m.REPORTS_ROUTES),
  },

  // ── Legacy redirects ────────────────────────────────────────────────────────
  // Old route aliases kept so bookmarks and external links don't 404
  { path: 'grading',  redirectTo: 'grade-config', pathMatch: 'full' },
  { path: 'pricing',  redirectTo: 'edit-prices',  pathMatch: 'full' },
];
