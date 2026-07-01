import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

// BRANCH_ROUTES defines every page a branch staff member can visit.
export const BRANCH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // ── Dashboard — no guard; every authenticated branch user sees their dashboard
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
    canActivate: [permissionGuard],
    data: { title: 'Collections', subtitle: 'Delivery batches recorded at your branch', permissionModule: 'collections' },
    loadChildren: () =>
      import('./collections/branch.collections.routes')
        .then(m => m.BRANCH_COLLECTIONS_ROUTES),
  },
  {
    path: 'branch-collections',
    redirectTo: 'collections',
    pathMatch: 'full',
  },

  // ── Farmers ──────────────────────────────────────────────────────────────────
  {
    path: 'farmers',
    canActivate: [permissionGuard],
    data: { title: 'Farmers', subtitle: 'Farmers registered at your branch', permissionModule: 'farmers' },
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
  {
    path: 'finance',
    redirectTo: 'finance/batch-processing',
    pathMatch: 'full',
  },
  {
    path: 'finance/batch-create',
    canActivate: [permissionGuard],
    data: { title: 'Create Batch', permissions: ['finance.batches.create'] },
    loadComponent: () =>
      import('./finance/batch-create/batch-create.component')
        .then(m => m.BatchCreateComponent),
  },
  {
    path: 'finance/batch-processing',
    canActivate: [permissionGuard],
    data: { title: 'Payment Batches', subtitle: 'Batch farmer payments for disbursement', permissions: ['finance.view', 'finance.batches.create'] },
    loadComponent: () =>
      import('./finance/batch-processing/batch-processing')
        .then(m => m.BatchProcessingComponent),
  },
  {
    path: 'finance/farmers',
    canActivate: [permissionGuard],
    data: { title: 'Batch Farmers', permissions: ['finance.view'] },
    loadComponent: () =>
      import('./finance/all-batch-farmers/all-batch-farmers.component')
        .then(m => m.AllBatchFarmersComponent),
  },
  {
    path: 'finance/batch/:id/farmers',
    canActivate: [permissionGuard],
    data: { title: 'Batch Farmers', permissions: ['finance.view'] },
    loadComponent: () =>
      import('./finance/batch-farmers/batch-farmers.component')
        .then(m => m.BatchFarmersComponent),
  },

  // ── Inventory ────────────────────────────────────────────────────────────────
  {
    path: 'inventory',
    canActivate: [permissionGuard],
    data: { title: 'Inventory', subtitle: 'Inputs and stock at your branch', permissionModule: 'inventory' },
    loadChildren: () =>
      import('./inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES),
  },

  // ── Daily Grading ────────────────────────────────────────────────────────────
  {
    path: 'daily-grading',
    canActivate: [permissionGuard],
    data: { title: 'Daily Grading', subtitle: 'Record graded produce for today', permissions: ['collections.grade'] },
    loadComponent: () =>
      import('./daily-grading/daily-grading.component')
        .then(m => m.DailyGradingComponent),
  },
];
