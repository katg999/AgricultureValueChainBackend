import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);

  const cooperativeId = session.cooperativeId();
  const branchId      = session.branchId();

  if (!cooperativeId) return next(req);

  const headers: Record<string, string> = { 'X-Cooperative-ID': cooperativeId };
  if (branchId) headers['X-Branch-ID'] = branchId;

  return next(req.clone({ setHeaders: headers }));
};
