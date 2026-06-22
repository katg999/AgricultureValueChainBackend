import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { SessionService } from './session.service';
import {
  LoginRequest,
  LoginResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  SignupRequest,
  SignupResponse,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private http: HttpClient,
    private session: SessionService,
  ) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, payload).pipe(
      tap((res) => {
        this.session.setSession(res.data.accessToken, res.data.refreshToken, {
          id: res.data.userId,
          fullName: res.data.username,
          email: res.data.email,
          phone: '',
          role: res.data.roles?.[0] ?? '',
          permissions: [],
          // tenantId/branchId/cooperativeId decoded automatically from JWT in setSession
        });
      }),
    );
  }

  verifyOtp(payload: OtpVerifyRequest): Observable<OtpVerifyResponse> {
    return this.http.post<OtpVerifyResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, payload).pipe(
      tap((res) => {
        this.session.setSession(res.accessToken, res.refreshToken, res.user);
      }),
    );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.session.getRefreshToken();
    return this.http
      .post<{ accessToken: string }>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken })
      .pipe(tap((res) => this.session.updateAccessToken(res.accessToken)));
  }

  forgotPassword(payload: { email: string }): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
  }

  resendOtp(tempToken: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(API_ENDPOINTS.AUTH.RESEND_OTP, { tempToken });
  }

  signup(payload: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(API_ENDPOINTS.PLATFORM.COOPERATIVES, payload);
  }

  logout(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(API_ENDPOINTS.AUTH.LOGOUT, {})
      .pipe(tap(() => this.session.logout()));
  }

  verifyPasswordResetOtp(payload: { email: string; otp: string }): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.AUTH.VERIFY_PASSWORD_RESET_OTP, payload);
  }

  resetPassword(payload: { verifiedToken: string; newPassword: string }): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  }
}
