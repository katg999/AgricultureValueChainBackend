import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default route redirects to auth module
  {
    path: '',

    loadChildren: () =>
      import('./features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES)
  },
  // Lazy load feature modules
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES as Routes)
  },
  {
    path: 'inventory',
    loadChildren: () =>
      import('./features/inventory/inventory.routes')
        .then(m => m.INVENTORY_ROUTES as Routes)
  },
  // Cooperatives management
  {
    path: 'cooperatives',
    loadChildren: () =>
      import('./features/cooperatives/cooperatives.routes')
        .then(m => m.COOPERATIVES_ROUTES as Routes)
  },
  {
    path: 'inventory',
    loadChildren: () =>
      import('./features/inventory/delivery-routes')
        .then(m => m.DELIVERY_ROUTES)
  },
  

  // User management
  {
    path: 'users',
    loadChildren: () =>
      {
        return import('./features/user/user.routes')
          .then(m => m.USER_ROUTES);
      }
  }

];  
