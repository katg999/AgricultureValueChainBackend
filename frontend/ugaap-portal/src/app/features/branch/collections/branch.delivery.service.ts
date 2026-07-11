import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { catchError, startWith, tap, timeout } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { SessionService } from '../../../core/services/session.service';
import { ALL_DELIVERY_SESSIONS, BranchDelivery, BranchDeliveryFormData, DeliveryStatus, DeliverySession, Season } from './branch.delivery.model';
import { MOCK_BRANCH_DELIVERIES } from '../../../core/mock/mock-branch';
import { USE_MOCK } from '../../../core/mock/mock-config';

@Injectable({ providedIn: 'root' })
export class BranchDeliveryService {
  // Start after the highest seed id (BD-038) so programmatic adds never collide.
  private nextId = 39;

  private readonly seed: BranchDelivery[] = MOCK_BRANCH_DELIVERIES;

  // When USE_MOCK is false, start empty — the real API call in getDeliveries() fills this.
  private readonly deliveries$ = new BehaviorSubject<BranchDelivery[]>(USE_MOCK ? [...this.seed] : []);

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {}

  // Two different endpoints — the tenant interceptor handles the headers, not us.
  getDeliveries(): Observable<BranchDelivery[]> {
    const role = this.session.userRole();

    // Match both the short alias ('cooperative') and the JWT full name ('COOPERATIVE_ADMIN').
    const isCoopRole = role === 'cooperative' || role === 'COOPERATIVE_ADMIN';

    // Cooperative:  GET /cooperative/collections
    // Branch:       GET /branch/collections
    const url = isCoopRole ? API_ENDPOINTS.COOPERATIVE.COLLECTIONS : API_ENDPOINTS.BRANCH.COLLECTIONS;

    const snapshot = [...this.deliveries$.value];

    return this.http.get<BranchDelivery[]>(url).pipe(
      timeout(3000),
      tap(rows => this.deliveries$.next(rows)),
      catchError(() => of(snapshot)),
      startWith(snapshot),
    );
  }


  getDeliveriesForBranch(branchId: string | null, branchName?: string | null): Observable<BranchDelivery[]> {
    return this.deliveries$.pipe(
      map(deliveries => {
        // Guard: no branch context at all → return nothing rather than leaking
        // every branch's data.  This happens when a cooperative_admin user
        // navigates to a branch route that doesn't belong to them.
        if (!branchId && !branchName) return [];
        const normalizedName = branchName?.trim().toLowerCase();
        return deliveries.filter(d =>
          (branchId && this.branchIdMatches(d.branchId, branchId)) ||
          (normalizedName && d.branchName.toLowerCase() === normalizedName)
        );
      }),
    );
  }

  // Sync read used by aggregate() in FarmerDeliveryService — must stay synchronous.
  getDeliveryById(id: string): BranchDelivery | undefined {
    return this.deliveries$.value.find(d => d.id === id);
  }

  addDelivery(form: BranchDeliveryFormData): Observable<BranchDelivery> {
    // POST /branch/farmer-deliveries
    return this.http.post<BranchDelivery>(API_ENDPOINTS.BRANCH.FARMER_DELIVERIES, form).pipe(
      timeout(2000),
      tap(d => this.deliveries$.next([...this.deliveries$.value, d])),
      catchError(() => of(this.addMock(form))),
    );
  }


  updateDelivery(id: string, form: BranchDeliveryFormData): Observable<BranchDelivery | null> {
    const rows = this.deliveries$.value;
    const idx = rows.findIndex(d => d.id === id);
    if (idx === -1) return of(null);

    const localUpdated: BranchDelivery = { ...rows[idx], ...form, updatedAt: new Date() };

    // PUT /branch/farmer-deliveries/{id}
    return this.http.put<BranchDelivery>(API_ENDPOINTS.BRANCH.FARMER_DELIVERIES_BY_ID(id), form).pipe(

      timeout(2000),
      tap(updated => this.replaceAt(idx, updated)),
      catchError(() => {
        this.replaceAt(idx, localUpdated);
        return of(localUpdated);
      }),
    );
  }


  deleteDelivery(id: string): Observable<void> {
    // DELETE /branch/farmer-deliveries/{id}
    return this.http.delete<void>(API_ENDPOINTS.BRANCH.FARMER_DELIVERY_BY_ID(id)).pipe(


      timeout(2000),
      tap(() => this.deliveries$.next(this.deliveries$.value.filter(d => d.id !== id))),
      catchError(() => {
        this.deliveries$.next(this.deliveries$.value.filter(d => d.id !== id));
        return of(void 0);
      }),
    );
  }


  getSeasonOptions(): Season[] {
    return ['Wet Season', 'Dry Season'];
  }

  getSessionOptions(): DeliverySession[] {
    return ALL_DELIVERY_SESSIONS;
  }

  getStatusOptions(): DeliveryStatus[] {
    return ['Pending', 'Approved', 'Rejected'];
  }

  getCommodityOptions(): string[] {
    return ['Maize', 'Coffee', 'Beans', 'Sesame', 'Sunflower', 'Rice', 'Sorghum', 'Millet'];
  }

  getVolumeUnitOptions(): string[] {
    return ['KG', 'MT', 'Bags', 'Litres'];
  }

  private addMock(form: BranchDeliveryFormData): BranchDelivery {
    const d: BranchDelivery = {
      ...form,
      id: `BD-${String(this.nextId++).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.deliveries$.next([...this.deliveries$.value, d]);
    return d;
  }

  private replaceAt(idx: number, updated: BranchDelivery): void {
    const rows = this.deliveries$.value;
    this.deliveries$.next([...rows.slice(0, idx), updated, ...rows.slice(idx + 1)]);
  }

  private branchIdMatches(deliveryBranchId: string | undefined, sessionBranchId: string): boolean {
    if (!deliveryBranchId) return false;
    if (deliveryBranchId === sessionBranchId) return true;
    const aliases: Record<string, string[]> = {
      'BR-KLA': ['branch-kampala-central'],
      'BR-JIN': ['branch-jinja-east'],
      'BR-MBA': ['branch-mbarara-south'],
      'BR-GUL': ['branch-gulu-north'],
      'BR-MBL': ['branch-mbale-west'],
    };
    return aliases[deliveryBranchId]?.includes(sessionBranchId) ?? false;
  }
}
