import { Routes } from '@angular/router';

export const BRANCH_COLLECTIONS_ROUTES: Routes = [

  /**
   * /branch/collections
   */
  {
    path: '',
    redirectTo: 'deliveries',
    pathMatch: 'full',
  },

  /**
   * Branch delivery batches
   * Example:
   * - Kampala Central maize collection
   * - Jinja coffee collection
   */
  {
    path: 'deliveries',
    loadComponent: () =>
      import('./branch.delivery-list/branch.delivery.list.component')
        .then(m => m.BranchDeliveriesComponent),
  },

  /**
   * Single branch delivery batch
   * Shows:
   * - aggregate totals
   * - all farmer deliveries under this batch
   */
  {
    path: 'deliveries/:id',
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.FarmerDeliveriesComponent),
  },
  {
    path: 'deliveries/:id/farmer-disbursements',
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.FarmerDeliveriesComponent),
  },

  /**
   * Farmer deliveries workspace without a preselected branch.
   */
  {
    path: 'farmer-deliveries',
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.FarmerDeliveriesComponent),
  },
  {
    path: 'farmer-deliveries/create',
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.FarmerDeliveriesComponent),
  },

  /**
   * Add farmer delivery into a branch delivery batch
   */
  {
    path: 'farmer-deliveries/:id/create',
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.FarmerDeliveriesComponent),
  },

  // Legacy singular aliases used by the branch dashboard.
  { path: 'farmer-delivery/create', redirectTo: 'farmer-deliveries/create', pathMatch: 'full' },
  { path: 'farmer-delivery/:id/create', redirectTo: 'farmer-deliveries/:id/create', pathMatch: 'full' },

  /**
   * Edit farmer delivery
   */
  {
    path: 'farmer-deliveries/:id/edit',
    loadComponent: () =>
      import('./farmer-delivery/farmer-delivery.component')
        .then(m => m.FarmerDeliveriesComponent),
  },

  /**
   * Fallback
   */
  {
    path: '**',
    redirectTo: 'deliveries',
  },
];
