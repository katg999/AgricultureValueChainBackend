import { Routes } from '@angular/router';

export const COOPERATIVES_COLLECTIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'delivery-list',
    pathMatch: 'full',
  },
  {
    path: 'delivery-list',
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
  {
    path: '**',
    redirectTo: 'delivery-list',
  }
];
