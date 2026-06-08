// ─────────────────────────────────────────────────────────────────────────────
// features/auth/auth.routes.ts
//
// All routes rendered inside AuthLayoutComponent (the centred card shell).
// None of these routes are protected — the authGuard is NOT applied here.
//
// Auth flow order:
//   login → otp → [dashboard]
//   login → forgot-password → reset-otp → set-new-password → login
// ─────────────────────────────────────────────────────────────────────────────

import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  // Bare /auth → go straight to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Step 1 — Enter credentials + role
  {
    path: 'login',
    loadComponent: () => import('./login/login.componet').then((m) => m.LoginComponent),
  },

  // Step 2 — Verify the OTP received after login
  {
    path: 'otp',
    loadComponent: () =>
      import('./otp-verify/otp-verify.component').then((m) => m.OtpVerifyComponent),
  },

  // Forgot-password flow ────────────────────────────────────────────────────

  // Step 1 — Enter registered email or phone
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'first-time-login',
    loadComponent: () =>
      import('./first-time-login/first-time-login.component').then(m => m.FirstTimeLoginComponent),
  },

  // Step 2 — Verify the reset OTP sent to email/phone
  {
    path: 'reset-otp',
    loadComponent: () => import('./reset-otp/reset-otp.component').then((m) => m.ResetOtpComponent),
  },

  // Step 3 — Choose a new password
  {
    path: 'set-new-password',
    loadComponent: () =>
      import('./set-new-password/set-new-password.component').then(
        (m) => m.SetNewPasswordComponent,
      ),
  },
  {
    path: 'first-time-login',
    loadComponent: () =>
      import('./first-time-login/first-time-login.component').then(
        (m) => m.FirstTimeLoginComponent,
      ),
  },
  
  // Default redirect to login
  // {
  //   path: '',
  //   redirectTo: 'login',
  //   pathMatch: 'full'
  // }
];
