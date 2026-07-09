import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

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
    canActivate: [permissionGuard],
    data: { permissions: ['roles.view'], title: 'Role Details' },
    loadComponent: () =>
      import('./role-detail/role-detail.component')
        .then(m => m.RoleDetailComponent),
  },

  // Create role
  {
    path: 'role-form',
    title: 'Create Role | UGAAP',
    canActivate: [permissionGuard],
    data: { permissions: ['roles.create'], title: 'Create Role', subtitle: 'Define permissions for a new administrator role' },
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },

  // Edit role
  {
    path: 'role-form/:id',
    title: 'Edit Role | UGAAP',
    canActivate: [permissionGuard],
    data: { permissions: ['roles.edit'], title: 'Edit Role' },
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },
];
