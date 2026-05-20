import { Routes } from '@angular/router';

/**
 * USER MANAGEMENT MODULE ROUTES
 * 
 * This module handles all user and role management functionality.
 * Uses lazy loading for better performance.
 */
export const USER_ROUTES: Routes = [
  
  /**
   * Users List (Default route)
   * URL: /users
   */
  {
    path: '',
    loadComponent: () =>
      import('./users-list/users-list.component')
        .then(m => m.UsersListComponent)
  },

  /**
   * Add New User
   * URL: /users/add-user
   */
  {
    path: 'add-user',
    loadComponent: () =>
      import('./add-user/add-user.component')
        .then(m => m.AddUserComponent)
  },

 

  /**
   * User Details with ID parameter
   * URL: /users/user-details/:id
   */
  {
    path: 'user/:id',
    loadComponent: () =>
      import('./user-details/user-details.component')
        .then(m => m.UserDetailsComponent)
  },

  /**
   * Roles List
   * URL: /users/roles-list
   */
  {
    path: 'roles-list',
    loadComponent: () =>
      import('./roles-list/roles-list.component')
        .then(m => m.RolesListComponent)
  },

  /**
   * Create New Role
   * URL: /users/role-form
   */
  {
    path: 'role-form',
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent)
  },

  /**
   * Edit Role
   * URL: /users/role-form/:id
   */
  {
    path: 'role-form/:id',
    loadComponent: () =>
      import('./role-form/role-form.component')
        .then(m => m.RoleFormComponent)
  }
];

/**
 * NAVIGATION EXAMPLES
 * 
 * From TypeScript:
 * - this.router.navigate(['/users'])                     → Users list
 * - this.router.navigate(['/users/add-user'])            → Add user
 * - this.router.navigate(['/users/user/:id'])    → User details
 * - this.router.navigate(['/users/roles-list'])          → Roles list
 * - this.router.navigate(['/users/role-form'])           → Create role
 * - this.router.navigate(['/users/role-form', id])       → Edit role
 */