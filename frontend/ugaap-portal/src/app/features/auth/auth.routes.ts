import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login')
        .then(m => m.LoginComponent)
  },
  {
    path: 'otp',
    loadComponent: () =>
      import('./otp-verify/otp-verify')
        .then(m => m.OtpVerifyComponent)
  },
  {
    path: 'account-locked',
    loadComponent: () =>
      import('./account-locked/account-locked')
        .then(m => m.AccountLockedComponent)
  },
  {
    path: 'session-expired',
    loadComponent: () =>
      import('./session-expired/session-expired')
        .then(m => m.SessionExpiredComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password')
        .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-otp',
    loadComponent: () =>
      import('./reset-otp/reset-otp')
        .then(m => m.ResetOtpComponent)
  },
  {
    path: 'set-new-password',
    loadComponent: () =>
      import('./set-new-password/set-new-password')
        .then(m => m.SetNewPasswordComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];