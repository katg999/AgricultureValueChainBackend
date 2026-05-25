import { Routes } from '@angular/router';

export const ADD_NEW_FARMER_DELIVERY_ROUTES: Routes = [
  {
    path: '',
    title: 'Add New Farmer Delivery | Inventory Management',
    loadComponent: () => import('./add-new-farmer-delivery.component')
      .then(m => m.AddNewFarmerDeliveryComponent)
  }
];
