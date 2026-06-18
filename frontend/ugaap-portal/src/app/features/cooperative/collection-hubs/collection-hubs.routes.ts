// features/cooperative/collection-hubs/collection-hubs.routes.ts
//
// Mounted at /cooperative/collection-hubs via cooperative.routes.ts.
// The parent route already applies permissionGuard for the module.

import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

export const COLLECTION_HUBS_ROUTES: Routes = [

  // List — /cooperative/collection-hubs
  {
    path: '',
    loadComponent: () =>
      import('./collection-hubs-list/collection-hubs-list.component')
        .then(m => m.CollectionHubsListComponent),
  },

  // Create — /cooperative/collection-hubs/new
  {
    path: 'new',
    canActivate: [permissionGuard],
    data: { permissions: ['collection_hubs.create'] },
    loadComponent: () =>
      import('./collection-hub-form/collection-hub-form.component')
        .then(m => m.CollectionHubFormComponent),
  },

  // Edit — /cooperative/collection-hubs/:id/edit
  {
    path: ':id/edit',
    canActivate: [permissionGuard],
    data: { permissions: ['collection_hubs.edit'] },
    loadComponent: () =>
      import('./collection-hub-form/collection-hub-form.component')
        .then(m => m.CollectionHubFormComponent),
  },
];
