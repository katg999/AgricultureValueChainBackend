import { Routes } from '@angular/router';

export const BRANCH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // Dashboard
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.BranchDashboardComponent),
  },

  // Branch collections
  {
    path: 'collections',
    loadChildren: () =>
      import('./collections/branch.collections.routes')
        .then(m => m.BRANCH_COLLECTIONS_ROUTES),
  },
  {
    path: 'branch-collections',
    redirectTo: 'collections',
    pathMatch: 'full',
  },

  // Branch farmer management
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
  // Branch inventory management
  {
    path: 'inventory',
    loadChildren: () =>
      import('./inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES),
  },
  {
    path: 'daily-grading',
    loadComponent: () =>
      import('./daily-grading/daily-grading.component')
        .then(m => m.DailyGradingComponent),
  },
];
