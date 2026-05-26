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
  },
  {
    path: "farmer-list",
    loadComponent: () =>
      import('./farmers/farmer-list/farmer-list.component')
        .then(m => m.FarmerListComponent)
  },
  
  {
    path: "delivery-list",
    loadComponent: () =>
      import('./delivery-lists/delivery-list/delivery-coop-list.component')
        .then(m => m.BranchDeliveryListComponent)
  }

  
];