import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  // Login Page (Default route)
  {
    path: '',
    loadComponent: () =>
      import('./login/login.componet')
        .then(m => m.LoginComponent)
  },
  // OTP Verification
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
  // Account Locked
  {
    path: 'account-locked',
    loadComponent: () =>
      import('./account-locked/account-locked.component')
        .then(m => m.AccountLockedComponent)
  },
  // Session Expired
  {
    path: 'session-expired',
    loadComponent: () =>
      import('./session-expired/session-expired.component')
        .then(m => m.SessionExpiredComponent)
  },
  // Forgot Password
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component')
        .then(m => m.ForgotPasswordComponent)
  },
  // Reset OTP
  {
    path: 'reset-otp',
    loadComponent: () =>
      import('./reset-otp/reset-otp.component')
        .then(m => m.ResetOtpComponent)
  },
  // Set New Password
  {
    path: 'set-new-password',
    loadComponent: () =>
      import('./set-new-password/set-new-password.component')
        .then(m => m.SetNewPasswordComponent)
  },
  // Default redirect to login
  // {
  //   path: '',
  //   redirectTo: 'login',
  //   pathMatch: 'full'
  // }
];
//   {
//     path: '',
//     redirectTo: 'login',
//     pathMatch: 'full'
//   }
// ];
