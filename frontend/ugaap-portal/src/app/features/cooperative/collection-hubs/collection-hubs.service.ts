// features/cooperative/collection-hubs/collection-hubs.service.ts
//
// Domain service for collection hubs.
// Uses HttpClient + API_ENDPOINTS; mock data is returned when USE_MOCK = true.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { USE_MOCK } from '../../../core/mock/mock-config';
import { MOCK_BRANCHES } from '../../../core/mock/mock-branch';
import { MOCK_COLLECTION_HUBS } from '../../../core/mock/mock-cooperative';

export type HubStatus = 'active' | 'inactive';

export interface CollectionHub {
  id: string;
  hubCode: string;
  name: string;
  location: string;
  district: string;
  branchId: string;
  branchName: string;
  capacity: number;
  currentLoad: number;
  commodities: string[];
  status: HubStatus;
  createdAt: string;
}

export interface CollectionHubInput {
  name: string;
  location: string;
  district: string;
  branchId: string;
  capacity: number;
  commodities: string[];
}

export { MOCK_BRANCHES as HUB_BRANCHES } from '../../../core/mock/mock-branch';

@Injectable({ providedIn: 'root' })
export class CollectionHubsService {

  private readonly _hubs = new BehaviorSubject<CollectionHub[]>(
    USE_MOCK ? [...MOCK_COLLECTION_HUBS] as CollectionHub[] : [],
  );
  readonly hubs$ = this._hubs.asObservable();

  constructor(private http: HttpClient) {}

  // ── Read ──────────────────────────────────────────────────────────────────────

  list(): Observable<CollectionHub[]> {
    if (USE_MOCK) return of([...MOCK_COLLECTION_HUBS] as CollectionHub[]);
    return this.http.get<CollectionHub[]>(API_ENDPOINTS.COOPERATIVE.COLLECTION_HUBS).pipe(
      tap(hubs => this._hubs.next(hubs)),
      catchError(() => of([])),
    );
  }

  getById(id: string): Observable<CollectionHub | undefined> {
    if (USE_MOCK) return of(MOCK_COLLECTION_HUBS.find(h => h.id === id) as CollectionHub | undefined);
    return this.http.get<CollectionHub>(API_ENDPOINTS.COOPERATIVE.COLLECTION_HUB_BY_ID(id)).pipe(
      catchError(err => { throw err; }),
    );
  }

  // ── Create ────────────────────────────────────────────────────────────────────

  create(input: CollectionHubInput): Observable<CollectionHub> {
    if (USE_MOCK) {
      const seq = this._hubs.value.length + 1;
      const hub: CollectionHub = {
        id: `hub-${String(seq).padStart(3, '0')}`,
        hubCode: `HUB-${String(seq).padStart(4, '0')}`,
        ...input,
        branchName: this._branchName(input.branchId),
        currentLoad: 0,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      this._hubs.next([hub, ...this._hubs.value]);
      return of(hub);
    }
    return this.http.post<CollectionHub>(API_ENDPOINTS.COOPERATIVE.COLLECTION_HUBS, input).pipe(
      tap(hub => this._upsert(hub)),
      catchError(err => { throw err; }),
    );
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  update(id: string, input: CollectionHubInput): Observable<CollectionHub> {
    if (USE_MOCK) {
      const existing = this._hubs.value.find(h => h.id === id);
      const updated: CollectionHub = {
        ...(existing as CollectionHub),
        ...input,
        branchName: this._branchName(input.branchId),
      };
      this._upsert(updated);
      return of(updated);
    }
    return this.http.put<CollectionHub>(API_ENDPOINTS.COOPERATIVE.COLLECTION_HUB_BY_ID(id), input).pipe(
      tap(hub => this._upsert(hub)),
      catchError(err => { throw err; }),
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  delete(id: string): Observable<void> {
    if (USE_MOCK) {
      this._hubs.next(this._hubs.value.filter(h => h.id !== id));
      return of(undefined);
    }
    return this.http.delete<void>(API_ENDPOINTS.COOPERATIVE.COLLECTION_HUB_BY_ID(id)).pipe(
      tap(() => this._hubs.next(this._hubs.value.filter(h => h.id !== id))),
      catchError(err => { throw err; }),
    );
  }

  // ── Status ────────────────────────────────────────────────────────────────────

  setStatus(id: string, status: HubStatus): Observable<void> {
    if (USE_MOCK) {
      this._hubs.next(this._hubs.value.map(h => h.id === id ? { ...h, status } : h));
      return of(undefined);
    }
    const url = status === 'active'
      ? API_ENDPOINTS.COOPERATIVE.COLLECTION_HUB_ACTIVATE(id)
      : API_ENDPOINTS.COOPERATIVE.COLLECTION_HUB_DEACTIVATE(id);
    return this.http.post<void>(url, {}).pipe(
      tap(() => this._hubs.next(this._hubs.value.map(h => h.id === id ? { ...h, status } : h))),
      catchError(err => { throw err; }),
    );
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private _upsert(hub: CollectionHub): void {
    const list = [...this._hubs.value];
    const idx = list.findIndex(h => h.id === hub.id);
    if (idx >= 0) list[idx] = hub; else list.unshift(hub);
    this._hubs.next(list);
  }

  private _branchName(branchId: string): string {
    return MOCK_BRANCHES.find(b => b.id === branchId)?.name ?? 'Unassigned';
  }
}
