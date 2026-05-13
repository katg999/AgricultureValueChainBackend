import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inventory/current-stock',
    pathMatch: 'full'
  },
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
  }
  
  
];
