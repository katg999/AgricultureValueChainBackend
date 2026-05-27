import { Routes } from '@angular/router';
// import { authGuard } from './core/guards/auth-guard';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent }  from './layouts/auth-layout/auth-layout.component';

export const routes: Routes = [

  // ── Auth shell (no guard) ──────────────────────────────────────────────
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // Redirect bare root to auth
  { path: '', redirectTo: 'auth', pathMatch: 'full' },

  // ── Protected shell (guarded, all behind AdminLayout) ─────────────────
  {
    path: '',
    component: AdminLayoutComponent,
    // canActivate: [authGuard],
    children: [

      // Platform admin — cooperative management
      {
        path: 'platform',
        loadChildren: () =>
          import('./features/platform/platform.routes').then(m => m.PLATFORM_ROUTES),
      },

      // Cooperative admin — grading & pricing
      {
        path: 'cooperative',
        loadChildren: () =>
          import('./features/cooperative/cooperative.routes').then(m => m.COOPERATIVE_ROUTES),
      },

      // Branch staff — daily grading
      {
        path: 'branch',
        loadChildren: () =>
          import('./features/branch/branch.routes').then(m => m.BRANCH_ROUTES),
      },

      // Cooperative organisation management (list, onboarding, maker-checker)
      {
        path: 'cooperatives',
        loadChildren: () =>
          import('./features/cooperative/cooperative.routes').then(m => m.COOPERATIVE_ROUTES),
      },

      

      // Inventory — shared across cooperative & branch roles
      {
        path: 'inventory',
        loadChildren: () =>
          import('./features/cooperative/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES),
      },

    ],
  },

  // Catch-all
  { path: '**', redirectTo: 'auth' },
];
