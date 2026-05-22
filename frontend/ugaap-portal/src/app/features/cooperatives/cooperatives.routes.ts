import { Routes } from '@angular/router';

export const COOPERATIVES_ROUTES: Routes = [
 
  {
    path: '',
    loadComponent: () =>
      import('./cooperatives-list/cooperatives-list.component')
        .then(m => m.CooperativesListComponent)
  }
  ,{
    path: 'onboarding',
    loadComponent: () =>
      import('./coop-onboarding/cooperative-onboarding.component')
        .then(m => m.CooperativeOnboardingComponent)
  },
  {
    path: "maker-checker-creation",
    loadComponent: () =>
      import('./maker-checker-creation/maker-checker-creation.component')
        .then(m => m.MakerCheckerCreationComponent)
  }
  
];