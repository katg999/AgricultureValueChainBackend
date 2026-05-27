import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, switchMap, catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const session = inject(SessionService);
  const auth    = inject(AuthService);

  const token = session.getAccessToken();
  if (!token) return next(req);

  if (session.isTokenExpired()) {
    return auth.refreshToken().pipe(
      switchMap(res => next(addBearer(req, res.accessToken))),
      catchError(err => {
        session.logout();
        return throwError(() => err);
      }),
    );
  }

  return next(addBearer(req, token));
};

function addBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
