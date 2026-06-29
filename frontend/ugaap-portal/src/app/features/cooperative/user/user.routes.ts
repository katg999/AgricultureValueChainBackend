import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

export const USER_ROUTES: Routes = [

  // Users list
  {
    path: '',
    canActivate: [permissionGuard],
    data: { permissions: ['users.view'] },
    loadComponent: () =>
      import('./users-list/users-list.component')
        .then(m => m.UsersListComponent),
  },

  // Add new user
  {
    path: 'add-user',
    canActivate: [permissionGuard],
    data: { permissions: ['users.create'] },
    loadComponent: () =>
      import('./add-user/add-user.component')
        .then(m => m.AddUserComponent),
  },

  // User detail view
  {
    path: 'user/:id',
    canActivate: [permissionGuard],
    data: { permissions: ['users.view'] },
    loadComponent: () =>
      import('./user-details/user-details.component')
        .then(m => m.UserDetailsComponent),
  },

  // Roles are managed under /cooperative/roles — see cooperative/roles/roles.routes.ts
];
