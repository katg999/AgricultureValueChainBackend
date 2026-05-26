import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router  = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 401:
          session.clearSession();
          router.navigate(['/auth/login']);
          break;
        case 403:
          router.navigate(['/auth/login'], { queryParams: { reason: 'forbidden' } });
          break;
        case 423:
          router.navigate(['/auth/account-locked']);
          break;
        case 0:
          console.error('Network error — check your connection');
          break;
      }
      return throwError(() => err);
    }),
  );
};
