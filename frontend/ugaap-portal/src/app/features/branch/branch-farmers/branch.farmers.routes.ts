import { Routes } from '@angular/router';

export const BRANCH_FARMERS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },

  // Farmer Management (view + edit)
  {
    path: 'list',
    loadComponent: () =>
      import('./branch.farmer-list/branch.farmer-list.component')
        .then(m => m.BranchFarmerListComponent)
  },

  // Farmer Registration (new) and Edit (with :id)
  {
    path: 'register',
    loadComponent: () =>
      import('./branch.farmer-register/branch.farmer-register.component')
        .then(m => m.BranchFarmerRegisterComponent)
  },
  {
    path: 'register/:id',
    loadComponent: () =>
      import('./branch.farmer-register/branch.farmer-register.component')
        .then(m => m.BranchFarmerRegisterComponent)
  },

  // Read-only farmer profile (branch staff view — no approve/reject)
  {
    path: 'profile/:id',
    loadComponent: () =>
      import('../../cooperative/farmers/farmer-approval/farmer-approval.component')
        .then(m => m.FarmerApprovalComponent)
  },

  // Legacy dotted paths kept for existing bookmarks.
  { path: 'branch.farmer-list', redirectTo: 'list', pathMatch: 'full' },
  { path: 'branch.farmer-register', redirectTo: 'register', pathMatch: 'full' },

];
