import { Routes } from '@angular/router';

export const COLLECTIONS_ROUTES: Routes = [
  {
    path: '', // Base path for collections module
    children: [
      // 1. Default redirection to the dashboard list layout
      {
        path: '',
        redirectTo: 'delivery-list',
        pathMatch: 'full'
      },
      
      // 2. The Dashboard List Layout (Accessible via /collections/delivery-list)
      {
        path: 'delivery-list',
        loadComponent: () =>
          import('./delivery-list/delivery-list.component')
            .then(m => m.DeliveryListComponent)
      },

      // 3. The Creation Form Layout (Accessible via /collections/farmer-delivery/create)
      {
        path: 'farmer-delivery/create',
        loadComponent: () =>
          import('./farmer-delivery/farmer-delivery.component')
            .then(m => m.FarmerDeliveryComponent)
      },

      // 4. Read-only delivery detail layout (Accessible via /collections/farmer-delivery/:id)
      {
        path: 'farmer-delivery/:id',
        loadComponent: () =>
          import('./farmer-delivery/farmer-delivery.component')
            .then(m => m.FarmerDeliveryComponent)
      },

      // 5. Editable delivery detail layout (Accessible via /collections/farmer-delivery/:id/edit)
      {
        path: 'farmer-delivery/:id/edit',
        loadComponent: () =>
          import('./farmer-delivery/farmer-delivery.component')
            .then(m => m.FarmerDeliveryComponent)
      }
    ]
  }
];
