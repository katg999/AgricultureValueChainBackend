import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { BranchDelivery, DeliveryFilter } from '../delivery-lists/delivery-coop-model';

@Injectable({
  providedIn: 'root'
})
export class BranchDeliveryService {
  private readonly API_URL = '/api/finance/branch-deliveries'; // Update with real endpoint

  constructor(private http: HttpClient) {}

  getDeliveries(filters?: DeliveryFilter): Observable<BranchDelivery[]> {
    // Simulate API call for demo (replace with real HttpClient call)
    return of(this.getMockData()).pipe(
      delay(600), // Simulate network latency
      map(deliveries => this.applyFilters(deliveries, filters)),
      catchError(error => {
        console.error('Failed to fetch branch deliveries:', error);
        return throwError(() => new Error('Failed to load deliveries. Please try again.'));
      })
    );
  }

  private getMockData(): BranchDelivery[] {
    return [
      {
        id: 'DL-B001',
        status: 'Completed',
        branchName: 'Kasese Central',
        branchCode: 'KAS-CEN',
        commodity: 'Arabica Coffee',
        estimatedValueUGX: 24500000,
        repaymentRule: '15% Post-Harvest',
        deliveryDate: '2026-05-20'
      },
      {
        id: 'DL-B002',
        status: 'In-Progress',
        branchName: 'Mpondwe Hub',
        branchCode: 'MPD-HUB',
        commodity: 'Maize',
        estimatedValueUGX: 8750000,
        repaymentRule: 'Standard Input Offset',
        deliveryDate: '2026-05-22'
      },
      // Add more mock data as needed
    ];
  }

  private applyFilters(data: BranchDelivery[], filters?: DeliveryFilter): BranchDelivery[] {
    if (!filters) return data;

    return data.filter(item => {
      const matchesSearch = !filters.searchTerm || 
        item.branchName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.branchCode.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesBranch = !filters.branchId || item.branchCode === filters.branchId;
      const matchesCategory = !filters.category || filters.category === 'All' || 
        item.commodity.toLowerCase().includes(filters.category.toLowerCase());

      return matchesSearch && matchesBranch && matchesCategory;
    });
  }
}