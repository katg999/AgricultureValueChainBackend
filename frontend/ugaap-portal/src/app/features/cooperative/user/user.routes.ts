import { Routes } from '@angular/router';

// Platform-scoped user management routes.
// Mounted at /platform/users via platform.routes.ts → { path: 'users', loadChildren: ... }
// All imports are relative to THIS file's location (features/platform/user/).

export const USER_ROUTES: Routes = [

  // Default — users list
  // URL: /platform/users
  {
    path: '',
    loadComponent: () =>
      import('./users-list/users-list.component')
        .then(m => m.UsersListComponent),
  },

  // Add new user
  // URL: /platform/users/add-user
  {
    path: 'add-user',
    loadComponent: () =>
      import('./add-user/add-user.component')
        .then(m => m.AddUserComponent),
  },

  // User detail view
  // URL: /platform/users/user/:id
  {
    path: 'user/:id',
    loadComponent: () =>
      import('./user-details/user-details.component')
        .then(m => m.UserDetailsComponent),
  },

  

  // Roles are managed under /cooperative/roles — see cooperative/roles/roles.routes.ts
];
