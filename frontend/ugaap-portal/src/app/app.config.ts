import { ApplicationConfig, Injectable } from '@angular/core';
import { provideRouter, withComponentInputBinding, TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor }   from './core/interceptors/auth.interceptor';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { errorInterceptor }  from './core/interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class UgaapTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) { super(); }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(pageTitle ?? 'UGAAP');
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: UgaapTitleStrategy },  // ← correct way
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        tenantInterceptor,
        errorInterceptor,
      ]),
    ),
  ],
};