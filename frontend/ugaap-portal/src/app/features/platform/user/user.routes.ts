import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

// Platform user management routes.
// Mounted at /platform/users via platform.routes.ts.

export const USER_ROUTES: Routes = [

  // Users list
  {
    path: '',
    title: 'Users List | UGAAP',
    canActivate: [permissionGuard],
    data: { permissions: ['users.view'] },
    loadComponent: () =>
      import('./users-list/users-list.component')
        .then(m => m.UsersListComponent),
  },

  // Add new user
  {
    path: 'add-user',
    title: 'Add User | UGAAP',
    canActivate: [permissionGuard],
    data: { permissions: ['users.create'] },
    loadComponent: () =>
      import('./add-user/add-user.component')
        .then(m => m.AddUserComponent),
  },

  // User detail view
  {
    path: 'user/:id',
    title: 'User | UGAAP',
    canActivate: [permissionGuard],
    data: { permissions: ['users.view'] },
    loadComponent: () =>
      import('./user-details/user-details.component')
        .then(m => m.UserDetailsComponent),
  },
];
