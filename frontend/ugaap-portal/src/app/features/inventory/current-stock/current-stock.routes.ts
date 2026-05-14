import { Routes } from '@angular/router';

export const CURRENT_STOCK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./current-stock.component')
        .then(m => m.CurrentStockComponent)
  }
];
