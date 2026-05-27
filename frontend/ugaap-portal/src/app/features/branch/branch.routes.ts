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
      import('./dashboard/dashboard.component')
        .then(m => m.BranchDashboardComponent),
  },
  {
    path: 'collections',
    loadChildren: () =>
      import('./collections/collections.routes')
        .then(m => m.COLLECTIONS_ROUTES),
  },
  {
    path: 'farmers',
    loadChildren: () =>
      import('./farmers/farmers.routes')
        .then(m => m.FARMERS_ROUTES),
  },
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
