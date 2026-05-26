// ─────────────────────────────────────────────────────────────────────────────
// features/collections/farmer-delivery.service.ts
//
// Delivery (collection) domain service.
// Replaces the previous localStorage implementation with real HTTP calls.
// The auth/tenant interceptors automatically attach the correct headers.
//
// Re-exports DeliveryRecord & DeliveryRegistrationForm from the model file
// so existing component imports don't need to change.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';

// Re-export types for backwards compatibility
export type { DeliveryRecord, DeliveryRegistrationForm } from './farmer-delivery.model';

import type { DeliveryRecord, DeliveryRegistrationForm } from './farmer-delivery.model';

@Injectable({ providedIn: 'root' })
export class DeliveryService {

  constructor(private http: HttpClient) {}

  // ── Read ────────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/branch/collections
   * Returns all delivery records for the current branch.
   * The X-Branch-ID header (set by tenantInterceptor) scopes the results.
   */
  list(): Observable<DeliveryRecord[]> {
    return this.http.get<DeliveryRecord[]>(API_ENDPOINTS.BRANCH.COLLECTIONS);
  }

  /**
   * GET /api/v1/branch/collections/:id
   * Returns a single delivery record.
   */
  getById(id: string): Observable<DeliveryRecord> {
    return this.http.get<DeliveryRecord>(API_ENDPOINTS.BRANCH.COLLECTION_BY_ID(id));
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/branch/collections
   * Records a new farmer delivery — status starts as 'Pending'.
   */
  create(form: DeliveryRegistrationForm): Observable<DeliveryRecord> {
    return this.http.post<DeliveryRecord>(API_ENDPOINTS.BRANCH.COLLECTIONS, form);
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  /**
   * PUT /api/v1/branch/collections/:id
   * Replaces the delivery record with updated form data.
   */
  update(id: string, form: DeliveryRegistrationForm): Observable<DeliveryRecord> {
    return this.http.put<DeliveryRecord>(
      API_ENDPOINTS.BRANCH.COLLECTION_BY_ID(id),
      form,
    );
  }
}
