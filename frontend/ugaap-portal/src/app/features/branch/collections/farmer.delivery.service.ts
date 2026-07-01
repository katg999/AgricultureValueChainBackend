import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { FarmerDelivery, FarmerDeliveryCreateDTO, FarmerDeliveryUpdateDTO } from './farmer.delivery.model';
import { MOCK_FARMER_DELIVERY_RECORDS } from '../../../core/mock/mock-branch';
import { USE_MOCK } from '../../../core/mock/mock-config';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class FarmerDeliveryService {
  // Map the shared mock records to the FarmerDelivery shape so the list page shows
  // data in dev mode without needing a running backend.
  private readonly seed: FarmerDelivery[] = MOCK_FARMER_DELIVERY_RECORDS.map(r => ({
    id:               r.id,
    branchDeliveryId: r.deliveryBatchId,   // kept so getByBatchId() can filter in-memory
    farmerId:         r.farmerId,
    farmerName:       r.farmerName,
    commodity:        r.commodity,
    volume:           r.volume,
    unitPrice:        r.unitPrice,
    estimatedValue:   r.estimatedValue,
    grade:            r.grade,
    status:           r.status as 'Pending' | 'Approved' | 'Rejected',
    season:           r.season as string,
    session:          r.session as string | undefined,
    createdAt:        new Date(r.deliveryDate),
    updatedAt:        new Date(r.deliveryDate),
  }));

  // When USE_MOCK is false, start empty — the real API call fills this.
  private readonly _deliveries$ = new BehaviorSubject<FarmerDelivery[]>(USE_MOCK ? [...this.seed] : []);
  readonly deliveries$ = this._deliveries$.asObservable();

  private readonly baseUrl = API_ENDPOINTS.BRANCH.FARMER_DELIVERIES;

  // Start after the highest seed id (FDR-021) so mock-created records never collide.
  private nextMockId = this.seed.length + 1;

  constructor(private readonly http: HttpClient) {}

  getPaginated(
    page: number,
    size: number,
    filters?: { farmerName?: string; season?: string; status?: string }
  ): Observable<PaginatedResponse<FarmerDelivery>> {
    if (USE_MOCK) {
      return of(this.paginateMock(page, size, filters));
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.farmerName) params = params.set('farmerName', filters.farmerName);
      if (filters.season)     params = params.set('season', filters.season);
      if (filters.status)     params = params.set('status', filters.status);
    }

    return this.http.get<PaginatedResponse<FarmerDelivery>>(`${this.baseUrl}/paginated`, { params }).pipe(
      tap(response => this._deliveries$.next(response.content)),
      catchError(this.handleError),
    );
  }

  searchByName(farmerName: string): Observable<FarmerDelivery[]> {
    if (USE_MOCK) {
      const term = farmerName.trim().toLowerCase();
      return of(this._deliveries$.value.filter(d => d.farmerName.toLowerCase().includes(term)));
    }

    const params = new HttpParams().set('farmerName', farmerName);
    return this.http.get<FarmerDelivery[]>(`${this.baseUrl}/search`, { params }).pipe(
      tap(deliveries => this._deliveries$.next(deliveries)),
      catchError(this.handleError),
    );
  }

  create(dto: FarmerDeliveryCreateDTO): Observable<FarmerDelivery> {
    if (USE_MOCK) {
      const newDelivery = this.buildMockDelivery(dto);
      this._deliveries$.next([newDelivery, ...this._deliveries$.value]);
      return of(newDelivery);
    }

    return this.http.post<FarmerDelivery>(this.baseUrl, dto).pipe(
      tap(newDelivery => {
        this._deliveries$.next([newDelivery, ...this._deliveries$.value]);
      }),
      catchError(this.handleError),
    );
  }

  partialUpdate(id: string, dto: FarmerDeliveryUpdateDTO): Observable<FarmerDelivery> {
    if (USE_MOCK) {
      const list = this._deliveries$.value;
      const index = list.findIndex(d => d.id === id);
      if (index === -1) {
        return throwError(() => new Error(`Delivery ${id} not found.`));
      }
      const updated = { ...list[index], ...dto, updatedAt: new Date() };
      this._deliveries$.next([...list.slice(0, index), updated, ...list.slice(index + 1)]);
      return of(updated);
    }

    return this.http.patch<FarmerDelivery>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(updatedDelivery => {
        const list = this._deliveries$.value;
        const index = list.findIndex(d => d.id === id);
        if (index !== -1) {
          const updated = [...list];
          updated[index] = updatedDelivery;
          this._deliveries$.next(updated);
        }
      }),
      catchError(this.handleError),
    );
  }

  delete(id: string): Observable<void> {
    if (USE_MOCK) {
      this._deliveries$.next(this._deliveries$.value.filter(d => d.id !== id));
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this._deliveries$.next(this._deliveries$.value.filter(d => d.id !== id));
      }),
      catchError(this.handleError),
    );
  }

  // Returns all farmer deliveries that belong to a specific batch (branchDeliveryId).
  // In mock mode, filters in-memory. In live mode, hits the API with a batchId param.
  getByBatchId(batchId: string): Observable<FarmerDelivery[]> {
    if (USE_MOCK) {
      return this._deliveries$.pipe(
        map(all => all.filter(d => (d as any).branchDeliveryId === batchId)),
      );
    }
    const params = new HttpParams().set('batchId', batchId);
    return this.http.get<FarmerDelivery[]>(this.baseUrl, { params }).pipe(
      catchError(() => of(this._deliveries$.value.filter(d => (d as any).branchDeliveryId === batchId))),
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('An infrastructure communication error occurred:', error);
    return throwError(() => new Error(error.message || 'Server error connection failure.'));
  }

  private buildMockDelivery(dto: FarmerDeliveryCreateDTO): FarmerDelivery {
    const now = new Date();
    return {
      id: `FDR-${String(this.nextMockId++).padStart(3, '0')}`,
      farmerName: dto.farmerName,
      commodity: dto.commodity,
      volume: dto.volume,
      estimatedValue: 0,
      status: 'Pending',
      season: dto.season,
      session: dto.session,
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    };
  }

  private paginateMock(
    page: number,
    size: number,
    filters?: { farmerName?: string; season?: string; status?: string },
  ): PaginatedResponse<FarmerDelivery> {
    let content = this._deliveries$.value;

    if (filters?.farmerName) {
      const term = filters.farmerName.trim().toLowerCase();
      content = content.filter(d => d.farmerName.toLowerCase().includes(term));
    }
    if (filters?.season) {
      content = content.filter(d => d.season === filters.season);
    }
    if (filters?.status) {
      content = content.filter(d => d.status === filters.status);
    }

    const start = page * size;
    return {
      content: content.slice(start, start + size),
      totalElements: content.length,
      totalPages: Math.max(Math.ceil(content.length / size), 1),
      size,
      number: page,
    };
  }
}
