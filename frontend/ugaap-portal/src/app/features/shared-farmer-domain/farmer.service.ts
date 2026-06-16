// features/farmers/farmer.service.ts
//
// Farmer domain service — all CRUD operations for farmers.
// Uses HttpClient + API_ENDPOINTS; the auth/tenant interceptors automatically
// attach the Bearer token and cooperative/branch ID headers.
//
// Interfaces are defined in core/models/farmer.model.ts and re-exported
// here for backwards compatibility with existing component imports.

import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith, take, tap, timeout } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../core/constants/api-endpoints';
import { SessionService } from '../../core/services/session.service';

// Cooperative Interfaces

export interface CooperativeLink {
  cooperativeId:   string;
  cooperativeName: string;
  branchId:        string;
  branchName:      string;
  linkedAt:        string;
  linkedBy:        string;
  reason?:         string;
}

export interface CooperativeBranch {
  id:            string;
  name:          string;
  cooperativeId: string;
}

export interface Cooperative {
  id:       string;
  name:     string;
  branches: CooperativeBranch[];
}

// Re-export farmer model types

export type {
  FarmerStatus,
  OnboardingStepStatus,
  RecoveryStatus,
  BadgeVariant,
  ProductionDetails,
  FarmerRegistrationForm,
  OnboardingStep,
  FarmerProfile,
  FarmerListItem,
} from '../../core/models/farmer.model';

import type {
  FarmerProfile,
  FarmerListItem,
  FarmerRegistrationForm,
} from '../../core/models/farmer.model';
import { MOCK_FARMER_LIST, buildMockFarmerProfile } from './farmer.mock';


@Injectable({
  providedIn: 'root',
})
export class FarmerService {
  private readonly farmersSubject = new BehaviorSubject<FarmerListItem[]>([...MOCK_FARMER_LIST]);
  readonly farmers$ = this.farmersSubject.asObservable();

  constructor(
    private http: HttpClient,
    private session: SessionService,
  ) {}


  /**
   * GET /api/v1/cooperative/farmers
   * Returns the slim list view used in farmer table.
   */
  list(): Observable<FarmerListItem[]> {
    return this._isBranchUser()
      ? this.listForBranch()
      : this.listForCooperative();
  }

  watchForBranch(branchId = this.session.branchId()): Observable<FarmerListItem[]> {
    // Components bind to this stream so create/approve/reject changes render without reloading.
    return this.farmers$.pipe(map(farmers => this._farmersForBranch(farmers, branchId)));
  }

  watchForCooperative(): Observable<FarmerListItem[]> {
    // Cooperative screens need the same store as branch screens to avoid split-brain mock state.
    return this.farmers$;
  }

  /**
   * GET /api/v1/branch/farmers
   * Returns farmers registered under the current branch.
   */
  listForBranch(branchId = this.session.branchId()): Observable<FarmerListItem[]> {
    const mockSnapshot = this._farmersForBranch(this.farmersSubject.value, branchId);

    const params = branchId
      ? new HttpParams().set('branchId', branchId)
      : undefined;

    return this.http.get<FarmerListItem[]>(
      API_ENDPOINTS.BRANCH.FARMERS,
      params ? { params } : undefined,
    ).pipe(
      // Enforce branch isolation on whatever the backend returns — guards against
      // backend bugs that return cross-branch data on this endpoint.
      map(farmers => this._farmersForBranch(farmers, branchId)),
      tap(farmers => this._mergeFarmers(farmers)),
      catchError(() => of(mockSnapshot)),
      startWith(mockSnapshot),
    );
  }

  /**
   * GET /api/v1/cooperative/farmers
   * Returns farmers across the current cooperative.
   */
  listForCooperative(cooperativeId = this.session.cooperativeId()): Observable<FarmerListItem[]> {
    const params = cooperativeId
      ? new HttpParams().set('cooperativeId', cooperativeId)
      : undefined;

    return this.http.get<FarmerListItem[]>(
      API_ENDPOINTS.COOPERATIVE.FARMERS,
      params ? { params } : undefined,
    ).pipe(
      tap(farmers => this._emitFarmers(farmers)),
      catchError(() => of([...this.farmersSubject.value])),
    );
  }

  /**
   * GET /api/v1/cooperative/farmers/:id
   * Returns full farmer profile.
   */
  getById(id: string): Observable<FarmerProfile> {

    const url = this._isBranchUser()
      ? API_ENDPOINTS.BRANCH.FARMER_BY_ID(id)
      : API_ENDPOINTS.COOPERATIVE.FARMER_BY_ID(id);

    const mockProfile = buildMockFarmerProfile(id);
    return this.http.get<FarmerProfile>(url).pipe(
      timeout(5000),
      catchError(() => of(mockProfile)),
      startWith(mockProfile),
      take(1),
    );
  }

  // Cooperative + Branch Linking

  /**
   * Returns all farmers belonging to a cooperative
   * across all branches.
   */
  listByCooperative(
    cooperativeId: string,
  ): Observable<FarmerListItem[]> {
    return this.listForCooperative(cooperativeId);
  }

  /**
   * Returns all farmers assigned to a branch.
   */
  listByBranch(
    branchId: string,
  ): Observable<FarmerListItem[]> {
    return this.listForBranch(branchId);
  }

  /**
   * Returns all cooperatives with nested branches.
   * Used in cooperative/branch dropdowns.
   */
  getCooperatives(): Observable<Cooperative[]> {

    return this.http.get<Cooperative[]>(
      API_ENDPOINTS.COOPERATIVE.ALL
    );
  }

  /**
   * Assigns or transfers a farmer to a cooperative + branch.
   */
  linkToCooperative(
    farmerId: string,
    cooperativeId: string,
    branchId: string,
    reason?: string,
  ): Observable<FarmerProfile> {

    return this.http.post<FarmerProfile>(
      `${API_ENDPOINTS.COOPERATIVE.FARMER_BY_ID(farmerId)}/link`,
      {
        cooperativeId,
        branchId,
        reason,
      }
    );
  }

  // Create

  /**
   * Registers a new farmer.
   * Farmers are onboarded at branch level.
   */
  create(
    form: FarmerRegistrationForm,
  ): Observable<FarmerProfile> {

    const payload: FarmerRegistrationForm = {
      ...form,
      status: 'Pending',
      branchId: form.branchId ?? this.session.branchId() ?? undefined,
      cooperativeId: form.cooperativeId ?? this.session.cooperativeId() ?? undefined,
      assignedBranch: form.assignedBranch || this.session.branchId() || '',
    };

    return this.http.post<FarmerProfile>(
      API_ENDPOINTS.BRANCH.FARMERS,
      payload,
    ).pipe(
      timeout(15000),
      tap(profile => this._upsertFarmer(this._listItemFromProfile(profile, payload))),
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.status > 0) throw err;
        return of(this._createMockFarmer(payload));
      }),
    );
}

  // Update

  /**
   * Updates an existing farmer's registration details.
   * PATCH /api/v1/branch/farmers/:id
   */
  update(id: string, form: FarmerRegistrationForm): Observable<FarmerProfile> {
    return this.http.patch<FarmerProfile>(
      API_ENDPOINTS.BRANCH.FARMER_BY_ID(id),
      form,
    ).pipe(
      timeout(15000),
      tap(profile => this._upsertFarmer(this._listItemFromProfile(profile, form))),
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.status > 0) throw err;
        const item = this.farmersSubject.value.find(f => f.id === id);
        if (item) {
          this._upsertFarmer({ ...item, name: form.fullName, primaryCommodity: this._primaryCommodity(form) });
        }
        return of(buildMockFarmerProfile(id));
      }),
    );
  }

  // Approval Workflow

  /**
   * Approves a farmer.
   */
  approve(id: string): Observable<FarmerProfile> {

    return this.http.patch<FarmerProfile>(
      API_ENDPOINTS.COOPERATIVE.FARMER_APPROVE(id),
      {},
    ).pipe(
      tap(profile => this._upsertFarmer(this._listItemFromProfile(profile))),
      catchError(() => of(this._updateMockStatus(id, 'Active'))),
    );
  }

  /**
   * Rejects a farmer.
   */
  reject(id: string): Observable<FarmerProfile> {

    return this.http.patch<FarmerProfile>(
      API_ENDPOINTS.COOPERATIVE.FARMER_REJECT(id),
      {},
    ).pipe(
      tap(profile => this._upsertFarmer(this._listItemFromProfile(profile))),
      catchError(() => of(this._updateMockStatus(id, 'Rejected'))),
    );
  }

  // Private Helpers

  /**
   * Branch users use branch endpoints.
   */
  private _isBranchUser(): boolean {
    return this.session.userRole() === 'branch';
  }

  private _farmersForBranch(farmers: FarmerListItem[], branchId: string | null): FarmerListItem[] {
    if (!branchId) return [];
    return farmers.filter(farmer => farmer.branchId === branchId);
  }

  private _updateMockStatus(id: string, status: FarmerProfile['status']): FarmerProfile {
    const index = MOCK_FARMER_LIST.findIndex(farmer => farmer.id === id);
    if (index >= 0) {
      MOCK_FARMER_LIST[index] = { ...MOCK_FARMER_LIST[index], status };
      this._upsertFarmer(MOCK_FARMER_LIST[index]);
    }

    return buildMockFarmerProfile(id, status);
  }

  private _createMockFarmer(form: FarmerRegistrationForm): FarmerProfile {
    const id = `UG-F-${String(Date.now()).slice(-5)}`;
    const branchId = form.branchId ?? this.session.branchId() ?? 'BR-KLA';
    const branch = form.assignedBranch || branchId;
    const primaryCommodity = this._primaryCommodity(form);

    const item: FarmerListItem = {
      id,
      name: form.fullName,
      branchId,
      branch,
      primaryCommodity,
      creditLimit: '0',
      balance: '0',
      status: 'Pending',
      stage: 'Registered',
    };

    MOCK_FARMER_LIST.unshift(item);
    this._upsertFarmer(item);
    return buildMockFarmerProfile(id, 'Pending');
  }

  private _listItemFromProfile(profile: FarmerProfile, fallback?: FarmerRegistrationForm): FarmerListItem {
    return {
      id: profile.id,
      name: profile.fullName,
      branchId: fallback?.branchId ?? this.session.branchId() ?? 'BR-KLA',
      branch: profile.registration?.assignedBranch ?? fallback?.assignedBranch ?? this.session.branchId() ?? 'Branch',
      primaryCommodity: profile.primaryCrop ?? this._primaryCommodity(fallback),
      creditLimit: String(profile.groupCredit?.creditLimit ?? 0),
      balance: String(profile.outstandingBalance ?? 0),
      status: profile.status,
      stage: profile.stage,
    };
  }

  private _primaryCommodity(form?: FarmerRegistrationForm): string {
    return form?.production?.commodity?.trim() || 'Mixed';
  }

  private _upsertFarmer(farmer: FarmerListItem): void {
    const next = [...this.farmersSubject.value];
    const index = next.findIndex(row => row.id === farmer.id);

    if (index >= 0) {
      next[index] = { ...next[index], ...farmer };
    } else {
      next.unshift(farmer);
    }

    this._emitFarmers(next);
  }

  private _mergeFarmers(farmers: FarmerListItem[]): void {
    farmers.forEach(farmer => this._upsertFarmer(farmer));
  }

  private _emitFarmers(farmers: FarmerListItem[]): void {
    this.farmersSubject.next([...farmers]);
  }
}

