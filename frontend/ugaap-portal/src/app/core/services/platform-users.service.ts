// core/services/platform-users.service.ts
//
// Supplies user data for platform/user/* screens.
// Swap `of(...)` bodies for http.get(...) when the API is ready.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import {
  MOCK_PLATFORM_USERS,
  MOCK_PLATFORM_USER_DETAIL,
  MOCK_LOGIN_HISTORY,
  PlatformUser,
  PlatformUserDetail,
  LoginHistoryEntry,
} from '../mock/mock-platform';
import { USE_MOCK } from '../mock/mock-config';

export type { PlatformUser, PlatformUserDetail, LoginHistoryEntry };

@Injectable({ providedIn: 'root' })
export class PlatformUsersService {

  private readonly _users = new BehaviorSubject<PlatformUser[]>(
    USE_MOCK ? [...MOCK_PLATFORM_USERS] : [],
  );

  list(): Observable<PlatformUser[]> {
    return of([...this._users.value]);
  }

  getById(id: string): Observable<PlatformUserDetail | undefined> {
    // Single detail profile — in the API this will be keyed by id.
    const found = this._users.value.find(u => u.id === id);
    if (!found) return of(undefined);
    return of({ ...MOCK_PLATFORM_USER_DETAIL, id: found.id, name: found.name, email: found.email });
  }

  getLoginHistory(_userId: string): Observable<LoginHistoryEntry[]> {
    return of([...MOCK_LOGIN_HISTORY]);
  }

  delete(id: string): Observable<void> {
    this._users.next(this._users.value.filter(u => u.id !== id));
    return of(undefined);
  }
}
