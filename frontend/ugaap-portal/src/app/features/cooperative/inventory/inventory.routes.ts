import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'add-stock-item',
    loadComponent: () =>
      import('../../branch/inventory/add-stock-item/add-stock-item.component')
        .then(m => m.AddStockItemComponent),
  },
  {
    path: 'current-stock',
    loadComponent: () =>
      import('../../branch/inventory/current-stock/current-stock.component')
        .then(m => m.CurrentStockComponent),
  },
  {
    path: 'issue-stock',
    loadComponent: () =>
      import('../../branch/inventory/issue-stock/issue-stock.component')
        .then(m => m.IssueStockComponent),
  },
  {
    path: 'stock-disbursed',
    loadComponent: () =>
      import('../../branch/inventory/stock-disbursed/stock-disbursed.component')
        .then(m => m.StockDisbursedComponent),
  },
  {
    path: '',
    redirectTo: 'current-stock',
    pathMatch: 'full',
  },
];
