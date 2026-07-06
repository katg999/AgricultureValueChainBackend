import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser } from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { DEV_MOCK_USER } from '../mock/mock-auth';
import { USE_MOCK } from '../mock/mock-config';

const KEYS = {
  ACCESS_TOKEN: 'ugaap_access_token',
  REFRESH_TOKEN: 'ugaap_refresh_token',
  USER: 'ugaap_user',
  TEMP_TOKEN: 'ugaap_temp_token',
  RESET_TOKEN: 'ugaap_reset_token',
  RESET_OTP: 'ugaap_reset_otp',
  RESET_EMAIL: 'ugaap_reset_email',
} as const;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private _user = signal<AuthUser | null>(this._loadUser());

  private _accessToken = signal<string | null>(
    localStorage.getItem(KEYS.ACCESS_TOKEN) ?? (environment.production ? null : 'dev-mock-token'),
  );

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._accessToken() && !!this._user());
  readonly userRole = computed(() => this._user()?.role ?? null);
  readonly tenantId = computed(() => this._user()?.tenantId ?? null);
  readonly cooperativeId = computed(() => this._user()?.cooperativeId ?? null);
  readonly branchId = computed(() => this._user()?.branchId ?? null);
  readonly permissions = computed(() => this._user()?.permissions ?? []);

  constructor(private router: Router) {}

  // ── JWT decoder ───────────────────────────────────────────────────────────

  private _decodeToken(token: string): Record<string, any> {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return {};
    }
  }

  // ── Login / OTP flow ──────────────────────────────────────────────────────

  /**
   * Persist the fully-authenticated session.
   * Enriches the user object with claims decoded directly from the JWT
   * so tenantId / branchId / cooperativeId are always populated even if
   * the login response body doesn't include them.
   */
  setSession(accessToken: string, refreshToken: string, user: AuthUser): void {
    const claims = this._decodeToken(accessToken);

    const enrichedUser: AuthUser = {
      ...user,
      tenantId: claims['tenant_id'] || user.tenantId || '',
      branchId: claims['branch_id'] || user.branchId || '',
      cooperativeId: claims['cooperative_id'] || user.cooperativeId || '',
    };

    localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(KEYS.USER, JSON.stringify(enrichedUser));
    this._accessToken.set(accessToken);
    this._user.set(enrichedUser);
  }

  setTempToken(token: string): void {
    sessionStorage.setItem(KEYS.TEMP_TOKEN, token);
  }

  getTempToken(): string | null {
    return sessionStorage.getItem(KEYS.TEMP_TOKEN);
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  }

  updateAccessToken(token: string): void {
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);
    this._accessToken.set(token);
  }

  // ── Forgot / reset flow ───────────────────────────────────────────────────

  setResetToken(token: string): void {
    sessionStorage.setItem(KEYS.RESET_TOKEN, token);
  }

  getResetToken(): string | null {
    return sessionStorage.getItem(KEYS.RESET_TOKEN);
  }

  setResetOtpCode(code: string): void {
    sessionStorage.setItem(KEYS.RESET_OTP, code);
  }

  getResetOtpCode(): string | null {
    return sessionStorage.getItem(KEYS.RESET_OTP);
  }

  setResetEmail(emailOrPhone: string): void {
    sessionStorage.setItem(KEYS.RESET_EMAIL, emailOrPhone);
  }

  getResetEmail(): string | null {
    return sessionStorage.getItem(KEYS.RESET_EMAIL);
  }

  clearResetContext(): void {
    sessionStorage.removeItem(KEYS.RESET_TOKEN);
    sessionStorage.removeItem(KEYS.RESET_OTP);
    sessionStorage.removeItem(KEYS.RESET_EMAIL);
  }

  // ── Permission helpers ────────────────────────────────────────────────────

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  // ── Token validity ────────────────────────────────────────────────────────

  isTokenExpired(): boolean {
    const token = this._accessToken();
    if (!token) return true;
    if (token === 'dev-mock-token') return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  // ── Session teardown ──────────────────────────────────────────────────────

  clearSession(): void {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.USER);
    sessionStorage.removeItem(KEYS.TEMP_TOKEN);
    this.clearResetContext();
    this._accessToken.set(null);
    this._user.set(null);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  clearTempToken(): void {
    sessionStorage.removeItem(KEYS.TEMP_TOKEN);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(KEYS.USER);
      if (raw) return JSON.parse(raw) as AuthUser;
      // Only fall back to the hardcoded dev user when mock mode is on.
      return (USE_MOCK && !environment.production) ? DEV_MOCK_USER : null;
    } catch {
      return null;
    }
  }
}
