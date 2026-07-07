// core/services/platform-users.service.ts
//
// Supplies user data for platform/user/* screens.
// USE_MOCK = true  → returns local fake data.
// USE_MOCK = false → calls the real API.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  MOCK_PLATFORM_USERS,
  MOCK_PLATFORM_USER_DETAIL,
  MOCK_LOGIN_HISTORY,
  PlatformUser,
  PlatformUserDetail,
  LoginHistoryEntry,
} from '../mock/mock-platform';
import { USE_MOCK } from '../mock/mock-config';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export type { PlatformUser, PlatformUserDetail, LoginHistoryEntry };

@Injectable({ providedIn: 'root' })
export class PlatformUsersService {

  private readonly _users = new BehaviorSubject<PlatformUser[]>(
    USE_MOCK ? [...MOCK_PLATFORM_USERS] : [],
  );

  constructor(private http: HttpClient) {}

  list(): Observable<PlatformUser[]> {
    if (USE_MOCK) return of([...this._users.value]);
    return this.http.get<PlatformUser[]>(API_ENDPOINTS.PLATFORM.USERS).pipe(
      catchError(() => of([])),
    );
  }

  getById(id: string): Observable<PlatformUserDetail | undefined> {
    if (USE_MOCK) {
      const found = this._users.value.find(u => u.id === id);
      if (!found) return of(undefined);
      return of({ ...MOCK_PLATFORM_USER_DETAIL, id: found.id, name: found.name, email: found.email });
    }
    return this.http.get<PlatformUserDetail>(API_ENDPOINTS.PLATFORM.USER_BY_ID(id)).pipe(
      catchError(() => of(undefined)),
    );
  }

  getLoginHistory(userId: string): Observable<LoginHistoryEntry[]> {
    if (USE_MOCK) return of([...MOCK_LOGIN_HISTORY]);
    return this.http.get<LoginHistoryEntry[]>(API_ENDPOINTS.PLATFORM.USER_LOGIN_HISTORY(userId)).pipe(
      catchError(() => of([])),
    );
  }

  delete(id: string): Observable<void> {
    if (USE_MOCK) {
      this._users.next(this._users.value.filter(u => u.id !== id));
      return of(undefined);
    }
    return this.http.delete<void>(API_ENDPOINTS.PLATFORM.USER_BY_ID(id)).pipe(
      catchError(() => of(undefined)),
    );
  }
}
