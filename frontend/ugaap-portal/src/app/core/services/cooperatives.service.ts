// core/services/cooperatives.service.ts
//
// Supplies the platform-level list of all cooperatives.
// Swap `of(...)` for http.get(...) when the API is ready.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import {
  MOCK_PLATFORM_COOPERATIVES,
  PlatformCooperative,
} from '../mock/mock-platform';
import { USE_MOCK } from '../mock/mock-config';

export type { PlatformCooperative };

@Injectable({ providedIn: 'root' })
export class CooperativesService {

  private readonly _cooperatives = new BehaviorSubject<PlatformCooperative[]>(
    USE_MOCK ? [...MOCK_PLATFORM_COOPERATIVES] : [],
  );

  list(): Observable<PlatformCooperative[]> {
    return of([...this._cooperatives.value]);
  }

  getById(id: string): Observable<PlatformCooperative | undefined> {
    return of(this._cooperatives.value.find(c => c.id === id));
  }
}
