import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { FarmerDelivery, FarmerDeliveryFormData } from './farmer.delivery.model';
import { BranchDeliveryService } from './branch.delivery.service';

@Injectable({ providedIn: 'root' })
export class FarmerDeliveryService {

  private farmers: FarmerDelivery[] = [
    // ── Wet Season — BD-001 (Kampala Central, Maize) ────────────────────────
    { id: 'FD-001', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00101', farmerName: 'Akello Grace',      phone: '0772100001', commodity: 'Maize',    volume: 320,  estimatedValue:   800_000, notes: 'Grade A quality',   status: 'Approved', season: 'Wet Season', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
    { id: 'FD-002', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00102', farmerName: 'Okello James',      phone: '0754200002', commodity: 'Maize',    volume: 410,  estimatedValue: 1_025_000, notes: '',                  status: 'Approved', season: 'Wet Season', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
    { id: 'FD-003', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00103', farmerName: 'Achen Beatrice',    phone: '0701300103', commodity: 'Maize',    volume: 290,  estimatedValue:   725_000, notes: 'Slight moisture',   status: 'Approved', season: 'Wet Season', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },

    // ── Wet Season — BD-002 (Jinja East, Coffee) ────────────────────────────
    { id: 'FD-004', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00201', farmerName: 'Namukasa Fatuma',   phone: '0782400201', commodity: 'Coffee',   volume: 180,  estimatedValue: 1_080_000, notes: 'Dried beans',       status: 'Pending',  season: 'Wet Season', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },
    { id: 'FD-005', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00202', farmerName: 'Waiswa Stephen',    phone: '0772100202', commodity: 'Coffee',   volume: 220,  estimatedValue: 1_320_000, notes: '',                  status: 'Pending',  season: 'Wet Season', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },

    // ── Wet Season — BD-003 (Mbarara South, Beans) ──────────────────────────
    { id: 'FD-006', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00301', farmerName: 'Tukwasibwe Robert', phone: '0754200301', commodity: 'Beans',    volume: 200,  estimatedValue:   500_000, notes: '',                  status: 'Pending',  season: 'Wet Season', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },
    { id: 'FD-007', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00302', farmerName: 'Asiimwe Doreen',    phone: '0701300302', commodity: 'Beans',    volume: 155,  estimatedValue:   387_500, notes: 'Well sorted',       status: 'Pending',  season: 'Wet Season', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },

    // ── Wet Season — BD-006 (Fort Portal West, Tea) ─────────────────────────
    { id: 'FD-008', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00601', farmerName: 'Birungi Harriet',   phone: '0772100601', commodity: 'Tea',      volume: 240,  estimatedValue:   600_000, notes: 'Fresh leaf',        status: 'Pending',  season: 'Wet Season', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },
    { id: 'FD-009', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00602', farmerName: 'Ntegeka Paul',      phone: '0754200602', commodity: 'Tea',      volume: 310,  estimatedValue:   775_000, notes: '',                  status: 'Pending',  season: 'Wet Season', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },
    { id: 'FD-010', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00603', farmerName: 'Kagaba Prossy',     phone: '0701300603', commodity: 'Tea',      volume: 195,  estimatedValue:   487_500, notes: 'Slightly wilted',   status: 'Pending',  season: 'Wet Season', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },

    // ── Wet Season — BD-007 (Adjumani East, Maize) ──────────────────────────
    { id: 'FD-011', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00701', farmerName: 'Ongom Felix',       phone: '0782400701', commodity: 'Maize',    volume: 275,  estimatedValue:   687_500, notes: '',                  status: 'Approved', season: 'Wet Season', createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },
    { id: 'FD-012', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00702', farmerName: 'Adola Christine',   phone: '0772100702', commodity: 'Maize',    volume: 190,  estimatedValue:   475_000, notes: 'Grade B',           status: 'Approved', season: 'Wet Season', createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },

    // ── Dry Season — BD-004 (Gulu North, Sesame) ────────────────────────────
    { id: 'FD-013', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00401', farmerName: 'Drani Moses',       phone: '0754200401', commodity: 'Sesame',   volume: 185,  estimatedValue: 1_110_000, notes: 'Clean grain',       status: 'Approved', season: 'Dry Season', createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },
    { id: 'FD-014', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00402', farmerName: 'Oryema Denis',      phone: '0701300402', commodity: 'Sesame',   volume: 140,  estimatedValue:   840_000, notes: '',                  status: 'Approved', season: 'Dry Season', createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },

    // ── Dry Season — BD-005 (Mbale West, Sunflower) — dev mock user's branch ─
    { id: 'FD-015', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00501', farmerName: 'Oryem Patrick',     phone: '0782400501', commodity: 'Sunflower', volume: 260, estimatedValue:   780_000, notes: '',                  status: 'Approved', season: 'Dry Season', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
    { id: 'FD-016', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00502', farmerName: 'Opio Geoffrey',     phone: '0772100502', commodity: 'Sunflower', volume: 210, estimatedValue:   630_000, notes: 'Slightly under-dry', status: 'Approved', season: 'Dry Season', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },

    // ── Dry Season — BD-008 (Kiboga Central, Vanilla) ───────────────────────
    { id: 'FD-017', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00801', farmerName: 'Ssemakula John',    phone: '0754200801', commodity: 'Vanilla',  volume:  48,  estimatedValue: 4_800_000, notes: 'Export grade',      status: 'Approved', season: 'Dry Season', createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },
    { id: 'FD-018', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00802', farmerName: 'Katende Robert',    phone: '0701300802', commodity: 'Vanilla',  volume:  36,  estimatedValue: 3_600_000, notes: '',                  status: 'Approved', season: 'Dry Season', createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },

    // ── Dry Season — BD-009 (Lira Town, Sesame) ─────────────────────────────
    { id: 'FD-019', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00901', farmerName: 'Atim Lydia',        phone: '0782400901', commodity: 'Sesame',   volume: 170,  estimatedValue: 1_020_000, notes: '',                  status: 'Pending',  season: 'Dry Season', createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },
    { id: 'FD-020', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00902', farmerName: 'Okot Geoffrey',     phone: '0772100902', commodity: 'Sesame',   volume: 130,  estimatedValue:   780_000, notes: 'Re-dried',          status: 'Pending',  season: 'Dry Season', createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },

    // ── Dry Season — BD-010 (Mbale East, Coffee) ────────────────────────────
    { id: 'FD-021', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01001', farmerName: 'Wafula Emmanuel',   phone: '0754201001', commodity: 'Coffee',   volume: 200,  estimatedValue: 1_200_000, notes: 'Arabica AA',        status: 'Approved', season: 'Dry Season', createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },
    { id: 'FD-022', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01002', farmerName: 'Nakato Prossy',     phone: '0701301002', commodity: 'Coffee',   volume: 155,  estimatedValue:   930_000, notes: '',                  status: 'Approved', season: 'Dry Season', createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },
  ];

  private farmers$ = new BehaviorSubject<FarmerDelivery[]>([...this.farmers]);
  private counter = 22;

  constructor(private branchSvc: BranchDeliveryService) {}

  /** All farmer deliveries as observable */
  getAll(): Observable<FarmerDelivery[]> {
    return this.farmers$.asObservable();
  }

  /**
   * Role-scoped delivery stream.
   * - branch user → only deliveries for their branchId
   * - cooperative_admin (or unknown) → all deliveries
   */
  allForRole$(branchId: string | null | undefined, role: string | null | undefined): Observable<FarmerDelivery[]> {
    return this.farmers$.pipe(
      map(deliveries => {
        if (role === 'branch' && branchId) return deliveries.filter(d => d.branchId === branchId);
        return deliveries;
      }),
    );
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
      status: branch.status,   // status not touched by aggregation
      season: branch.season,   // season not touched by aggregation
    });
  }
}
