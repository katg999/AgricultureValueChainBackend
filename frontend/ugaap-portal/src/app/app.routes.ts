import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
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
  },
  {
    path: 'cooperatives',
    loadChildren: () =>
      import('./features/cooperatives/cooperatives.routes')
        .then(m => m.COOPERATIVES_ROUTES as Routes)
  },


  

];