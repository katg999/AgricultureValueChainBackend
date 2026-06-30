// core/services/cooperative.service.ts
//
// Cooperative-admin operations: view own profile and manage bank accounts.
// For platform-level cooperative operations (list, create), see platform-cooperatives.service.ts.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { USE_MOCK } from '../mock/mock-config';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { MOCK_COOP_PROFILE, MOCK_COOP_BANK_ACCOUNTS, CooperativeProfile } from '../mock/mock-cooperative';

export type { CooperativeProfile };

/** One entry in a cooperative's list of bank accounts */
export interface CooperativeBankAccount {
  id: string;
  bankName: string;
  bankBranch?: string;
  accountName: string;
  accountNumber: string;
  isPrimary: boolean;
}

@Injectable({ providedIn: 'root' })
export class CooperativeService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<CooperativeProfile> {
    if (USE_MOCK) return of({ ...MOCK_COOP_PROFILE });
    return this.http.get<CooperativeProfile>(API_ENDPOINTS.COOPERATIVE.PROFILE).pipe(
      catchError(() => of({ ...MOCK_COOP_PROFILE })),
    );
  }

  getBankAccounts(): Observable<CooperativeBankAccount[]> {
    if (USE_MOCK) return of(MOCK_COOP_BANK_ACCOUNTS.map(a => ({ ...a })));
    return this.http.get<CooperativeBankAccount[]>(API_ENDPOINTS.COOPERATIVE.BANK_ACCOUNTS).pipe(
      catchError(() => of([])),
    );
  }
}
