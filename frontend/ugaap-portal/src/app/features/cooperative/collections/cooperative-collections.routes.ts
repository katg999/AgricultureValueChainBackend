import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

export const COOPERATIVES_COLLECTIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'delivery-list',
    pathMatch: 'full',
  },
  {
    path: 'delivery-list',
    canActivate: [permissionGuard],
    data: { title: 'Collections', permissions: ['collections.view'] },
    loadComponent: () =>
      import('./delivery-list/delivery.cooperative.list.component')
        .then(m => m.CooperativeDeliveriesComponent),
  },
  {
    path: 'delivery-list/:id/edit',
    canActivate: [permissionGuard],
    data: { permissions: ['collections.edit'], title: 'Edit Delivery' },
    loadComponent: () =>
      import('./delivery-list/delivery.cooperative.list.component')
        .then(m => m.CooperativeDeliveriesComponent),
  },
  {
    path: 'farmers',
    canActivate: [permissionGuard],
    data: { permissions: ['collections.view'], title: 'Farmer Deliveries', subtitle: 'Deliveries grouped by farmer' },
    loadComponent: () =>
      import('../../../features/branch/collections/farmer-deliveries-list/farmer-deliveries-list.component')
        .then(m => m.FarmerDeliveriesListComponent),
  },
  {
    path: '**',
    redirectTo: 'delivery-list',
  }
];
