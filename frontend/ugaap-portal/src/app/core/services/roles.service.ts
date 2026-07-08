import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_ENDPOINTS } from '../constants/api-endpoints';
import { MOCK_ROLES, MOCK_ASSIGNED_USERS } from '../mock/mock-cooperative';
import { USE_MOCK }      from '../mock/mock-config';
import { allPermissionIds } from '../constants/permissions';

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
    // Return static mock users from MOCK_ASSIGNED_USERS, limited to requested count
    return (MOCK_ASSIGNED_USERS as AssignedUser[]).slice(0, Math.min(usersCount, MOCK_ASSIGNED_USERS.length));
  }

  // Mock mode has no per-role permission assignments stored anywhere, so we
  // derive a plausible set from the catalog sized to the role's permissionsCount.
  getPermissionsForRole(role: RoleRecord): string[] {
    return allPermissionIds().slice(0, role.permissionsCount);
  }

  // Mock-only mutations — used by the create/edit role forms so the roles
  // list reflects changes without a backend (mirrors deleteRole's approach).
  createRole(data: { name: string; description: string; permissionsCount: number }): RoleRecord {
    const role: RoleRecord = {
      id: String(Date.now()),
      name: data.name,
      description: data.description,
      permissionsCount: data.permissionsCount,
      usersCount: 0,
      isSystem: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this._roles.next([...this._roles.value, role]);
    return role;
  }

  updateRoleDetails(
    id: string,
    data: { name: string; description: string; permissionsCount: number },
  ): RoleRecord | undefined {
    const idx = this._roles.value.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    const updated: RoleRecord = { ...this._roles.value[idx], ...data };
    const next = [...this._roles.value];
    next[idx] = updated;
    this._roles.next(next);
    return updated;
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
