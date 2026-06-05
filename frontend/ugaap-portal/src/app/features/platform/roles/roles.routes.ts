import { Routes } from '@angular/router';

// Platform-scoped user management routes.
// Mounted at /platform/users via platform.routes.ts → { path: 'users', loadChildren: ... }
// All imports are relative to THIS file's location (features/platform/user/).

export const ROLES_ROUTES: Routes = [

    {
    path: '',
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
  },
    // Roles list
  // URL: /platform/roles/roles-list
  {
    path: 'roles-list',
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
  },

  // Create role
  // URL: /platform/roles/role-form
  {
    path: 'role-form',
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },

  // Edit role
  // URL: /platform/roles/role-form/:id
  {
    path: 'role-form/:id',
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },

];