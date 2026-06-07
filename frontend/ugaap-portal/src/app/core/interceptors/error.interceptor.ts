import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const serverMsg: string | undefined = err?.error?.message || err?.error?.error;

      switch (err.status) {
        case 0:
          // Suppress during local dev if no backend is running
          if (!req.url.includes('localhost:8083')) {
            toast.error('No internet connection', 'Check your network and try again.', 8000);
          }
          break;

        case 400:
          toast.error('Invalid request', serverMsg ?? 'Please check your input and try again.');
          break;

        case 401:
          // Only redirect if we actually had a session — avoids redirect loops
          // when backend is unavailable during frontend-only development
          if (session.getAccessToken()) {
            session.clearSession();
            router.navigate(['/auth/login']);
            toast.warning('Session expired', 'Please sign in again.');
          }
          break;

        case 403:
          // Same guard
          if (session.getAccessToken()) {
            router.navigate(['/auth/login'], { queryParams: { reason: 'forbidden' } });
            toast.error('Access denied', 'You do not have permission to do that.');
          }
          break;

        case 404:
          toast.error('Not found', serverMsg ?? 'The requested resource could not be found.');
          break;

        case 409:
          toast.error(
            'Conflict',
            serverMsg ?? 'This record already exists or conflicts with existing data.',
          );
          break;

        case 422:
          toast.error('Validation failed', serverMsg ?? 'One or more fields are invalid.');
          break;

        case 423:
          router.navigate(['/auth/account-locked']);
          toast.error('Account locked', 'Contact your administrator.');
          break;

        case 429:
          toast.warning('Too many requests', 'Slow down — please wait a moment and try again.');
          break;

        case 500:
          toast.error(
            'Server error',
            'Something went wrong on our end. Please try again shortly.',
            8000,
          );
          break;

        case 503:
          toast.error(
            'Service unavailable',
            'The server is temporarily offline. Please try again later.',
            8000,
          );
          break;

        default:
          if (err.status >= 500) {
            toast.error('Server error', serverMsg ?? 'An unexpected error occurred.');
          }
          break;
      }

      return throwError(() => err);
    }),
  );
};
