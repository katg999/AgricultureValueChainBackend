// core/services/platform-cooperatives.service.ts
//
// Platform-admin operations on cooperatives: list all, look up one, create new.
// Follows the same platform-* naming convention as platform-dashboard.service.ts
// and platform-users.service.ts.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MOCK_PLATFORM_COOPERATIVES, PlatformCooperative } from '../mock/mock-platform';
import { USE_MOCK } from '../mock/mock-config';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export type { PlatformCooperative };

/** Legacy single-account shape — used in the cooperative creation payload */
export interface CooperativeBankDetails {
  bankName: string;
  bankBranch?: string;
  accountName: string;
  accountNumber: string;
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
}

export interface CooperativeAdminRequest {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  nationalId?: string;
  gender?: string;
  photoBase64?: string | null;
}

export interface CreateCooperativeRequest {
  name: string;
  registrationNumber: string;
  address: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  poBox?: string;
  websiteUrl?: string;
  country: string;
  defaultBranchName: string;
  defaultBranchLocation?: string;
  bankDetails?: CooperativeBankDetails;
  admin1?: CooperativeAdminRequest;
  admin2?: CooperativeAdminRequest;
}

@Injectable({ providedIn: 'root' })
export class PlatformCooperativesService {

  private readonly _cooperatives = new BehaviorSubject<PlatformCooperative[]>(
    USE_MOCK ? [...MOCK_PLATFORM_COOPERATIVES] : [],
  );

  constructor(private http: HttpClient) {}

  list(): Observable<PlatformCooperative[]> {
    if (USE_MOCK) return of([...this._cooperatives.value]);
    return this.http.get<PlatformCooperative[]>(API_ENDPOINTS.PLATFORM.COOPERATIVES).pipe(
      catchError(() => of([])),
    );
  }

  getById(id: string): Observable<PlatformCooperative | undefined> {
    if (USE_MOCK) return of(this._cooperatives.value.find(c => c.id === id));
    return this.http.get<PlatformCooperative>(API_ENDPOINTS.PLATFORM.COOPERATIVE_BY_ID(id)).pipe(
      catchError(() => of(undefined)),
    );
  }

  createCooperative(payload: CreateCooperativeRequest): Observable<any> {
    return this.http.post(API_ENDPOINTS.PLATFORM.COOPERATIVES, payload);
  }
}
