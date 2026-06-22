import { Routes } from '@angular/router';

// BRANCH_ROUTES defines every page a branch staff member can visit.
// Angular reads this array and decides which component to show based on the URL.
//
// loadComponent / loadChildren use dynamic imports — the component file is only
// downloaded from the server when the user actually navigates to that route.
// This keeps the initial page load fast (lazy loading).
export const BRANCH_ROUTES: Routes = [
  {
    // If someone navigates to just '/branch', send them straight to the dashboard.
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full', // 'full' = only redirect if the path matches EXACTLY (not partially)
  },

  // ── Dashboard ────────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    data: { title: 'Dashboard', subtitle: 'Your branch at a glance' },
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.BranchDashboardComponent),
  },

  // ── Collections ──────────────────────────────────────────────────────────────
  {
    path: 'collections',
    data: { title: 'Collections', subtitle: 'Delivery batches recorded at your branch' },
    loadChildren: () =>
      import('./collections/branch.collections.routes')
        .then(m => m.BRANCH_COLLECTIONS_ROUTES),
  },
  {
    // Old URL alias — if anything still links to 'branch-collections', redirect silently.
    path: 'branch-collections',
    redirectTo: 'collections',
    pathMatch: 'full',
  },

  // ── Farmers ──────────────────────────────────────────────────────────────────
  {
    path: 'farmers',
    data: { title: 'Farmers', subtitle: 'Farmers registered at your branch' },
    loadChildren: () =>
      import('./branch-farmers/branch.farmers.routes')
        .then(m => m.BRANCH_FARMERS_ROUTES),
  },
  {
    path: 'branch-farmers',
    redirectTo: 'farmers',
    pathMatch: 'full',
  },

  // ── Finance ──────────────────────────────────────────────────────────────────
  // Finance doesn't use loadChildren because each page is a standalone component.
  // We just flatten the routes here instead of a separate routes file.
  {
    // '/branch/finance' alone → redirect to the batch list
    path: 'finance',
    redirectTo: 'finance/batch-processing',
    pathMatch: 'full',
  },
  {
    path: 'finance/batch-create',
    data: { title: 'Create Batch' },
    loadComponent: () =>
      import('./finance/batch-create/batch-create.component')
        .then(m => m.BatchCreateComponent),
  },
  {
    path: 'finance/batch-processing',
    data: { title: 'Payment Batches', subtitle: 'Batch farmer payments for disbursement' },
    loadComponent: () =>
      import('./finance/batch-processing/batch-processing')
        .then(m => m.BatchProcessingComponent),
  },
  {
    path: 'finance/farmers',
    data: { title: 'Batch Farmers' },
    loadComponent: () =>
      import('./finance/all-batch-farmers/all-batch-farmers.component')
        .then(m => m.AllBatchFarmersComponent),
  },
  {
    path: 'finance/batch/:id/farmers',
    data: { title: 'Batch Farmers' },
    loadComponent: () =>
      import('./finance/batch-farmers/batch-farmers.component')
        .then(m => m.BatchFarmersComponent),
  },

  // ── Inventory ────────────────────────────────────────────────────────────────
  {
    path: 'inventory',
    data: { title: 'Inventory', subtitle: 'Inputs and stock at your branch' },
    loadChildren: () =>
      import('./inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES),
  },

  // ── Daily Grading ────────────────────────────────────────────────────────────
  {
    path: 'daily-grading',
    data: { title: 'Daily Grading', subtitle: 'Record graded produce for today' },
    loadComponent: () =>
      import('./daily-grading/daily-grading.component')
        .then(m => m.DailyGradingComponent),
  },
];
