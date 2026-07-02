import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

// Platform roles management routes.
// Mounted at /platform/roles via platform.routes.ts.

export const ROLES_ROUTES: Routes = [

  // Default — roles list (inherits parent title 'Roles & Permissions')
  {
    path: '',
    title: 'Roles List | UGAAP',
    canActivate: [permissionGuard],
    data: { permissions: ['roles.view'] },
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
  },

  // Canonical list path
  {
    path: 'roles-list',
    title: 'Roles List | UGAAP',
    canActivate: [permissionGuard],
    data: { permissions: ['roles.view'] },
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
  },

  // Role detail
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
