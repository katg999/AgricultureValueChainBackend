import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES)
  },
  {
    path: 'current-stock',
    loadChildren: () =>
      import('./features/inventory/current-stock/current-stock.routes')
        .then(m => m.CURRENT_STOCK_ROUTES)
  },
  {
    path: 'stock-disbursed',
    loadChildren: () =>
      import('./features/inventory/stock-disbursed/stock-disbursed.routes')
        .then(m => m.STOCK_DISBURSED_ROUTES)
  },
  {
    path: 'issue-stock',
    loadChildren: () =>
      import('./features/inventory/issue-stock/issue-stock.routes')
        .then(m => m.ISSUE_STOCK_ROUTES)
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  }
];
