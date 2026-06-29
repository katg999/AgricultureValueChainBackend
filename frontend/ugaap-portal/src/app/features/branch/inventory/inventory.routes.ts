import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'add-stock-item',
    canActivate: [permissionGuard],
    data: { title: 'Add Stock Item', permissions: ['inventory.receive'] },
    loadComponent: () =>
      import('./add-stock-item/add-stock-item.component')
        .then(m => m.AddStockItemComponent)
  },
  {
    path: 'current-stock',
    canActivate: [permissionGuard],
    data: { title: 'Current Stock', permissions: ['inventory.view'] },
    loadComponent: () =>
      import('./current-stock/current-stock.component')
        .then(m => m.CurrentStockComponent)
  },
  {
    path: 'issue-input',
    canActivate: [permissionGuard],
    data: { title: 'Issue Input', permissions: ['inventory.issue'] },
    loadComponent: () =>
      import('./issue-stock/issue-stock.component')
        .then(m => m.IssueStockComponent)
  },
  {
    path: 'stock-disbursed',
    canActivate: [permissionGuard],
    data: { title: 'Stock Disbursed', permissions: ['inventory.disburse'] },
    loadComponent: () =>
      import('./stock-disbursed/stock-disbursed.component')
        .then(m => m.StockDisbursedComponent)
  },
  {
    path: 'request-stock',
    canActivate: [permissionGuard],
    data: { title: 'Request Stock', permissions: ['inventory.request'] },
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
