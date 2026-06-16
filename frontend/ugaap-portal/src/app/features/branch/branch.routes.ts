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
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.BranchDashboardComponent),
  },

  // ── Collections ──────────────────────────────────────────────────────────────
  // loadChildren loads a whole sub-router (another Routes array), not a single component.
  // This lets collections have its own nested routes (delivery list, farmer delivery, etc.).
  {
    path: 'collections',
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
    // Form to create a new payment batch
    path: 'finance/batch-create',
    loadComponent: () =>
      import('./finance/batch-create/batch-create.component')
        .then(m => m.BatchCreateComponent),
  },
  {
    // The main batch list — where you see all batches, filter by status, take actions
    path: 'finance/batch-processing',
    loadComponent: () =>
      import('./finance/batch-processing/batch-processing')
        .then(m => m.BatchProcessingComponent),
  },
  {
    // All farmers across every batch — useful for a broad overview
    path: 'finance/farmers',
    loadComponent: () =>
      import('./finance/all-batch-farmers/all-batch-farmers.component')
        .then(m => m.AllBatchFarmersComponent),
  },
  {
    // Farmers for ONE specific batch — :id is a URL parameter replaced at runtime
    // e.g. '/branch/finance/batch/BATCH-001/farmers'
    path: 'finance/batch/:id/farmers',
    loadComponent: () =>
      import('./finance/batch-farmers/batch-farmers.component')
        .then(m => m.BatchFarmersComponent),
  },

  // ── Inventory ────────────────────────────────────────────────────────────────
  {
    path: 'inventory',
    loadChildren: () =>
      import('./inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES),
  },

  // ── Daily Grading ────────────────────────────────────────────────────────────
  {
    path: 'daily-grading',
    loadComponent: () =>
      import('./daily-grading/daily-grading.component')
        .then(m => m.DailyGradingComponent),
  },
];
