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

  {
    path: 'add-user',
    title: 'Add User | UGAAP',
    data: { title: 'Add User', subtitle: 'Create a new platform user account' },
    loadComponent: () =>
      import('./add-user/add-user.component')
        .then(m => m.AddUserComponent),
  },

  {
    path: 'user/:id',
    title: 'User Details | UGAAP',
    data: { title: 'User Details', subtitle: 'Profile, access history and account settings' },
    loadComponent: () =>
      import('./user-details/user-details.component')
        .then(m => m.UserDetailsComponent),
  },
];
