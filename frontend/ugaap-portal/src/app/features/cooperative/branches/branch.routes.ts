import { Routes } from '@angular/router';

export const BRANCH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./branch-dash/branch-dash.component')
        .then(m => m.BranchDashboardComponent),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./branch-onboarding/branch-onboarding.component')
        .then(m => m.BranchOnboardingComponent),
  },
  {
    path: 'collections',
    loadChildren: () =>
      import('../../branch/collections/branch.collections.routes')
        .then(m => m.BRANCH_COLLECTIONS_ROUTES),
  },
  {
    path: 'farmers',
    loadChildren: () =>
      import('../../branch/branch-farmers/branch.farmers.routes')
        .then(m => m.BRANCH_FARMERS_ROUTES),
  },
  {
    path: 'finance',
    redirectTo: 'finance/batch-processing',
    pathMatch: 'full',
  },
  {
    path: 'finance/batch-processing',
    loadComponent: () =>
      import('../../branch/finance/batch-processing/batch-processing')
        .then(m => m.BatchProcessingComponent),
  },
  {
    path: 'finance/farmers',
    loadComponent: () =>
      import('../../branch/finance/all-batch-farmers/all-batch-farmers.component')
        .then(m => m.AllBatchFarmersComponent),
  },
  {
    path: 'finance/batch/:id/farmers',
    loadComponent: () =>
      import('../../branch/finance/batch-farmers/batch-farmers.component')
        .then(m => m.BatchFarmersComponent),
  },
  {
    path: 'inventory',
    loadChildren: () =>
      import('../../branch/inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES),
  },
  {
    path: 'daily-grading',
    loadComponent: () =>
      import('../../branch/daily-grading/daily-grading.component')
        .then(m => m.DailyGradingComponent),
  },
];
