import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

export const BRANCH_FARMERS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },

  // Farmer list
  {
    path: 'list',
    canActivate: [permissionGuard],
    data: { title: 'Farmers', permissions: ['farmers.view'] },
    loadComponent: () =>
      import('./branch.farmer-list/branch.farmer-list.component').then(
        (m) => m.BranchFarmerListComponent,
      ),
  },

  // Register new farmer
  {
    path: 'register',
    canActivate: [permissionGuard],
    data: { title: 'Register Farmer', permissions: ['farmers.register'] },
    loadComponent: () =>
      import('./branch.farmer-register/branch.farmer-register.component').then(
        (m) => m.BranchFarmerRegisterComponent,
      ),
  },

  // Edit existing farmer
  {
    path: 'register/:id',
    canActivate: [permissionGuard],
    data: { title: 'Edit Farmer', permissions: ['farmers.edit'] },
    loadComponent: () =>
      import('./branch.farmer-register/branch.farmer-register.component').then(
        (m) => m.BranchFarmerRegisterComponent,
      ),
  },

  // Read-only farmer profile (view permission is sufficient)
  {
    path: 'profile/:id',
    canActivate: [permissionGuard],
    data: { title: 'Farmer Profile', permissions: ['farmers.view'] },
    loadComponent: () =>
      import('../../cooperative/farmers/farmer-approval/farmer-approval.component')
        .then(m => m.FarmerApprovalComponent)
  },

  // Legacy dotted paths kept for existing bookmarks.
  { path: 'branch.farmer-list',     redirectTo: 'list',     pathMatch: 'full' },
  { path: 'branch.farmer-register', redirectTo: 'register', pathMatch: 'full' },
];
