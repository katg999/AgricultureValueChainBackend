import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reports-dashboard/reports-dashboard.component')
        .then(m => m.ReportsDashboardComponent),
  },
  {
    path: 'custom-report-view',
    data: { title: 'Custom Report' },
    loadComponent: () =>
      import('./custom-report-view/custom-report-view.component')
        .then(m => m.CustomReportViewComponent),
  },
];
