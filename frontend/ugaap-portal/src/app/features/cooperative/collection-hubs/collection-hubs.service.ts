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

export const HUB_BRANCHES: { id: string; name: string }[] = [
  { id: 'br-001', name: 'Hoima Central' },
  { id: 'br-002', name: 'Masindi Depot' },
  { id: 'br-003', name: 'Gulu North' },
  { id: 'br-004', name: 'Lira East' },
  { id: 'br-005', name: 'Mbale West' },
];

export const UGANDA_DISTRICTS = [
  'Hoima', 'Masindi', 'Gulu', 'Lira', 'Mbale', 'Kampala',
  'Jinja', 'Mbarara', 'Arua', 'Soroti', 'Tororo', 'Kasese',
  'Kabale', 'Fort Portal', 'Masaka',
];

export const COMMODITIES = [
  'Robusta Coffee', 'Arabica Coffee', 'Maize', 'Rice',
  'Sunflower', 'Soya Beans', 'Simsim', 'Millet',
];

const SEED_HUBS: CollectionHub[] = [
  {
    id: 'hub-001', hubCode: 'HUB-0001',
    name: 'Hoima Market Hub', location: 'Hoima Trading Centre, Plot 14',
    district: 'Hoima', branchId: 'br-001', branchName: 'Hoima Central',
    capacity: 50, currentLoad: 32.4,
    commodities: ['Robusta Coffee', 'Maize'],
    status: 'active', createdAt: '2025-01-10',
  },
  {
    id: 'hub-002', hubCode: 'HUB-0002',
    name: 'Masindi South Collection Point', location: 'Masindi-Kampala Rd, Km 4',
    district: 'Masindi', branchId: 'br-002', branchName: 'Masindi Depot',
    capacity: 80, currentLoad: 71.0,
    commodities: ['Robusta Coffee'],
    status: 'active', createdAt: '2025-02-03',
  },
  {
    id: 'hub-003', hubCode: 'HUB-0003',
    name: 'Gulu Farmers Hub', location: 'Gulu Central Market, Stall 22',
    district: 'Gulu', branchId: 'br-003', branchName: 'Gulu North',
    capacity: 40, currentLoad: 12.7,
    commodities: ['Simsim', 'Soya Beans', 'Millet'],
    status: 'active', createdAt: '2025-03-18',
  },
  {
    id: 'hub-004', hubCode: 'HUB-0004',
    name: 'Lira East Aggregation Centre', location: 'Lira Municipality, Block C',
    district: 'Lira', branchId: 'br-004', branchName: 'Lira East',
    capacity: 60, currentLoad: 0,
    commodities: ['Sunflower', 'Soya Beans'],
    status: 'inactive', createdAt: '2025-04-22',
  },
  {
    id: 'hub-005', hubCode: 'HUB-0005',
    name: 'Mbale West Hub', location: 'Mbale Industrial Area, Shed B',
    district: 'Mbale', branchId: 'br-005', branchName: 'Mbale West',
    capacity: 35, currentLoad: 28.9,
    commodities: ['Arabica Coffee', 'Maize'],
    status: 'active', createdAt: '2025-05-30',
  },
];

@Injectable({ providedIn: 'root' })
export class CollectionHubsService {

  private readonly _hubs = new BehaviorSubject<CollectionHub[]>(
    USE_MOCK ? [...SEED_HUBS] : [],
  );
  readonly hubs$ = this._hubs.asObservable();

  constructor(private http: HttpClient) {}

  // ── Read ──────────────────────────────────────────────────────────────────────

  list(): Observable<CollectionHub[]> {
    if (USE_MOCK) return of([...SEED_HUBS]);
    return this.http.get<CollectionHub[]>(API_ENDPOINTS.COOPERATIVE.COLLECTION_HUBS).pipe(
      tap(hubs => this._hubs.next(hubs)),
      catchError(err => { throw err; }),
    );
  }

  getById(id: string): Observable<CollectionHub | undefined> {
    if (USE_MOCK) return of(SEED_HUBS.find(h => h.id === id));
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
    return HUB_BRANCHES.find(b => b.id === branchId)?.name ?? 'Unassigned';
  }
}
