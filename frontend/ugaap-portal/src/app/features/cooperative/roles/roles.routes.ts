import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['roles.view'] },
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
  },
  {
    path: 'create',
    canActivate: [permissionGuard],
    data: { permissions: ['roles.create'] },
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },
  {
    path: ':id',
    canActivate: [permissionGuard],
    data: { title: 'Role Detail', permissions: ['roles.view'] },
    loadComponent: () =>
      import('./role-detail/role-detail.component')
        .then(m => m.RoleDetailComponent),
  },
  {
    path: ':id/edit',
    canActivate: [permissionGuard],
    data: { permissions: ['roles.edit'] },
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },
];
