import { Routes } from '@angular/router';
export const INVENTORY_ROUTES: Routes = [
  {
    path: 'add-stock-item',
    loadComponent: () =>
      import('./add-stock-item/add-stock-item.component')
        .then(m => m.AddStockItemComponent)
  },
  {
    path: 'current-stock',
    loadComponent: () =>
      import('./current-stock/current-stock.component')
        .then(m => m.CurrentStockComponent)
  },
  {
    path: 'issue-stock',
    loadComponent: () =>
      import('./issue-stock/issue-stock.component')
        .then(m => m.IssueStockComponent)
  },
  {
    path: 'stock-disbursed',
    loadComponent: () =>
      import('./stock-disbursed/stock-disbursed.component')
        .then(m => m.StockDisbursedComponent)
  },
  {
    path: 'request-stock',
    loadComponent: () =>
      import('./request-stock/request-stock.component')
        .then(m => m.RequestStockComponent)
  },
  {
    path: '',
    redirectTo: 'current-stock',
    pathMatch: 'full'
  }
];
