import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.componet')
        .then(m => m.LoginComponent)
  },
  {
    path: 'first-time-login',
    loadComponent: () =>
      import('./first-time-login/first-time-login.component')
        .then(m => m.FirstTimeLoginComponent)
  },
  {
    path: 'otp',
    loadComponent: () =>
      import('./otp-verify/otp-verify.component')
        .then(m => m.OtpVerifyComponent)
  },
  {
    path: 'account-locked',
    loadComponent: () =>
      import('./account-locked/account-locked.component')
        .then(m => m.AccountLockedComponent)
  },
  {
    path: 'session-expired',
    loadComponent: () =>
      import('./session-expired/session-expired.component')
        .then(m => m.SessionExpiredComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component')
        .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-otp',
    loadComponent: () =>
      import('./reset-otp/reset-otp.component')
        .then(m => m.ResetOtpComponent)
  },
  {
    path: 'set-new-password',
    loadComponent: () =>
      import('./set-new-password/set-new-password.component')
        .then(m => m.SetNewPasswordComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
