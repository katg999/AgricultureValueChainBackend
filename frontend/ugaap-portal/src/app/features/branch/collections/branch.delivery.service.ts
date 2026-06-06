import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { BranchDelivery, BranchDeliveryFormData, DeliveryStatus, Season } from './branch.delivery.model';

@Injectable({ providedIn: 'root' })
export class BranchDeliveryService {
  private nextDeliveryNumber = 6;

  private deliveries: BranchDelivery[] = [
    // ── Wet Season ──────────────────────────────────────────────────────────
    {
      id: 'BD-001',
      branchId: 'BR-KLA',
      branchName: 'Kampala Central',
      farmerCount: 42,
      commodity: 'Maize',
      volume: 12400,
      estimatedValue: 31000000,
      status: 'Approved',
      season: 'Wet Season',
      createdAt: new Date('2025-05-10'),
      updatedAt: new Date('2025-05-12'),
    },
    {
      id: 'BD-002',
      branchId: 'BR-JIN',
      branchName: 'Jinja East',
      farmerCount: 18,
      commodity: 'Coffee',
      volume: 3200,
      estimatedValue: 19200000,
      status: 'Pending',
      season: 'Wet Season',
      createdAt: new Date('2025-05-15'),
      updatedAt: new Date('2025-05-15'),
    },
    {
      id: 'BD-003',
      branchId: 'BR-MBA',
      branchName: 'Mbarara South',
      farmerCount: 67,
      commodity: 'Beans',
      volume: 8750,
      estimatedValue: 21875000,
      status: 'Pending',
      season: 'Wet Season',
      createdAt: new Date('2025-05-18'),
      updatedAt: new Date('2025-05-18'),
    },
    {
      id: 'BD-006',
      branchId: 'BR-FTP',
      branchName: 'Fort Portal West',
      farmerCount: 31,
      commodity: 'Tea',
      volume: 6800,
      estimatedValue: 17000000,
      status: 'Pending',
      season: 'Wet Season',
      createdAt: new Date('2025-05-22'),
      updatedAt: new Date('2025-05-22'),
    },
    {
      id: 'BD-007',
      branchId: 'BR-ADJ',
      branchName: 'Adjumani East',
      farmerCount: 24,
      commodity: 'Maize',
      volume: 5100,
      estimatedValue: 12750000,
      status: 'Approved',
      season: 'Wet Season',
      createdAt: new Date('2025-05-25'),
      updatedAt: new Date('2025-05-26'),
    },
    // ── Dry Season ──────────────────────────────────────────────────────────
    {
      id: 'BD-004',
      branchId: 'BR-GUL',
      branchName: 'Gulu North',
      farmerCount: 29,
      commodity: 'Sesame',
      volume: 4100,
      estimatedValue: 12300000,
      status: 'Rejected',
      season: 'Dry Season',
      createdAt: new Date('2025-05-08'),
      updatedAt: new Date('2025-05-09'),
    },
    {
      id: 'BD-005',
      branchId: 'BR-MBL',
      branchName: 'Mbale West',
      farmerCount: 55,
      commodity: 'Sunflower',
      volume: 9300,
      estimatedValue: 18600000,
      status: 'Approved',
      season: 'Dry Season',
      createdAt: new Date('2025-05-20'),
      updatedAt: new Date('2025-05-21'),
    },
    {
      id: 'BD-008',
      branchId: 'BR-KIB',
      branchName: 'Kiboga Central',
      farmerCount: 14,
      commodity: 'Vanilla',
      volume: 820,
      estimatedValue: 24600000,
      status: 'Approved',
      season: 'Dry Season',
      createdAt: new Date('2025-05-12'),
      updatedAt: new Date('2025-05-13'),
    },
    {
      id: 'BD-009',
      branchId: 'BR-LIR',
      branchName: 'Lira Town',
      farmerCount: 38,
      commodity: 'Sesame',
      volume: 6200,
      estimatedValue: 15500000,
      status: 'Pending',
      season: 'Dry Season',
      createdAt: new Date('2025-05-16'),
      updatedAt: new Date('2025-05-16'),
    },
    {
      id: 'BD-010',
      branchId: 'BR-MBA2',
      branchName: 'Mbale East',
      farmerCount: 21,
      commodity: 'Coffee',
      volume: 2800,
      estimatedValue: 16800000,
      status: 'Approved',
      season: 'Dry Season',
      createdAt: new Date('2025-05-19'),
      updatedAt: new Date('2025-05-20'),
    },
  ];

  private deliveries$ = new BehaviorSubject<BranchDelivery[]>([...this.deliveries]);

  getDeliveries(): Observable<BranchDelivery[]> {
    return this.deliveries$.asObservable();
  }

  getDeliveriesForBranch(branchId: string | null, branchName?: string | null): Observable<BranchDelivery[]> {
    return this.deliveries$.pipe(
      map(deliveries => {
        // No branch context in session (dev/demo mode) — show all deliveries.
        if (!branchId && !branchName) return deliveries;

        const normalizedName = branchName?.trim().toLowerCase();
        return deliveries.filter(d =>
          (branchId && this.branchIdMatches(d.branchId, branchId)) ||
          (normalizedName && d.branchName.toLowerCase() === normalizedName)
        );
      })
    );
  }

  getDeliveryById(id: string): BranchDelivery | undefined {
    return this.deliveries.find(d => d.id === id);
  }

  addDelivery(form: BranchDeliveryFormData): BranchDelivery {
    const newDelivery: BranchDelivery = {
      ...form,
      id: `BD-${String(this.nextDeliveryNumber++).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const nextDeliveries = [...this.deliveries, newDelivery];
    this.emitDeliveries(nextDeliveries);
    return newDelivery;
  }

  updateDelivery(id: string, form: BranchDeliveryFormData): BranchDelivery | null {
    const idx = this.deliveries.findIndex(d => d.id === id);
    if (idx === -1) return null;
    const updated: BranchDelivery = {
      ...this.deliveries[idx],
      ...form,
      updatedAt: new Date(),
    };
    this.emitDeliveries([
      ...this.deliveries.slice(0, idx),
      updated,
      ...this.deliveries.slice(idx + 1),
    ]);
    return updated;
  }

  deleteDelivery(id: string): void {
    this.emitDeliveries(this.deliveries.filter(d => d.id !== id));
  }

  getSeasonOptions(): Season[] {
    return ['Wet Season', 'Dry Season'];
  }

  getStatusOptions(): DeliveryStatus[] {
    return ['Pending', 'Approved', 'Rejected'];
  }

  getCommodityOptions(): string[] {
    return ['Maize', 'Coffee', 'Beans', 'Sesame', 'Sunflower', 'Rice', 'Sorghum', 'Millet'];
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

  private emitDeliveries(deliveries: BranchDelivery[]): void {
    this.deliveries = deliveries;
    // Emit a fresh array reference so every async-pipe subscriber sees the mutation immediately.
    this.deliveries$.next([...this.deliveries]);
  }
}
