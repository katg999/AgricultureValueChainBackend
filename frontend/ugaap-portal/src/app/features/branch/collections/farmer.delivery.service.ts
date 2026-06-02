import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { FarmerDelivery, FarmerDeliveryFormData } from './farmer.delivery.model';
import { BranchDeliveryService } from './branch.delivery.service';

@Injectable({ providedIn: 'root' })
export class FarmerDeliveryService {

  private farmers: FarmerDelivery[] = [
    {
      id: 'FD-001',
      branchDeliveryId: 'BD-001',
      farmerId: 'UG-F-00101',
      farmerName: 'Akello Grace',
      phone: '0772100001',
      commodity: 'Maize',
      volume: 320,
      estimatedValue: 800000,
      notes: 'Grade A quality',
      status: 'Approved',
      createdAt: new Date('2025-05-10'),
      updatedAt: new Date('2025-05-10'),
    },
    {
      id: 'FD-002',
      branchDeliveryId: 'BD-001',
      farmerId: 'UG-F-00102',
      farmerName: 'Okello James',
      phone: '0754200002',
      commodity: 'Maize',
      volume: 410,
      estimatedValue: 1025000,
      notes: '',
      status: 'Approved',
      createdAt: new Date('2025-05-10'),
      updatedAt: new Date('2025-05-10'),
    },
    {
      id: 'FD-003',
      branchDeliveryId: 'BD-002',
      farmerId: 'UG-F-00201',
      farmerName: 'Namukasa Fatuma',
      phone: '0701300003',
      commodity: 'Coffee',
      volume: 180,
      estimatedValue: 1080000,
      notes: 'Dried beans',
      status: 'Pending',
      createdAt: new Date('2025-05-15'),
      updatedAt: new Date('2025-05-15'),
    },
    {
      id: 'FD-004',
      branchDeliveryId: 'BD-003',
      farmerId: 'UG-F-00301',
      farmerName: 'Tukwasibwe Robert',
      phone: '0782400004',
      commodity: 'Beans',
      volume: 200,
      estimatedValue: 500000,
      notes: '',
      status: 'Pending',
      createdAt: new Date('2025-05-18'),
      updatedAt: new Date('2025-05-18'),
    },
  ];

  private farmers$ = new BehaviorSubject<FarmerDelivery[]>([...this.farmers]);
  private counter = this.farmers.length;

  constructor(private branchSvc: BranchDeliveryService) {}

  /** All farmer deliveries as observable */
  getAll(): Observable<FarmerDelivery[]> {
    return this.farmers$.asObservable();
  }

  /** Farmer deliveries filtered to one branch */
  getByBranch(branchDeliveryId: string): FarmerDelivery[] {
    return this.farmers.filter(f => f.branchDeliveryId === branchDeliveryId);
  }

  /** Add a new farmer delivery and re-aggregate the parent branch when attached */
  add(form: FarmerDeliveryFormData): Observable<FarmerDelivery> {
    this.counter++;
    const entry: FarmerDelivery = {
      ...form,
      id: `FD-${String(this.counter).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.farmers = [...this.farmers, entry];
    this.farmers$.next([...this.farmers]);
    this.aggregate(form.branchDeliveryId);
    return of(entry);
  }

  /** Edit an existing farmer delivery and re-aggregate */
  update(id: string, form: FarmerDeliveryFormData): Observable<FarmerDelivery | null> {
    const idx = this.farmers.findIndex(f => f.id === id);
    if (idx === -1) return of(null);
    const oldBranchId = this.farmers[idx].branchDeliveryId;
    const updated: FarmerDelivery = { ...this.farmers[idx], ...form, updatedAt: new Date() };
    this.farmers = [
      ...this.farmers.slice(0, idx),
      updated,
      ...this.farmers.slice(idx + 1),
    ];
    this.farmers$.next([...this.farmers]);
    // Re-aggregate both old and new branch when the assignment changes.
    this.aggregate(oldBranchId);
    if (form.branchDeliveryId !== oldBranchId) this.aggregate(form.branchDeliveryId);
    return of(updated);
  }

  /** Delete a farmer delivery and re-aggregate its branch when attached */
  delete(id: string): Observable<void> {
    const target = this.farmers.find(f => f.id === id);
    if (!target) return of(void 0);
    this.farmers = this.farmers.filter(f => f.id !== id);
    this.farmers$.next([...this.farmers]);
    this.aggregate(target.branchDeliveryId);
    return of(void 0);
  }

  /**
   * Auto-aggregate: recalculate branch-level totals from all child farmer deliveries.
   * Updates: farmerCount, volume, estimatedValue on the parent BranchDelivery.
   * commodity is derived from the most common commodity among farmers.
   * status stays as-is (managed independently on the branch).
   */
  private aggregate(branchDeliveryId?: string): void {
    if (!branchDeliveryId) return;

    const children = this.farmers.filter(f => f.branchDeliveryId === branchDeliveryId);
    const branch = this.branchSvc.getDeliveryById(branchDeliveryId);
    if (!branch) return;

    const farmerCount = children.length;
    const volume = children.reduce((s, f) => s + (f.volume || 0), 0);
    const estimatedValue = children.reduce((s, f) => s + (f.estimatedValue || 0), 0);

    // Derive dominant commodity
    const commodityCount: Record<string, number> = {};
    children.forEach(f => {
      commodityCount[f.commodity] = (commodityCount[f.commodity] || 0) + 1;
    });
    const commodity = Object.keys(commodityCount).sort(
      (a, b) => commodityCount[b] - commodityCount[a]
    )[0] ?? branch.commodity;

    this.branchSvc.updateDelivery(branchDeliveryId, {
      branchName: branch.branchName,
      farmerCount,
      commodity,
      volume,
      estimatedValue,
      status: branch.status, // status not touched by aggregation
    });
  }
}
