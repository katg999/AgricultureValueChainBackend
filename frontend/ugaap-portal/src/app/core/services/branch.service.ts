// core/services/branch.service.ts
//
// Branch domain service.
// Lower half: HTTP calls for branch onboarding (create / list / get by ID).
// Upper half: cooperative branch network data used by the branch dashboard and
//             branch-detail page, with USE_MOCK support.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { API_ENDPOINTS } from '../constants/api-endpoints';
import { USE_MOCK } from '../mock/mock-config';
import {
  CooperativeBranch,
  MOCK_COOPERATIVE_BRANCHES,
  MOCK_BRANCH_ACTIVITIES,
  MOCK_ASSIGNED_AGENTS_COUNT,
  MOCK_AGENTS_TREND,
  MOCK_AGENTS_TREND_UP,
  MOCK_FARMERS_TREND,
  MOCK_FARMERS_TREND_UP,
  MOCK_BRANCHES,
} from '../mock/mock-branch';

// Lookup map built from MOCK_BRANCHES so multiple features share one source of truth.
const BRANCH_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  MOCK_BRANCHES.map(b => [b.id, b.name])
);

// Re-export so components only need to import from the service
export type { CooperativeBranch } from '../mock/mock-branch';

// ── Onboarding API types ──────────────────────────────────────────────────────

export interface BranchCreatePayload {
  name: string;
  tenantId: string;
  registrationNumber: string;
  location: string;
  region: string;
  country: string;
  establishedDate: string;
  address: string;
  poBox: string;
  websiteUrl: string;
}

export interface BranchResponse {
  branchId: string;
  name: string;
  tenantId: string;
  location: string;
  branchCode: string;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class BranchService {

  // ── Cooperative branch network ────────────────────────────────────────────

  private readonly _branches = new BehaviorSubject<CooperativeBranch[]>(
    USE_MOCK ? [...MOCK_COOPERATIVE_BRANCHES] : [],
  );
  readonly branches$ = this._branches.asObservable();

  readonly assignedAgentsCount = USE_MOCK ? MOCK_ASSIGNED_AGENTS_COUNT : 0;
  readonly agentsTrend         = USE_MOCK ? MOCK_AGENTS_TREND         : undefined;
  readonly agentsTrendUp       = USE_MOCK ? MOCK_AGENTS_TREND_UP      : undefined;
  readonly farmersTrend        = USE_MOCK ? MOCK_FARMERS_TREND        : undefined;
  readonly farmersTrendUp      = USE_MOCK ? MOCK_FARMERS_TREND_UP     : undefined;

  constructor(private http: HttpClient) {}

  listCooperativeBranches(): Observable<CooperativeBranch[]> {
    if (USE_MOCK) return of([...MOCK_COOPERATIVE_BRANCHES]);
    return this.http.get<CooperativeBranch[]>(API_ENDPOINTS.COOPERATIVE.BRANCHES).pipe(
      catchError(() => of([])),
    );
  }

  getCooperativeBranchById(id: number): Observable<CooperativeBranch | undefined> {
    if (USE_MOCK) return of(MOCK_COOPERATIVE_BRANCHES.find(b => b.id === id));
    return of(MOCK_COOPERATIVE_BRANCHES.find(b => b.id === id));
  }

  // Prepends a newly registered branch into the in-memory list
  addCooperativeBranch(branch: Omit<CooperativeBranch, 'id'>): void {
    const next: CooperativeBranch = { id: Date.now(), ...branch };
    this._branches.next([next, ...this._branches.value]);
  }

  getActivities(): Observable<{ title: string; time: string }[]> {
    if (USE_MOCK) return of([...MOCK_BRANCH_ACTIVITIES]);
    // No dedicated activities endpoint yet — returns empty list until one is registered
    return of([] as { title: string; time: string }[]).pipe(catchError(() => of([])));
  }

  getBranchDisplayName(branchId: string): string {
    return BRANCH_DISPLAY_NAMES[branchId] ?? branchId;
  }

  // ── Onboarding API calls ──────────────────────────────────────────────────

  createBranch(payload: BranchCreatePayload): Observable<BranchResponse> {
    return this.http.post<BranchResponse>(API_ENDPOINTS.BRANCHES.CREATE, payload);
  }

  listBranches(tenantId: string): Observable<BranchResponse[]> {
    return this.http.get<BranchResponse[]>(API_ENDPOINTS.BRANCHES.LIST(tenantId)).pipe(
      catchError(() => of([])),
    );
  }

  getBranch(branchId: string): Observable<BranchResponse> {
    return this.http.get<BranchResponse>(API_ENDPOINTS.BRANCHES.BY_ID(branchId));
  }
}
