import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

// All routes that live under /platform — the platform admin's section.
// Registered in app.routes.ts at { path: 'platform', loadChildren: ... }.

export const PLATFORM_ROUTES: Routes = [

  // Default — go straight to the dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Dashboard — everyone authenticated lands here; no extra guard ─────────
  {
    path: 'dashboard',
    title: 'Dashboard | UGAAP',
    // title + subtitle are read by admin-layout topbar via extractRouteData()
    data: { title: 'Platform Dashboard', subtitle: 'System-wide overview of cooperatives, users, and platform health' },
    loadComponent: () =>
      import('./dashboard/platform-dashboard.component')
        .then(m => m.PlatformDashboardComponent),
  },

  // ── Cooperatives ─────────────────────────────────────────────────────────
  {
    path: 'cooperatives',
    title: 'Cooperatives | UGAAP',
    canActivate: [permissionGuard],
    data: { permissions: ['cooperatives.view'] },
    loadComponent: () =>
      import('./cooperatives-list/cooperatives-list.component')
        .then(m => m.CooperativesListComponent),
  },

  // Onboarding wizard — requires explicit onboard permission
  {
    path: 'cooperatives/onboard',
    title: 'Cooperative Onboarding | UGAAP',
    canActivate: [permissionGuard],
    data: { permissions: ['cooperatives.onboard'] },
    loadComponent: () =>
      import('./coop-onboarding/cooperative-onboarding.component')
        .then(m => m.CooperativeOnboardingComponent),
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  {
    path: 'users',
    title: 'User Management | UGAAP',
    canActivate: [permissionGuard],
    data: { permissionModule: 'users' },
    loadChildren: () =>
      import('./user/user.routes').then(m => m.USER_ROUTES),
  },

  // ── Roles ─────────────────────────────────────────────────────────────────
  {
    path: 'roles',
    title: 'Role Management | UGAAP',
    canActivate: [permissionGuard],
    data: { permissionModule: 'roles' },
    loadChildren: () =>
      import('./roles/roles.routes').then(m => m.ROLES_ROUTES),
  },
];
