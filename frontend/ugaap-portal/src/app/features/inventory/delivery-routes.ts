import { Routes } from '@angular/router';

export const DELIVERY_ROUTES: Routes = [
  {
    path: 'new-delivery',
    loadComponent: () =>
      import('./new-delivery/add-new-farmer-delivery.component')
        .then(m => m.AddNewFarmerDeliveryComponent)
  },
  {
    path: 'delivery-catalogue', /* Matched exactly to your router.navigate link */
    loadComponent: () =>
      import('./delivery-catalogue/delivery-catalogue.component')  
        .then(m => m.DeliveryCatalogueComponent)
  },
  {
    path: '', 
    redirectTo: 'new-delivery', 
    pathMatch: 'full'
  }
];