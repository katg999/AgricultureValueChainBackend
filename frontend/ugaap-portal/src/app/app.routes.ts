import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'features/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES)
  },
  {
    path: 'cooperatives',
    loadChildren: () =>
      import('./features/cooperatives/cooperatives.routes')
        .then(m => m.COOPERATIVES_ROUTES)
  },
  
];