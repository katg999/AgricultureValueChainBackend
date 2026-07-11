import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'add-stock-item',
    canActivate: [permissionGuard],
    data: { permissions: ['inventory.receive'], title: 'Add Stock Item', subtitle: 'Receive new stock into the branch' },
    loadComponent: () =>
      import('../../branch/inventory/add-stock-item/add-stock-item.component')
        .then(m => m.AddStockItemComponent),
  },
  {
    path: 'current-stock',
    canActivate: [permissionGuard],
    data: { permissions: ['inventory.view'], title: 'Current Stock', subtitle: 'Live stock levels across all branches' },
    loadComponent: () =>
      import('../../branch/inventory/current-stock/current-stock.component')
        .then(m => m.CurrentStockComponent),
  },
  {
    path: 'issue-stock',
    canActivate: [permissionGuard],
    data: { permissions: ['inventory.issue'], title: 'Issue Stock', subtitle: 'Allocate inputs to farmers or branches' },
    loadComponent: () =>
      import('../../branch/inventory/issue-stock/issue-stock.component')
        .then(m => m.IssueStockComponent),
  },
  {
    path: 'stock-disbursed',
    canActivate: [permissionGuard],
    data: { permissions: ['inventory.disburse'], title: 'Stock Disbursed', subtitle: 'History of inputs issued to farmers' },
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
