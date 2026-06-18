import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { catchError, startWith, tap, timeout } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { SessionService } from '../../../core/services/session.service';
import { ALL_DELIVERY_SESSIONS, BranchDelivery, BranchDeliveryFormData, DeliveryStatus, DeliverySession, Season } from './branch.delivery.model';

@Injectable({ providedIn: 'root' })
export class BranchDeliveryService {
  private nextId = 21;

  private readonly seed: BranchDelivery[] = [
    // ── Wet Season ──────────────────────────────────────────────────────────
    {
      id: 'BD-001',
      branchId: 'BR-KLA',
      branchName: 'Kampala Central',
      farmerCount: 6,
      commodity: 'Maize',
      volume: 12400,
      estimatedValue: 31000000,
      status: 'Approved',
      season: 'Wet Season',
      session: 'morning',
      createdAt: new Date('2025-05-10'),
      updatedAt: new Date('2025-05-12'),
    },
    {
      id: 'BD-002',
      branchId: 'BR-JIN',
      branchName: 'Jinja East',
      farmerCount: 5,
      commodity: 'Coffee',
      volume: 3200,
      estimatedValue: 19200000,
      status: 'Pending',
      season: 'Wet Season',
      session: 'midday',
      createdAt: new Date('2025-05-15'),
      updatedAt: new Date('2025-05-15'),
    },
    {
      id: 'BD-003',
      branchId: 'BR-MBA',
      branchName: 'Mbarara South',
      farmerCount: 5,
      commodity: 'Beans',
      volume: 8750,
      estimatedValue: 21875000,
      status: 'Pending',
      season: 'Wet Season',
      session: 'afternoon',
      createdAt: new Date('2025-05-18'),
      updatedAt: new Date('2025-05-18'),
    },
    {
      id: 'BD-006',
      branchId: 'BR-FTP',
      branchName: 'Fort Portal West',
      farmerCount: 5,
      commodity: 'Tea',
      volume: 6800,
      estimatedValue: 17000000,
      status: 'Pending',
      season: 'Wet Season',
      session: 'morning',
      createdAt: new Date('2025-05-22'),
      updatedAt: new Date('2025-05-22'),
    },
    {
      id: 'BD-007',
      branchId: 'BR-ADJ',
      branchName: 'Adjumani East',
      farmerCount: 4,
      commodity: 'Maize',
      volume: 5100,
      estimatedValue: 12750000,
      status: 'Approved',
      season: 'Wet Season',
      session: 'midday',
      createdAt: new Date('2025-05-25'),
      updatedAt: new Date('2025-05-26'),
    },
    // ── Dry Season ──────────────────────────────────────────────────────────
    {
      id: 'BD-004',
      branchId: 'BR-GUL',
      branchName: 'Gulu North',
      farmerCount: 4,
      commodity: 'Sesame',
      volume: 4100,
      estimatedValue: 12300000,
      status: 'Rejected',
      season: 'Dry Season',
      session: 'afternoon',
      createdAt: new Date('2025-05-08'),
      updatedAt: new Date('2025-05-09'),
    },
    {
      id: 'BD-005',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 6,
      commodity: 'Sunflower',
      volume: 9300,
      estimatedValue: 18600000,
      status: 'Approved',
      season: 'Dry Season',
      session: 'morning',
      createdAt: new Date('2025-05-20'),
      updatedAt: new Date('2025-05-21'),
    },
    {
      id: 'BD-008',
      branchId: 'BR-KIB',
      branchName: 'Kiboga Central',
      farmerCount: 4,
      commodity: 'Vanilla',
      volume: 820,
      estimatedValue: 24600000,
      status: 'Approved',
      season: 'Dry Season',
      session: 'midday',
      createdAt: new Date('2025-05-12'),
      updatedAt: new Date('2025-05-13'),
    },
    {
      id: 'BD-009',
      branchId: 'BR-LIR',
      branchName: 'Lira Town',
      farmerCount: 5,
      commodity: 'Sesame',
      volume: 6200,
      estimatedValue: 15500000,
      status: 'Pending',
      season: 'Dry Season',
      session: 'afternoon',
      createdAt: new Date('2025-05-16'),
      updatedAt: new Date('2025-05-16'),
    },
    {
      id: 'BD-010',
      branchId: 'BR-MBA2',
      branchName: 'Mbale East',
      farmerCount: 5,
      commodity: 'Coffee',
      volume: 2800,
      estimatedValue: 16800000,
      status: 'Approved',
      season: 'Dry Season',
      session: 'morning',
      createdAt: new Date('2025-05-19'),
      updatedAt: new Date('2025-05-20'),
    },

    // ── Mbale West (BR-MBL) — additional delivery history ───────────────────
    // volume/estimatedValue here are the exact sum of that batch's farmer-level
    // records in FarmerDeliveryService, unlike the older seed rows above.
    {
      id: 'BD-011',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 3,
      commodity: 'Coffee',
      volume: 655,
      estimatedValue: 3930000,
      status: 'Approved',
      season: 'Wet Season',
      session: 'midday',
      createdAt: new Date('2025-06-05'),
      updatedAt: new Date('2025-06-06'),
    },
    {
      id: 'BD-012',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 4,
      commodity: 'Maize',
      volume: 1070,
      estimatedValue: 2675000,
      status: 'Pending',
      season: 'Dry Season',
      session: 'afternoon',
      createdAt: new Date('2025-06-20'),
      updatedAt: new Date('2025-06-20'),
    },
    {
      id: 'BD-013',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 3,
      commodity: 'Beans',
      volume: 525,
      estimatedValue: 1312500,
      status: 'Approved',
      season: 'Wet Season',
      session: 'morning',
      createdAt: new Date('2025-07-10'),
      updatedAt: new Date('2025-07-11'),
    },
    {
      id: 'BD-014',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 3,
      commodity: 'Sesame',
      volume: 425,
      estimatedValue: 2550000,
      status: 'Pending',
      season: 'Dry Season',
      session: 'midday',
      createdAt: new Date('2025-07-25'),
      updatedAt: new Date('2025-07-25'),
    },
    {
      id: 'BD-015',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 4,
      commodity: 'Sunflower',
      volume: 835,
      estimatedValue: 2505000,
      status: 'Approved',
      season: 'Wet Season',
      session: 'afternoon',
      createdAt: new Date('2025-08-08'),
      updatedAt: new Date('2025-08-09'),
    },
    {
      id: 'BD-016',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 3,
      commodity: 'Rice',
      volume: 840,
      estimatedValue: 2940000,
      status: 'Rejected',
      season: 'Dry Season',
      session: 'morning',
      createdAt: new Date('2025-08-22'),
      updatedAt: new Date('2025-08-23'),
    },
    {
      id: 'BD-017',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 3,
      commodity: 'Sorghum',
      volume: 925,
      estimatedValue: 1665000,
      status: 'Pending',
      season: 'Wet Season',
      session: 'midday',
      createdAt: new Date('2025-09-05'),
      updatedAt: new Date('2025-09-05'),
    },
    {
      id: 'BD-018',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 3,
      commodity: 'Millet',
      volume: 635,
      estimatedValue: 1397000,
      status: 'Approved',
      season: 'Dry Season',
      session: 'afternoon',
      createdAt: new Date('2025-09-19'),
      updatedAt: new Date('2025-09-20'),
    },
    {
      id: 'BD-019',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 4,
      commodity: 'Coffee',
      volume: 775,
      estimatedValue: 4650000,
      status: 'Approved',
      season: 'Wet Season',
      session: 'morning',
      createdAt: new Date('2025-10-03'),
      updatedAt: new Date('2025-10-04'),
    },
    {
      id: 'BD-020',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 3,
      commodity: 'Maize',
      volume: 825,
      estimatedValue: 2062500,
      status: 'Pending',
      season: 'Dry Season',
      session: 'midday',
      createdAt: new Date('2025-10-17'),
      updatedAt: new Date('2025-10-17'),
    },
  ];

  private readonly deliveries$ = new BehaviorSubject<BranchDelivery[]>([...this.seed]);

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {}

  // Two different endpoints — the tenant interceptor handles the headers, not us.
  getDeliveries(): Observable<BranchDelivery[]> {
    const role = this.session.userRole();
    const url = role === 'cooperative_admin'
      ? API_ENDPOINTS.COOPERATIVE.COLLECTIONS
      : API_ENDPOINTS.BRANCH.COLLECTIONS;
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
        if (!branchId && !branchName) return deliveries;
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
    return this.http.post<BranchDelivery>(API_ENDPOINTS.BRANCH.COLLECTIONS, form).pipe(
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
    return this.http.put<BranchDelivery>(API_ENDPOINTS.BRANCH.COLLECTION_BY_ID(id), form).pipe(
      timeout(2000),
      tap(updated => this.replaceAt(idx, updated)),
      catchError(() => {
        this.replaceAt(idx, localUpdated);
        return of(localUpdated);
      }),
    );
  }

  deleteDelivery(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.BRANCH.COLLECTION_BY_ID(id)).pipe(
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
