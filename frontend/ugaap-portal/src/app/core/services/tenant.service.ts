import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { SessionService } from './session.service';

export interface CooperativeProfile {
  id: string;
  name: string;
  registrationNumber: string;
  logoUrl?: string;
  country: string;
  address: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private _cooperative = signal<CooperativeProfile | null>(null);

  readonly cooperative    = this._cooperative.asReadonly();
  readonly cooperativeId  = computed(() => this.session.cooperativeId());
  readonly cooperativeName = computed(() => this._cooperative()?.name ?? '');

  constructor(
    private http: HttpClient,
    private session: SessionService,
  ) {}

  loadCooperative(): Observable<CooperativeProfile> {
    const id = this.cooperativeId();
    if (!id) throw new Error('No cooperative ID in session');
    return this.http
      .get<CooperativeProfile>(API_ENDPOINTS.PLATFORM.COOPERATIVE_BY_ID(id))
      .pipe(tap(coop => this._cooperative.set(coop)));
  }

  clear(): void {
    this._cooperative.set(null);
  }
}
