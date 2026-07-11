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

  // Add/Edit Farmer Delivery is now an in-page modal on the deliveries list —
  // legacy paths used by the branch dashboard redirect straight to it.
  { path: 'deliveries/add',           redirectTo: 'deliveries',     pathMatch: 'full' },
  { path: 'deliveries/edit/:id',      redirectTo: 'deliveries',     pathMatch: 'full' },
  { path: 'farmer-deliveries/create', redirectTo: 'deliveries',     pathMatch: 'full' },
  { path: 'farmer-delivery/create',   redirectTo: 'deliveries',     pathMatch: 'full' },
  { path: 'farmer-deliveries',        redirectTo: 'deliveries',     pathMatch: 'full' },

  {
    path: '**',
    redirectTo: 'deliveries',
  },
];
