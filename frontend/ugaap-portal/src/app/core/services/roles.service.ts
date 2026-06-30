import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_ENDPOINTS } from '../constants/api-endpoints';
import { MOCK_ROLES }    from '../mock/mock-cooperative';
import { USE_MOCK }      from '../mock/mock-config';

export interface RoleRecord {
  id:               string;
  name:             string;
  description:      string;
  permissionsCount: number;
  usersCount:       number;
  isSystem:         boolean;
  createdAt:        string;
}

export interface AssignedUser {
  id:         string;
  name:       string;
  email:      string;
  branch:     string;
  assignedAt: string;
}

// Fixed name/branch pools used to generate deterministic mock user lists.
const FIRST_NAMES = ['Sarah', 'James', 'Grace', 'David', 'Alice', 'Peter', 'Lydia', 'Moses'];
const LAST_NAMES  = ['Nakato', 'Ochieng', 'Atim', 'Wafula', 'Apio', 'Ssali', 'Nambi', 'Kato'];
const BRANCHES    = ['Kampala Branch', 'Jinja Branch', 'Mbale Branch', 'Fort Portal Branch', 'Adjumani Branch'];

@Injectable({ providedIn: 'root' })
export class RolesService {

  private readonly _roles = new BehaviorSubject<RoleRecord[]>(
    USE_MOCK ? MOCK_ROLES as RoleRecord[] : [],
  );
  readonly roles$ = this._roles.asObservable();

  constructor(private readonly http: HttpClient) {}

  get roles(): RoleRecord[] { return this._roles.value; }

  findById(id: string): RoleRecord | undefined {
    return this._roles.value.find(r => r.id === id);
  }

  list(): Observable<RoleRecord[]> {
    if (USE_MOCK) return of(MOCK_ROLES as RoleRecord[]);
    return this.http.get<RoleRecord[]>(API_ENDPOINTS.ACCESS.ROLES).pipe(
      tap(data => this._roles.next(data)),
      catchError(err => { throw err; }),
    );
  }

  getUsersForRole(usersCount: number): AssignedUser[] {
    const count = Math.min(usersCount, 8);
    return Array.from({ length: count }, (_, i) => ({
      id:         `u${i + 1}`,
      name:       `${FIRST_NAMES[i]} ${LAST_NAMES[i]}`,
      email:      `${FIRST_NAMES[i].toLowerCase()}.${LAST_NAMES[i].toLowerCase()}@coop.ug`,
      branch:     BRANCHES[i % BRANCHES.length],
      assignedAt: '2024-01-' + String(i + 1).padStart(2, '0'),
    }));
  }

  deleteRole(id: string): Observable<void> {
    if (USE_MOCK) {
      this._roles.next(this._roles.value.filter(r => r.id !== id));
      return of(undefined);
    }
    return this.http.delete<void>(API_ENDPOINTS.ACCESS.ROLE_BY_ID(id)).pipe(
      tap(() => this._roles.next(this._roles.value.filter(r => r.id !== id))),
      catchError(err => { throw err; }),
    );
  }
}
