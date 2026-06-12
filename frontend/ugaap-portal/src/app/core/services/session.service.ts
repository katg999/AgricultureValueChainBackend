// ─────────────────────────────────────────────────────────────────────────────
// core/services/session.service.ts
//
// Central session manager.  Every token read/write in the app goes through here.
// Components and other services MUST NOT touch localStorage/sessionStorage directly.
//
// Storage strategy:
//   localStorage   — survives page refresh  → access token, refresh token, user
//   sessionStorage — cleared on tab close   → temp tokens used during auth flows
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser } from '../models/auth.model';
import { environment } from '../../../environments/environment';

/** Seeded only in development when no real session exists — lets role-based filtering be demonstrated without a backend. */
const DEV_MOCK_USER: AuthUser = {
  id: 'DEV-BR-001',
  fullName: 'Demo Branch User',
  email: 'branch.mbale@ugaap.dev',
  phone: '0700000001',
  role: 'branch',
  branchId: 'BR-MBL',
  cooperativeId: 'COOP-001',
  permissions: [],
};

/** Keys used in storage — centralised so there are no magic strings elsewhere */
const KEYS = {
  // Persisted across refreshes
  ACCESS_TOKEN:   'ugaap_access_token',
  REFRESH_TOKEN:  'ugaap_refresh_token',
  USER:           'ugaap_user',

  // Session-only (tab lifetime)
  TEMP_TOKEN:     'ugaap_temp_token',    // Returned after login, used for OTP verify
  RESET_TOKEN:    'ugaap_reset_token',   // Returned after forgot-password request
  RESET_OTP:      'ugaap_reset_otp',     // OTP entered in reset-otp screen
  RESET_EMAIL:    'ugaap_reset_email',   // Email/phone used for forgot-password (for resend)
} as const;

@Injectable({ providedIn: 'root' })
export class SessionService {

  // ── Reactive state (Angular signals) ────────────────────────────────────────

  /** Currently authenticated user — null when logged out */
  private _user         = signal<AuthUser | null>(this._loadUser());

  /** Active JWT access token — null when logged out */
  private _accessToken  = signal<string | null>(localStorage.getItem(KEYS.ACCESS_TOKEN));

  // Read-only projections exposed to consumers
  readonly currentUser    = this._user.asReadonly();
  readonly isLoggedIn     = computed(() => !!this._accessToken() && !!this._user());
  readonly userRole       = computed(() => this._user()?.role ?? null);
  readonly cooperativeId  = computed(() => this._user()?.cooperativeId ?? null);
  readonly branchId       = computed(() => this._user()?.branchId ?? null);
  readonly permissions    = computed(() => this._user()?.permissions ?? []);

  constructor(private router: Router) {}

  // ── Login / OTP flow ────────────────────────────────────────────────────────

  /**
   * Persist the fully-authenticated session after OTP verification succeeds.
   * Called by AuthService.verifyOtp() via the tap() operator.
   */
  setSession(accessToken: string, refreshToken: string, user: AuthUser): void {
    localStorage.setItem(KEYS.ACCESS_TOKEN,  accessToken);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(KEYS.USER,          JSON.stringify(user));
    this._accessToken.set(accessToken);
    this._user.set(user);
  }

  /**
   * Store the short-lived temp token returned by the /login endpoint.
   * This is sent back to /verify-otp to exchange for a real session.
   */
  setTempToken(token: string): void {
    sessionStorage.setItem(KEYS.TEMP_TOKEN, token);
  }

  getTempToken(): string | null {
    return sessionStorage.getItem(KEYS.TEMP_TOKEN);
  }

  // Token accessors 

  getAccessToken(): string | null {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  }

  /** Silently replace the access token after a successful refresh */
  updateAccessToken(token: string): void {
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);
    this._accessToken.set(token);
  }

  // Forgot-password / Reset-password flow

  /**
   * Store the reset token returned by POST /auth/forgot-password.
   * Needed by set-new-password to complete the reset.
   */
  setResetToken(token: string): void {
    sessionStorage.setItem(KEYS.RESET_TOKEN, token);
  }

  getResetToken(): string | null {
    return sessionStorage.getItem(KEYS.RESET_TOKEN);
  }

  /**
   * Store the OTP code captured on the reset-otp screen.
   * Passed to POST /auth/reset-password alongside the new password.
   */
  setResetOtpCode(code: string): void {
    sessionStorage.setItem(KEYS.RESET_OTP, code);
  }

  getResetOtpCode(): string | null {
    return sessionStorage.getItem(KEYS.RESET_OTP);
  }

  /**
   * Store the email/phone used in the forgot-password request.
   * Needed so the reset-otp screen can resend to the same address.
   */
  setResetEmail(emailOrPhone: string): void {
    sessionStorage.setItem(KEYS.RESET_EMAIL, emailOrPhone);
  }

  getResetEmail(): string | null {
    return sessionStorage.getItem(KEYS.RESET_EMAIL);
  }

  /** Wipe all forgot/reset context from sessionStorage */
  clearResetContext(): void {
    sessionStorage.removeItem(KEYS.RESET_TOKEN);
    sessionStorage.removeItem(KEYS.RESET_OTP);
    sessionStorage.removeItem(KEYS.RESET_EMAIL);
  }

  //  Permission helpers 

  /** True if the current user has the given permission string */
  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  //  Token validity 

  /**
   * Decode the JWT payload and check the expiry claim.
   * Returns true if token is missing or expired.
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;           // Treat malformed tokens as expired
    }
  }

  // Session teardown

  /** Remove all stored data without redirecting — called by the interceptor */
  clearSession(): void {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.TEMP_TOKEN);
    this.clearResetContext();
    this._accessToken.set(null);
    this._user.set(null);
  }

  /** Full logout — clears session then redirects to login */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  //  Private helpers 

  private _loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(KEYS.USER);
      if (raw) return JSON.parse(raw) as AuthUser;
      // In development with no stored session, seed a branch user so role-based
      // filtering (batch visibility, etc.) is demonstrable without a real login.
      return environment.production ? null : DEV_MOCK_USER;
    } catch {
      return null;   // Corrupted storage — start fresh
    }
  }
}
