// core/guards/permission.guard.ts
//
// Blocks direct URL access to screens the user holds no permission for.
// The sidebar already hides those entries — this guard closes the gap for
// typed URLs, bookmarks and stale links.
//
// Usage on a route:
//   {
//     path: 'farmers',
//     canActivate: [permissionGuard],
//     data: { permissionModule: 'farmers' },          // any "farmers.*" grant
//     // or  data: { permissions: ['farmers.view'] }  // any of these exact ids
//     ...
//   }
//
// Routes without permission data pass through untouched.

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';
import { DashboardConfigService } from '../services/dashboard-config.service';
import { ToastService } from '../services/toast.service';

export const permissionGuard: CanActivateFn = (route) => {
  const permissions = inject(PermissionsService);
  const dashboard   = inject(DashboardConfigService);
  const router      = inject(Router);
  const toast       = inject(ToastService);

  const requiredIds    = route.data?.['permissions'] as string[] | undefined;
  const requiredModule = route.data?.['permissionModule'] as string | undefined;

  const allowed =
    (!requiredIds && !requiredModule) ||                       // untagged route
    (requiredIds?.length ? permissions.hasAny(requiredIds)
      : requiredModule   ? permissions.hasModule(requiredModule)
      : true);

  if (allowed) return true;

  toast.warning('Access denied', 'You do not have permission to view that page.');
  // Send the user to their own area's dashboard instead of the login page
  return router.parseUrl(dashboard.homeRoute());
};
