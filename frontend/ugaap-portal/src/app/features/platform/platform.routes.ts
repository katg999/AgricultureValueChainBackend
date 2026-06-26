import { Routes } from '@angular/router';

// All routes that live under /platform — the platform admin's section.
// Registered in app.routes.ts at { path: 'platform', loadChildren: ... }.

export const PLATFORM_ROUTES: Routes = [

  // Default — go straight to the dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    title: 'Dashboard | UGAAP',
    data: { title: 'Dashboard', subtitle: 'Platform overview and key performance indicators' },
    loadComponent: () =>
      import('./dashboard/platform-dashboard.component')
        .then(m => m.PlatformDashboardComponent),
  },

  // ── Cooperatives ─────────────────────────────────────────────────────────
  {
    path: 'cooperatives',
    title: 'Cooperatives | UGAAP',
    data: { title: 'Cooperatives', subtitle: 'Monitor and manage all registered organisations' },
    loadComponent: () =>
      import('./cooperatives-list/cooperatives-list.component')
        .then(m => m.CooperativesListComponent),
  },

  // Onboarding wizard — reached via "Add organisation" button
  {
    path: 'cooperatives/onboard',
    title: 'Cooperative Onboarding | UGAAP',
    data: { title: 'New Cooperative', subtitle: 'Register a new organisation on the platform' },
    loadComponent: () =>
      import('./coop-onboarding/cooperative-onboarding.component')
        .then(m => m.CooperativeOnboardingComponent),
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  {
    path: 'users',
    title: 'User Management | UGAAP',
    data: { title: 'User Management', subtitle: 'Manage platform users and access rights' },
    loadChildren: () =>
      import('./user/user.routes').then(m => m.USER_ROUTES),
  },

  // ── Roles ─────────────────────────────────────────────────────────────────
  {
    path: 'roles',
    title: 'Role Management | UGAAP',
    data: { title: 'Roles & Permissions', subtitle: 'Manage who can do what across the platform' },
    loadChildren: () =>
      import('./roles/roles.routes').then(m => m.ROLES_ROUTES),
  },

  // ── Maker-checker approval flow ───────────────────────────────────────────
  {
    path: 'maker-checker',
    title: 'Maker-Checker Approvals | UGAAP',
    data: { title: 'Maker-Checker', subtitle: 'Review and approve pending actions' },
    loadComponent: () =>
      import('./maker-checker-creation/maker-checker-creation.component')
        .then(m => m.MakerCheckerCreationComponent),
  },
];
