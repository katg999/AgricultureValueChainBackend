import { Routes } from '@angular/router';

export const DELIVERY_CATALOGUE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./delivery-catalogue.component')
        .then(m => m.DeliveryCatalogueComponent)
    }
]