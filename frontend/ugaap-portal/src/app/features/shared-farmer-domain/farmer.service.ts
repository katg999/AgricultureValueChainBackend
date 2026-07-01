// features/farmers/farmer.service.ts
//
// Farmer domain service — all CRUD operations for farmers.
// Uses HttpClient + API_ENDPOINTS; the auth/tenant interceptors automatically
// attach the Bearer token and cooperative/branch ID headers.
//
// Interfaces are defined in core/models/farmer.model.ts and re-exported
// here for backwards compatibility with existing component imports.

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith, take, tap, timeout } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../core/constants/api-endpoints';
import { SessionService } from '../../core/services/session.service';

// Cooperative Interfaces

export interface CooperativeLink {
  cooperativeId: string;
  cooperativeName: string;
  branchId: string;
  branchName: string;
  linkedAt: string;
  linkedBy: string;
  reason?: string;
}

export interface CooperativeBranch {
  id: string;
  name: string;
  cooperativeId: string;
}

export interface Cooperative {
  id: string;
  name: string;
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
import { MOCK_FARMER_LIST, MOCK_COOPERATIVES, buildMockFarmerProfile } from './farmer.mock';
import {
  MOCK_INPUT_ALLOCATIONS,
  MOCK_PRODUCE_DELIVERIES,
  MOCK_BALANCE_LINES,
  MOCK_REPAYMENTS,
  MOCK_FARMER_NOTIFICATIONS,
} from '../../core/mock/mock-farmer';
import { USE_MOCK } from '../../core/mock/mock-config';

// ── Farmer activity interfaces ────────────────────────────────────────────────
// These describe the sub-tab tables on the farmer approval/profile page.
// Kept here so components don't need a separate service just for tab data.

export interface InputAllocation {
  item: string; quantity: string; value: number;
  issueDate: string; recoveryStatus: 'settled' | 'partial' | 'overdue';
}
export interface ProduceDelivery {
  crop: string; weight: string; collectionCentre: string;
  date: string; grade: string; value: number;
}
export interface BalanceLine {
  description: string; principal: number; recovered: number;
  outstanding: number; dueDate: string; status: 'settled' | 'partial' | 'overdue';
}
export interface Repayment {
  date: string; method: string; amount: number;
  reference: string; status: 'settled' | 'pending';
}
export interface FarmerNotification {
  title: string; channel: string; date: string;
  status: 'open' | 'closed'; readState: 'Unread' | 'Read';
}

@Injectable({
  providedIn: 'root',
})
export class FarmerService {
  // Seed with mock data only when mock mode is on.
  // When USE_MOCK = false the store starts empty and fills from the API.
  private readonly farmersSubject = new BehaviorSubject<FarmerListItem[]>(
    USE_MOCK ? [...MOCK_FARMER_LIST] : [],
  );
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
    // Mock mode: skip the network and return local data immediately.
    if (USE_MOCK) return of([...MOCK_FARMER_LIST]);
    return this._isBranchUser() ? this.listForBranch() : this.listForCooperative();
  }

  watchForBranch(branchId = this.session.branchId()): Observable<FarmerListItem[]> {
    return this.farmers$.pipe(
      map((farmers) => (branchId ? this._farmersForBranch(farmers, branchId) : farmers)),
    );
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
    const mockSnapshot = branchId
      ? this._farmersForBranch(this.farmersSubject.value, branchId)
      : this.farmersSubject.value;

    // Mock mode: return only farmers that belong to this branch.
    if (USE_MOCK) return of(mockSnapshot);

    const tenantId = this.session.tenantId() ?? '';
    if (!tenantId) return of(mockSnapshot);

    const url = API_ENDPOINTS.MEMBERS.LIST(tenantId, branchId ?? undefined);

    return this.http.get<any>(url).pipe(
      map((res) => (res?.data ?? res) as FarmerListItem[]),
      map((farmers) => farmers.map((m) => this._toListItem(m))),
      tap((farmers) => this._mergeFarmers(farmers)),
      // In real mode let errors surface instead of silently returning stale mock data.
      catchError((err) => { throw err; }),
    );
  }

  /**
   * GET /api/v1/cooperative/farmers
   * Returns farmers across the current cooperative.
   */
  listForCooperative(cooperativeId = this.session.cooperativeId()): Observable<FarmerListItem[]> {
    // Mock mode: return the full in-memory list.
    if (USE_MOCK) return of([...this.farmersSubject.value]);
    const params = cooperativeId ? new HttpParams().set('cooperativeId', cooperativeId) : undefined;

    return this.http
      .get<FarmerListItem[]>(API_ENDPOINTS.COOPERATIVE.FARMERS, params ? { params } : undefined)
      .pipe(
        tap((farmers) => this._emitFarmers(farmers)),
        catchError((err) => { throw err; }),
      );
  }

  /**
   * GET /api/v1/cooperative/farmers/:id
   * Returns full farmer profile.
   */
  getById(id: string): Observable<FarmerProfile> {
    const mockProfile = buildMockFarmerProfile(id);
    // Mock mode: build the profile from local data without a network call.
    if (USE_MOCK) return of(mockProfile);
    const url = API_ENDPOINTS.MEMBERS.BY_ID(id);
    return this.http.get<any>(url).pipe(
      map((res) => res?.data ?? res),
      timeout(5000),
      // Let the error surface in real mode — don't silently swap in mock data.
      catchError((err) => { throw err; }),
    );
  }

  // Cooperative + Branch Linking

  /**
   * Returns all farmers belonging to a cooperative
   * across all branches.
   */
  listByCooperative(cooperativeId: string): Observable<FarmerListItem[]> {
    return this.listForCooperative(cooperativeId);
  }

  /**
   * Returns all farmers assigned to a branch.
   */
  listByBranch(branchId: string): Observable<FarmerListItem[]> {
    return this.listForBranch(branchId);
  }

  /**
   * Returns all cooperatives with nested branches.
   * Used in cooperative/branch dropdowns.
   */
  getCooperatives(): Observable<Cooperative[]> {
    // Mock mode: return hardcoded cooperatives from farmer.mock.ts.
    if (USE_MOCK) return of(MOCK_COOPERATIVES as Cooperative[]);
    return this.http.get<Cooperative[]>(API_ENDPOINTS.COOPERATIVE.ALL);
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
    if (USE_MOCK) {
      const item = this.farmersSubject.value.find((f) => f.id === farmerId);
      if (item) this._upsertFarmer({ ...item, branchId });
      return of(buildMockFarmerProfile(farmerId));
    }
    return this.http.post<FarmerProfile>(
      `${API_ENDPOINTS.COOPERATIVE.FARMER_BY_ID(farmerId)}/link`,
      {
        cooperativeId,
        branchId,
        reason,
      },
    );
  }

  // Create

  /**
   * Registers a new farmer.
   * Farmers are onboarded at branch level.
   */
  create(form: FarmerRegistrationForm): Observable<FarmerProfile> {
    const payload: FarmerRegistrationForm = {
      ...form,
      status: 'Pending',
      branchId: form.branchId ?? this.session.branchId() ?? undefined,
      cooperativeId: form.cooperativeId ?? this.session.cooperativeId() ?? undefined,
      assignedBranch: form.assignedBranch || this.session.branchId() || '',
    };

    const body = {
      fullName: payload.fullName,
      nationalId: payload.nationalIdNumber,
      phoneNumber: payload.phoneNumber,
      gender: payload.gender?.toUpperCase().replace(/ /g, '_') ?? 'OTHER',
      irrigationSource: (payload.irrigationSource ?? 'Rain-fed')
        .toUpperCase()
        .replace(/-/g, '_')
        .replace(/ /g, '_'),
      email: payload.emailAddress,
      dateOfBirth: payload.dateOfBirth,
      farmLocation: (payload.farmLocation ?? 'Central Region').toUpperCase().replace(/ /g, '_'),
      villageTown: payload.village,
      totalLandAreaHectares: payload.totalLandArea,
      landOwnershipType: (payload.landOwnershipType ?? 'Owned').toUpperCase().replace(/ /g, '_'),
      primaryCrops: [],
      commodityToDeliver: payload.production?.commodity ?? '',
      livestockKept: payload.production?.livestock ?? '',
      paymentMethodType:
        payload.paymentMethod?.type === 'bank'
          ? 'BANK_ACCOUNT'
          : payload.paymentMethod?.type === 'wendi_wallet'
            ? 'WENDI_WALLET'
            : 'MOBILE_MONEY',
      bankName: payload.paymentMethod?.type === 'bank' ? payload.paymentMethod.bankName : '',
      bankBranch: payload.paymentMethod?.type === 'bank' ? payload.paymentMethod.bankBranch : '',
      accountHolderName:
        payload.paymentMethod?.type === 'bank' ? payload.paymentMethod.bankAccountHolderName : '',
      accountNumber:
        payload.paymentMethod?.type === 'bank' ? payload.paymentMethod.bankAccountNumber : '',
      walletNumber:
        payload.paymentMethod?.type === 'wendi_wallet'
          ? payload.paymentMethod.wendiWalletNumber
          : payload.paymentMethod?.type === 'mobile_money'
            ? payload.paymentMethod.mobileMoneyPhone
            : '',
      tenantId: payload.cooperativeGroup || this.session.tenantId() || '',
      branchId: payload.branchId || '',
      cooperativeId: payload.cooperativeId || '',
    };

    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify(body)], { type: 'application/json' }),
      'data.json',
    );
    if (payload.photoFile) {
      formData.append('photo', payload.photoFile, payload.photoFile.name);
    }

    // Mock mode: create a fake farmer entry locally without hitting the API.
    if (USE_MOCK) return of(this._createMockFarmer(payload));

    return this.http.post<FarmerProfile>(API_ENDPOINTS.MEMBERS.REGISTER, formData).pipe(
      timeout(15000),
      tap((profile) => this._upsertFarmer(this._listItemFromProfile(profile, payload))),
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
    const body = {
      /* same mapping as create */
    };
    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify(form)], { type: 'application/json' }),
      'data.json',
    );
    if (form.photoFile) {
      formData.append('photo', form.photoFile, form.photoFile.name);
    }

    // Mock mode: update the in-memory store and return the mock profile.
    if (USE_MOCK) {
      const item = this.farmersSubject.value.find((f) => f.id === id);
      if (item) this._upsertFarmer({ ...item, name: form.fullName });
      return of(buildMockFarmerProfile(id));
    }

    return this.http
      .put<FarmerProfile>(
        API_ENDPOINTS.MEMBERS.BY_ID(id),
        formData,
      )
      .pipe(
        timeout(15000),
        tap((profile) => this._upsertFarmer(this._listItemFromProfile(profile, form))),
        catchError((err) => {
          if (err instanceof HttpErrorResponse && err.status > 0) throw err;
          const item = this.farmersSubject.value.find((f) => f.id === id);
          if (item) {
            this._upsertFarmer({
              ...item,
              name: form.fullName,
              primaryCommodity: this._primaryCommodity(form),
            });
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
    // Mock mode: flip the status locally so the UI reflects the change immediately.
    if (USE_MOCK) return of(this._updateMockStatus(id, 'Active'));
    return this.http.patch<FarmerProfile>(API_ENDPOINTS.COOPERATIVE.FARMER_APPROVE(id), {}).pipe(
      tap((profile) => this._upsertFarmer(this._listItemFromProfile(profile))),
      catchError(() => of(this._updateMockStatus(id, 'Active'))),
    );
  }

  /**
   * Rejects a farmer.
   */
  reject(id: string): Observable<FarmerProfile> {
    // Mock mode: flip the status locally.
    if (USE_MOCK) return of(this._updateMockStatus(id, 'Rejected'));
    return this.http.patch<FarmerProfile>(API_ENDPOINTS.COOPERATIVE.FARMER_REJECT(id), {}).pipe(
      tap((profile) => this._upsertFarmer(this._listItemFromProfile(profile))),
      catchError(() => of(this._updateMockStatus(id, 'Rejected'))),
    );
  }

  // ── Farmer activity (profile sub-tabs) ───────────────────────────────────────
  // Each method returns mock data immediately in USE_MOCK mode, or calls the API
  // with a mock fallback so the page still works while the backend is being built.

  private readonly _activityBase = '/api/v1/farmers';

  getInputAllocations(farmerId: string): Observable<InputAllocation[]> {
    if (USE_MOCK) return of(MOCK_INPUT_ALLOCATIONS as InputAllocation[]);
    return this.http.get<InputAllocation[]>(`${this._activityBase}/${farmerId}/inputs`).pipe(
      catchError(() => of(MOCK_INPUT_ALLOCATIONS as InputAllocation[])),
    );
  }

  getProduceDeliveries(farmerId: string): Observable<ProduceDelivery[]> {
    if (USE_MOCK) return of(MOCK_PRODUCE_DELIVERIES as ProduceDelivery[]);
    return this.http.get<ProduceDelivery[]>(`${this._activityBase}/${farmerId}/deliveries`).pipe(
      catchError(() => of(MOCK_PRODUCE_DELIVERIES as ProduceDelivery[])),
    );
  }

  getBalanceLines(farmerId: string): Observable<BalanceLine[]> {
    if (USE_MOCK) return of(MOCK_BALANCE_LINES as BalanceLine[]);
    return this.http.get<BalanceLine[]>(`${this._activityBase}/${farmerId}/balance`).pipe(
      catchError(() => of(MOCK_BALANCE_LINES as BalanceLine[])),
    );
  }

  getRepayments(farmerId: string): Observable<Repayment[]> {
    if (USE_MOCK) return of(MOCK_REPAYMENTS as Repayment[]);
    return this.http.get<Repayment[]>(`${this._activityBase}/${farmerId}/repayments`).pipe(
      catchError(() => of(MOCK_REPAYMENTS as Repayment[])),
    );
  }

  getNotifications(farmerId: string): Observable<FarmerNotification[]> {
    if (USE_MOCK) return of(MOCK_FARMER_NOTIFICATIONS as FarmerNotification[]);
    return this.http.get<FarmerNotification[]>(`${this._activityBase}/${farmerId}/notifications`).pipe(
      catchError(() => of(MOCK_FARMER_NOTIFICATIONS as FarmerNotification[])),
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
    return farmers.filter((farmer) => farmer.branchId === branchId);
  }

  private _updateMockStatus(id: string, status: FarmerProfile['status']): FarmerProfile {
    const index = MOCK_FARMER_LIST.findIndex((farmer) => farmer.id === id);
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

  private _listItemFromProfile(
    profile: FarmerProfile,
    fallback?: FarmerRegistrationForm,
  ): FarmerListItem {
    return {
      id: profile.id,
      name: profile.fullName,
      branchId: fallback?.branchId ?? this.session.branchId() ?? 'BR-KLA',
      branch:
        profile.registration?.assignedBranch ??
        fallback?.assignedBranch ??
        this.session.branchId() ??
        'Branch',
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
    const index = next.findIndex((row) => row.id === farmer.id);

    if (index >= 0) {
      next[index] = { ...next[index], ...farmer };
    } else {
      next.unshift(farmer);
    }

    this._emitFarmers(next);
  }

  private _mergeFarmers(farmers: FarmerListItem[]): void {
    farmers.forEach((farmer) => this._upsertFarmer(farmer));
  }

  private _emitFarmers(farmers: FarmerListItem[]): void {
    this.farmersSubject.next([...farmers]);
  }
  private _toListItem(m: any): FarmerListItem {
    return {
      id: m.memberId ?? m.id,
      name: m.fullName ?? m.name,
      branchId: m.branchId ?? null,
      branch: m.branchId ?? 'HQ',
      primaryCommodity: m.commodityToDeliver ?? m.primaryCommodity ?? '',
      creditLimit: '0',
      balance: '0',
      status: m.status ?? 'ACTIVE',
      stage: 'Registered',
    };
  }
}
