import { Routes } from '@angular/router';

export const ISSUE_STOCK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./issue-stock.component')
        .then(m => m.IssueStockComponent),
  },
];
