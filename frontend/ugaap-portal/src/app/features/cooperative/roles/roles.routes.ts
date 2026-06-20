import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },
  {
    path: ':id',
    data: { title: 'Role Detail' },
    loadComponent: () =>
      import('./role-detail/role-detail.component')
        .then(m => m.RoleDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent),
  },
];
