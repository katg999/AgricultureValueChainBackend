import { Routes } from '@angular/router';

// All routes that live under /platform — the platform admin's section.
// Registered in app.routes.ts at { path: 'platform', loadChildren: ... }.

export const PLATFORM_ROUTES: Routes = [

  // Default — go straight to the dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/platform-dashboard.component')
        .then(m => m.PlatformDashboardComponent),
  },

  // ── Cooperatives ─────────────────────────────────────────────────────────
  // List of all cooperatives on the platform
  {
    path: 'cooperatives',
    loadComponent: () =>
      import('./cooperatives-list/cooperatives-list.component')
        .then(m => m.CooperativesListComponent),
  },

  // Onboarding wizard — reached via "Add organisation" button
  {
    path: 'cooperatives/onboard',
    loadComponent: () =>
      import('./coop-onboarding/cooperative-onboarding.component')
        .then(m => m.CooperativeOnboardingComponent),
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  // Platform-scoped user management (list, add, details, roles)
  {
    path: 'users',
    loadChildren: () =>
      import('./user/user.routes').then(m => m.USER_ROUTES),
  },
   {
      path: 'roles',
      loadChildren: () =>
        import('./roles/roles.routes').then(m => m.ROLES_ROUTES),


    },

   // ── Maker-checker approval flow ─────────────────────────────────────────────
  {
    path: 'maker-checker',
    loadComponent: () =>
      import('./maker-checker-creation/maker-checker-creation.component')
        .then(m => m.MakerCheckerCreationComponent),
  },
  

  

  // ── System Settings ───────────────────────────────────────────────────────
  // Platform-wide configuration (placeholder — full page to be built)
  // {
  //   path: 'settings',
  //   loadComponent: () =>
  //     import('./settings/platform-settings.component')
  //       .then(m => m.PlatformSettingsComponent),
  // },
];
