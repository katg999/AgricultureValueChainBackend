import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

// Routes for cooperative-level branch views (viewing/managing a specific branch).
export const BRANCH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // Branch detail view — opened from the Branch Network Overview table
  {
    path: ':id/detail',
    canActivate: [permissionGuard],
    data: { permissions: ['branches.view'], title: 'Branch Detail' },
    loadComponent: () =>
      import('./branch-detail/branch-detail.component')
        .then(m => m.BranchDetailComponent),
  },

  // Branch dashboard — requires branch view or performance permission
  {
    path: 'dashboard',
    canActivate: [permissionGuard],
    data: { permissions: ['branches.view', 'branches.performance'], title: 'Branch Overview', subtitle: 'Performance and activity for this branch' },
    loadComponent: () =>
      import('./branch-dash/branch-dash.component')
        .then(m => m.BranchDashboardComponent),
  },

  // Onboard a new branch
  {
    path: 'onboarding',
    canActivate: [permissionGuard],
    data: { permissions: ['branches.create'], title: 'New Branch', subtitle: 'Register a new branch office' },
    loadComponent: () =>
      import('./branch-onboarding/branch-onboarding.component')
        .then(m => m.BranchOnboardingComponent),
  },

  // Branch-level collections (viewed by cooperative admin)
  {
    path: 'collections',
    canActivate: [permissionGuard],
    data: { permissionModule: 'collections', title: 'Collections' },
    loadChildren: () =>
      import('../../branch/collections/branch.collections.routes')
        .then(m => m.BRANCH_COLLECTIONS_ROUTES),
  },

  // Branch-level farmers (viewed by cooperative admin)
  {
    path: 'farmers',
    canActivate: [permissionGuard],
    data: { permissionModule: 'farmers', title: 'Farmers' },
    loadChildren: () =>
      import('../../branch/branch-farmers/branch.farmers.routes')
        .then(m => m.BRANCH_FARMERS_ROUTES),
  },

  // Finance
  {
    path: 'finance',
    redirectTo: 'finance/batch-processing',
    pathMatch: 'full',
  },
  {
    path: 'finance/batch-processing',
    canActivate: [permissionGuard],
    data: { permissions: ['finance.view', 'finance.batches.create'], title: 'Payment Batches', subtitle: 'Batch farmer payments for disbursement' },
    loadComponent: () =>
      import('../../branch/finance/batch-processing/batch-processing')
        .then(m => m.BatchProcessingComponent),
  },
  {
    path: 'finance/farmers',
    canActivate: [permissionGuard],
    data: { permissions: ['finance.view'], title: 'Batch Farmers' },
    loadComponent: () =>
      import('../../branch/finance/all-batch-farmers/all-batch-farmers.component')
        .then(m => m.AllBatchFarmersComponent),
  },
  {
    path: 'finance/batch/:id/farmers',
    canActivate: [permissionGuard],
    data: { permissions: ['finance.view'], title: 'Batch Farmers' },
    loadComponent: () =>
      import('../../branch/finance/batch-farmers/batch-farmers.component')
        .then(m => m.BatchFarmersComponent),
  },

  // Inventory
  {
    path: 'inventory',
    canActivate: [permissionGuard],
    data: { permissionModule: 'inventory', title: 'Inventory' },
    loadChildren: () =>
      import('../../branch/inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES),
  },

  // Daily grading
  {
    path: 'daily-grading',
    canActivate: [permissionGuard],
    data: { permissions: ['collections.grade'], title: 'Daily Grading', subtitle: 'Record graded produce for today' },
    loadComponent: () =>
      import('../../branch/daily-grading/daily-grading.component')
        .then(m => m.DailyGradingComponent),
  },
];
