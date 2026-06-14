import { Routes } from '@angular/router';

// Platform-scoped user management routes.
// Mounted at /platform/users via platform.routes.ts → { path: 'users', loadChildren: ... }
// All imports are relative to THIS file's location (features/platform/user/).

export const ROLES_ROUTES: Routes = [

    {
    path: '',
    title: 'Roles List' + ' | UGAAP',
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
   
  },
    // Roles list
  // URL: /platform/roles/roles-list
  {
    path: 'roles-list',
    title: 'Roles List' + ' | UGAAP',
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
      
  },

  // Create role
  // URL: /platform/roles/role-form
  {
    path: 'role-form',
    title: 'Create Role' + ' | UGAAP',
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
      
  },

  // Edit role
  // URL: /platform/roles/role-form/:id
  {
    path: 'role-form/:id',
    title: 'Edit Role' + ' | UGAAP',
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
      
  },

];