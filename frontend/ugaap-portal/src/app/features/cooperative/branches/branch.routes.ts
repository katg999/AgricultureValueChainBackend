import { Routes } from '@angular/router';

export const BRANCH_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./branch-dash/branch-dash.component')
            .then(m => m.BranchDashboardComponent)
      },
      {
        path: 'onboarding',
        loadComponent: () =>
          import('./branch-onboarding/branch-onboarding.component')
            .then(m => m.BranchOnboardingComponent)
      },

    
]