import { Routes } from '@angular/router';

// All routes that live under /platform — the platform admin's section.
// Registered in app.routes.ts at { path: 'platform', loadChildren: ... }.

export const PLATFORM_ROUTES: Routes = [

  // Default — go straight to the dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    title: 'Dashboard' + ' | UGAAP',
    loadComponent: () =>
      import('./dashboard/platform-dashboard.component')
        .then(m => m.PlatformDashboardComponent),
   
  },

  // ── Cooperatives ─────────────────────────────────────────────────────────
  // List of all cooperatives on the platform
  {
    path: 'cooperatives',
    title: 'Cooperatives' + ' | UGAAP',
    loadComponent: () =>
      import('./cooperatives-list/cooperatives-list.component')
        .then(m => m.CooperativesListComponent),
     

  },

  // Onboarding wizard — reached via "Add organisation" button
  {
    path: 'cooperatives/onboard',
    title: 'Cooperative Onboarding' + ' | UGAAP',
    loadComponent: () =>
      import('./coop-onboarding/cooperative-onboarding.component')
        .then(m => m.CooperativeOnboardingComponent),
      
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  // Platform-scoped user management (list, add, details, roles)
  {
    path: 'users',
    title: 'User Management' + ' | UGAAP',
    loadChildren: () =>
      import('./user/user.routes').then(m => m.USER_ROUTES),
    
  },
   {
      path: 'roles',
      title: 'Role Management' + ' | UGAAP',
      loadChildren: () =>
        import('./roles/roles.routes').then(m => m.ROLES_ROUTES),
     


    },

   // ── Maker-checker approval flow ─────────────────────────────────────────────
  {
    path: 'maker-checker',
    title: 'Maker-Checker Approvals' + ' | UGAAP',
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
