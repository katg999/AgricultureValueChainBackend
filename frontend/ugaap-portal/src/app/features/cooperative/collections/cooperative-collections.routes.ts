import { Routes } from '@angular/router';

export const COOPERATIVES_COLLECTIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'delivery-list',
    pathMatch: 'full',
  },
  {
    path: 'delivery-list',
    data: { title: 'Collections' },
    loadComponent: () =>
      import('./delivery-list/delivery.cooperative.list.component')
        .then(m => m.CooperativeDeliveriesComponent),
  },
  {
    path: 'delivery-list/:id/edit',
    loadComponent: () =>
      import('./delivery-list/delivery.cooperative.list.component')
        .then(m => m.CooperativeDeliveriesComponent),
  },
  // Farmer-level drilldown — reached via "View Farmers" on a delivery row.
  // Uses the same FarmerDeliveriesListComponent as the branch view; the
  // ?batch= and ?from=cooperative query params scope the data and back-link.
  {
    path: 'farmers',
    loadComponent: () =>
      import('../../../features/branch/collections/farmer-deliveries-list/farmer-deliveries-list.component')
        .then(m => m.FarmerDeliveriesListComponent),
  },
  {
    path: '**',
    redirectTo: 'delivery-list',
  }
];
