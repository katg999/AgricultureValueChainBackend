import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor }   from './core/interceptors/auth.interceptor';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { errorInterceptor }  from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        authInterceptor,    // 1. attach Bearer token (or refresh if expired)
        tenantInterceptor,  // 2. attach X-Cooperative-ID / X-Branch-ID headers
        errorInterceptor,   // 3. handle 401 / 403 / network errors globally
      ]),
    ),
  ],
};