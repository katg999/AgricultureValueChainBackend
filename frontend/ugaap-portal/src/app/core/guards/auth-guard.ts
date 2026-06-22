import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const user = session.currentUser();
  const token = session.getAccessToken();
  const expired = session.isTokenExpired();

  const hasUser = !!user;
  const hasToken = !!token;
  const tokenValid = !expired;

  if (hasUser && hasToken && tokenValid) {
    return true;
  }

  session.clearSession();
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
