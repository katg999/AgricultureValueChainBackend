import { Routes } from '@angular/router';

export const FARMERS_ROUTES: Routes = [
  {
    path: 'register',
    loadComponent: () =>
      import('./farmer-register/farmer-register.component')
        .then(m => m.FarmerRegisterComponent)
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./farmer-list/farmer-list.component')
        .then(m => m.FarmerListComponent)
  },
  {
    path: 'approval',
    loadComponent: () =>
      import('./farmer-approval/farmer-approval.component')
        .then(m => m.FarmerApprovalComponent)
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
];
