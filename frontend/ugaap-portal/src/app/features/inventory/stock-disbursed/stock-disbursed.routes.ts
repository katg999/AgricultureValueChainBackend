import { Routes } from '@angular/router';

export const STOCK_DISBURSED_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./stock-disbursed.component').then(m => m.StockDisbursedComponent),
  },
];
