import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { FarmerDelivery, FarmerDeliveryCreateDTO, FarmerDeliveryUpdateDTO } from './farmer.delivery.model';
import { MOCK_FARMER_DELIVERY_RECORDS } from '../../../core/mock/mock-branch';

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
    id:             r.id,
    farmerId:       r.farmerId,
    farmerName:     r.farmerName,
    commodity:      r.commodity,
    volume:         r.volume,
    unitPrice:      r.unitPrice,
    estimatedValue: r.estimatedValue,
    grade:          r.grade,
    status:         r.status as 'Pending' | 'Approved' | 'Rejected',
    season:         r.season as string,
    session:        r.session as string | undefined,
    createdAt:      new Date(r.deliveryDate),
    updatedAt:      new Date(r.deliveryDate),
  }));

  private readonly _deliveries$ = new BehaviorSubject<FarmerDelivery[]>([...this.seed]);
  readonly deliveries$ = this._deliveries$.asObservable();

  private readonly baseUrl = API_ENDPOINTS.BRANCH.FARMER_DELIVERIES;

  constructor(private readonly http: HttpClient) {}

  getPaginated(
    page: number,
    size: number,
    filters?: { farmerName?: string; season?: string; status?: string }
  ): Observable<PaginatedResponse<FarmerDelivery>> {
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
    const params = new HttpParams().set('farmerName', farmerName);
    return this.http.get<FarmerDelivery[]>(`${this.baseUrl}/search`, { params }).pipe(
      tap(deliveries => this._deliveries$.next(deliveries)),
      catchError(this.handleError),
    );
  }

  create(dto: FarmerDeliveryCreateDTO): Observable<FarmerDelivery> {
    return this.http.post<FarmerDelivery>(this.baseUrl, dto).pipe(
      tap(newDelivery => {
        this._deliveries$.next([newDelivery, ...this._deliveries$.value]);
      }),
      catchError(this.handleError),
    );
  }

  partialUpdate(id: string, dto: FarmerDeliveryUpdateDTO): Observable<FarmerDelivery> {
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
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this._deliveries$.next(this._deliveries$.value.filter(d => d.id !== id));
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('An infrastructure communication error occurred:', error);
    return throwError(() => new Error(error.message || 'Server error connection failure.'));
  }
}
