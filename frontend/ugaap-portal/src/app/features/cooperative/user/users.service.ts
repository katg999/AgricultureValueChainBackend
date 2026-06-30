// features/cooperative/user/users.service.ts
//
// Domain service for cooperative users (staff accounts).
// Uses HttpClient + API_ENDPOINTS; mock data is returned when USE_MOCK = true.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { USE_MOCK } from '../../../core/mock/mock-config';
import { MOCK_LOGIN_HISTORY, LoginHistoryEntry } from '../../../core/mock/mock-platform';
import { MOCK_COOPERATIVE_USERS } from '../../../core/mock/mock-cooperative';

export type { LoginHistoryEntry };

export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  lastLogin: string;
  status: UserStatus;
  // Optional fields returned by the detail endpoint
  nationalId?: string;
  dateOfBirth?: string;
  dateRegistered?: string;
  cooperative?: string;
  lastPasswordChange?: string;
  failedLoginAttempts?: number;
}

export interface UserInput {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  nationalId?: string;
  gender?: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {

  private readonly _users = new BehaviorSubject<User[]>(
    USE_MOCK ? [...MOCK_COOPERATIVE_USERS] as User[] : [],
  );
  readonly users$ = this._users.asObservable();

  constructor(private http: HttpClient) {}

  // ── Read ──────────────────────────────────────────────────────────────────────

  list(): Observable<User[]> {
    if (USE_MOCK) return of([...MOCK_COOPERATIVE_USERS] as User[]);
    return this.http.get<User[]>(API_ENDPOINTS.COOPERATIVE.USERS).pipe(
      tap(users => this._users.next(users)),
      catchError(err => { throw err; }),
    );
  }

  getById(id: string): Observable<User | undefined> {
    if (USE_MOCK) return of(MOCK_COOPERATIVE_USERS.find(u => u.id === id) as User | undefined);
    return this.http.get<User>(API_ENDPOINTS.COOPERATIVE.USER_BY_ID(id)).pipe(
      catchError(err => { throw err; }),
    );
  }

  // ── Create ────────────────────────────────────────────────────────────────────

  create(input: UserInput): Observable<User> {
    if (USE_MOCK) {
      const user: User = {
        id: String(Date.now()),
        name: input.fullName,
        email: input.email,
        phone: input.phone,
        role: input.role.toUpperCase(),
        organization: 'UGAAP Central',
        lastLogin: 'Never',
        status: 'active',
      };
      this._users.next([user, ...this._users.value]);
      return of(user);
    }
    return this.http.post<User>(API_ENDPOINTS.COOPERATIVE.USERS, input).pipe(
      tap(user => this._upsert(user)),
      catchError(err => { throw err; }),
    );
  }

  // ── Status ────────────────────────────────────────────────────────────────────

  setStatus(id: string, status: UserStatus): Observable<void> {
    if (USE_MOCK) {
      this._users.next(this._users.value.map(u => u.id === id ? { ...u, status } : u));
      return of(undefined);
    }
    const url = `${API_ENDPOINTS.COOPERATIVE.USER_BY_ID(id)}/${status === 'active' ? 'activate' : 'deactivate'}`;
    return this.http.post<void>(url, {}).pipe(
      tap(() => this._users.next(this._users.value.map(u => u.id === id ? { ...u, status } : u))),
      catchError(err => { throw err; }),
    );
  }

  // ── Login history ─────────────────────────────────────────────────────────────

  getLoginHistory(_userId: string): Observable<LoginHistoryEntry[]> {
    // Swap for http.get<LoginHistoryEntry[]>(url) when audit-log endpoint is ready.
    return of([...MOCK_LOGIN_HISTORY]);
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private _upsert(user: User): void {
    const list = [...this._users.value];
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) list[idx] = user; else list.unshift(user);
    this._users.next(list);
  }
}
