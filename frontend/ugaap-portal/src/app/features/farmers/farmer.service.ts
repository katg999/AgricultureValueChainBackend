// ─────────────────────────────────────────────────────────────────────────────
// features/farmers/farmer.service.ts
//
// Farmer domain service — all CRUD operations for farmers.
// Uses HttpClient + API_ENDPOINTS; the auth/tenant interceptors automatically
// attach the Bearer token and cooperative/branch ID headers.
//
// Interfaces are defined in core/models/farmer.model.ts and re-exported
// here for backwards compatibility with existing component imports.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../core/constants/api-endpoints';
import { SessionService } from '../../core/services/session.service';

// Re-export the model types so components that import from this file
// don't need to change their import paths.
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

@Injectable({ providedIn: 'root' })
export class FarmerService {

  constructor(
    private http:    HttpClient,
    private session: SessionService,
  ) {}

  // ── Read ────────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/cooperative/farmers  (or /branch/farmers for branch staff)
   * Returns the slim list view used in the farmer table.
   */
  list(): Observable<FarmerListItem[]> {
    const url = this._isBranchUser()
      ? API_ENDPOINTS.BRANCH.FARMERS
      : API_ENDPOINTS.COOPERATIVE.FARMERS;
    return this.http.get<FarmerListItem[]>(url);
  }

  /**
   * GET /api/v1/cooperative/farmers/:id
   * Returns the full profile used in farmer-detail / approval views.
   */
  getById(id: string): Observable<FarmerProfile> {
    const url = this._isBranchUser()
      ? API_ENDPOINTS.BRANCH.FARMER_BY_ID(id)
      : API_ENDPOINTS.COOPERATIVE.FARMER_BY_ID(id);
    return this.http.get<FarmerProfile>(url);
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/cooperative/farmers
   * Registers a new farmer — status starts as 'Pending'.
   */
  create(form: FarmerRegistrationForm): Observable<FarmerProfile> {
    return this.http.post<FarmerProfile>(API_ENDPOINTS.COOPERATIVE.FARMERS, form);
  }

  // ── Approval workflow ───────────────────────────────────────────────────────

  /**
   * PATCH /api/v1/cooperative/farmers/:id/approve
   * Moves farmer to 'Active' / 'Verified' stage.
   */
  approve(id: string): Observable<FarmerProfile> {
    return this.http.patch<FarmerProfile>(
      API_ENDPOINTS.COOPERATIVE.FARMER_APPROVE(id),
      {},
    );
  }

  /**
   * PATCH /api/v1/cooperative/farmers/:id/reject
   * Moves farmer to 'Rejected' stage.
   */
  reject(id: string): Observable<FarmerProfile> {
    return this.http.patch<FarmerProfile>(
      API_ENDPOINTS.COOPERATIVE.FARMER_REJECT(id),
      {},
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Branch users hit a different base path than cooperative admins.
   * The tenant interceptor adds the correct X-Branch-ID header automatically.
   */
  private _isBranchUser(): boolean {
    return this.session.userRole() === 'branch';
  }
}
