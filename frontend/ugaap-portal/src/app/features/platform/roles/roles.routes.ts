import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [

  {
    path: '',
    title: 'Roles List | UGAAP',
    data: { title: 'Roles & Permissions', subtitle: 'Manage who can do what across the platform' },
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
  },

  {
    path: 'roles-list',
    title: 'Roles List | UGAAP',
    data: { title: 'Roles & Permissions', subtitle: 'Manage who can do what across the platform' },
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
  },

  {
    path: 'role-form',
    title: 'Create Role | UGAAP',
    data: { title: 'Create Role', subtitle: 'Define a new role and its permissions' },
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },

  {
    path: 'role-form/:id',
    title: 'Edit Role | UGAAP',
    data: { title: 'Edit Role', subtitle: 'Update role permissions and settings' },
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },

  {
    path: ':id',
    title: 'Role Details | UGAAP',
    data: { title: 'Role Details', subtitle: 'Users and permissions for this role' },
    loadComponent: () =>
      import('./role-detail/role-detail.component')
        .then(m => m.RoleDetailComponent),
  },

];
