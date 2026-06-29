import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

export const BRANCH_COLLECTIONS_ROUTES: Routes = [

  {
    path: '',
    redirectTo: 'deliveries',
    pathMatch: 'full',
  },

  // Delivery list — read access
  {
    path: 'deliveries',
    canActivate: [permissionGuard],
    data: { title: 'Deliveries', permissions: ['collections.view'] },
    loadComponent: () =>
      import('./branch.delivery-list/branch.delivery.list.component')
        .then(m => m.BranchDeliveriesComponent),
  },

  // All farmers who have delivered at this branch
  {
    path: 'farmers',
    canActivate: [permissionGuard],
    data: { title: 'Farmer Deliveries', permissions: ['collections.view'] },
    loadComponent: () =>
      import('./farmer-deliveries-list/farmer-deliveries-list.component')
        .then(m => m.FarmerDeliveriesListComponent),
  },

  // Record new delivery
  {
    path: 'deliveries/add',
    canActivate: [permissionGuard],
    data: { title: 'Record Delivery', permissions: ['collections.record'] },
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.AddFarmerDeliveryComponent),
  },

  // Correct an existing delivery
  {
    path: 'deliveries/edit/:id',
    canActivate: [permissionGuard],
    data: { title: 'Edit Delivery', permissions: ['collections.edit'] },
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.AddFarmerDeliveryComponent),
  },

  // Legacy paths used by the branch dashboard — redirect to canonical routes
  { path: 'farmer-deliveries/create', redirectTo: 'deliveries/add', pathMatch: 'full' },
  { path: 'farmer-delivery/create',   redirectTo: 'deliveries/add', pathMatch: 'full' },
  { path: 'farmer-deliveries',        redirectTo: 'deliveries',     pathMatch: 'full' },

  {
    path: '**',
    redirectTo: 'deliveries',
  },
];
