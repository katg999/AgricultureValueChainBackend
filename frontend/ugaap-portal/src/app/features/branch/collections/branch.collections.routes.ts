import { Routes } from '@angular/router';

export const BRANCH_COLLECTIONS_ROUTES: Routes = [

  {
    path: '',
    redirectTo: 'deliveries',
    pathMatch: 'full',
  },

  // Branch delivery batches list
  {
    path: 'deliveries',
    data: { title: 'Deliveries' },
    loadComponent: () =>
      import('./branch.delivery-list/branch.delivery.list.component')
        .then(m => m.BranchDeliveriesComponent),
  },

  // Every farmer who has delivered at this branch
  {
    path: 'farmers',
    data: { title: 'Farmer Deliveries' },
    loadComponent: () =>
      import('./farmer-deliveries-list/farmer-deliveries-list.component')
        .then(m => m.FarmerDeliveriesListComponent),
  },

  // Add farmer delivery (full-page form, navigated to from the branch list button)
  {
    path: 'deliveries/add',
    data: { title: 'Record Delivery' },
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.AddFarmerDeliveryComponent),
  },

  // Edit farmer delivery
  {
    path: 'deliveries/edit/:id',
    data: { title: 'Edit Delivery' },
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.AddFarmerDeliveryComponent),
  },

  // View farmer deliveries for a specific batch
  {
    path: 'deliveries/:id',
    data: { title: 'Delivery Details' },
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.FarmerDeliveriesComponent),
  },
  {
    path: 'deliveries/:id/farmer-disbursements',
    data: { title: 'Farmer Disbursements' },
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.FarmerDeliveriesComponent),
  },

  // Legacy paths used by the branch dashboard — redirect to canonical routes
  { path: 'farmer-deliveries/create', redirectTo: 'deliveries/add', pathMatch: 'full' },
  { path: 'farmer-delivery/create', redirectTo: 'deliveries/add', pathMatch: 'full' },
  { path: 'farmer-deliveries', redirectTo: 'deliveries', pathMatch: 'full' },

  {
    path: '**',
    redirectTo: 'deliveries',
  },
];
