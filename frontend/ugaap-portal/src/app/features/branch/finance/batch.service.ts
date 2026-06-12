import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BatchFarmerFormData, BatchFarmerRecord, BatchFormData, BatchRecord, BatchStatus } from './batch.model';

const MOCK_BATCHES: BatchRecord[] = [
  { id: 'BCH-2024-0091', branchId: 'BR-MBL', batchName: 'Arabica Q3 Harvest - Mbale',       season: 'Dry Season', createdAt: new Date('2024-09-04'), closedAt: new Date('2024-09-10'), status: 'settled',   farmerCount: 3, grossAmount: 4_850_000, deductions: 320_000, netPayable: 4_530_000 },
  { id: 'BCH-2024-0098', branchId: 'BR-MBL', batchName: 'Robusta Wet Season - Mbale',       season: 'Wet Season', createdAt: new Date('2024-10-02'), closedAt: null,                  status: 'pending',   farmerCount: 2, grossAmount: 2_600_000, deductions: 180_000, netPayable: 2_420_000 },
  { id: 'BCH-2024-0092', branchId: 'BR-MBA', batchName: 'Robusta Wet-Processed - Masaka',   season: 'Wet Season', createdAt: new Date('2024-09-06'), closedAt: new Date('2024-09-12'), status: 'processed', farmerCount: 2, grossAmount: 3_200_000, deductions: 210_000, netPayable: 2_990_000 },
  { id: 'BCH-2024-0093', branchId: 'BR-GUL', batchName: 'Maize Season A - Gulu North',      season: 'Wet Season', createdAt: new Date('2024-09-10'), closedAt: new Date('2024-09-18'), status: 'pending',   farmerCount: 3, grossAmount: 1_750_000, deductions:  95_000, netPayable: 1_655_000 },
  { id: 'BCH-2024-0094', branchId: 'BR-KIB', batchName: 'Vanilla Export Grade - Kiboga',    season: 'Dry Season', createdAt: new Date('2024-09-12'), closedAt: new Date('2024-09-20'), status: 'settled',   farmerCount: 2, grossAmount: 9_400_000, deductions: 580_000, netPayable: 8_820_000 },
  { id: 'BCH-2024-0095', branchId: 'BR-LIR', batchName: 'Sunflower Seed Batch - Lira',      season: 'Dry Season', createdAt: new Date('2024-09-15'), closedAt: new Date('2024-09-22'), status: 'processed', farmerCount: 2, grossAmount: 2_100_000, deductions: 150_000, netPayable: 1_950_000 },
  { id: 'BCH-2024-0096', branchId: 'BR-FTP', batchName: 'Tea Leaf Collection - Fort Portal', season: 'Wet Season', createdAt: new Date('2024-09-18'), closedAt: new Date('2024-09-25'), status: 'pending',   farmerCount: 3, grossAmount: 6_600_000, deductions: 445_000, netPayable: 6_155_000 },
  { id: 'BCH-2024-0097', branchId: 'BR-ADJ', batchName: 'Sesame Export Lot - Adjumani',     season: 'Dry Season', createdAt: new Date('2024-09-20'), closedAt: new Date('2024-09-27'), status: 'settled',   farmerCount: 2, grossAmount: 3_900_000, deductions: 270_000, netPayable: 3_630_000 },
];

const MOCK_FARMERS: BatchFarmerRecord[] = [
  // BCH-2024-0091 — Arabica Q3, Dry Season
  { id: 'BF-0001', batchId: 'BCH-2024-0091', farmerId: 'F-00412', farmerName: 'Nakato Prossy',   phone: '0772100412', commodity: 'Coffee',    grossAmount: 2_000_000, deductions: 130_000, netPayable: 1_870_000, status: 'settled',   payment: { method: 'mobile_money', provider: 'MTN',    mobileMoneyName: 'Nakato Prossy'   }, addedAt: new Date('2024-09-04') },
  { id: 'BF-0002', batchId: 'BCH-2024-0091', farmerId: 'F-00413', farmerName: 'Wafula Emmanuel', phone: '0754200413', commodity: 'Coffee',    grossAmount: 1_550_000, deductions: 100_000, netPayable: 1_450_000, status: 'settled',   payment: { method: 'bank_account',  bankName: 'Stanbic Bank Uganda',    accountNumber: '9030012300413', accountHolderName: 'Emmanuel Wafula'  }, addedAt: new Date('2024-09-04') },
  { id: 'BF-0003', batchId: 'BCH-2024-0091', farmerId: 'F-00414', farmerName: 'Auma Susan',      phone: '0701300414', commodity: 'Coffee',    grossAmount: 1_300_000, deductions:  90_000, netPayable: 1_210_000, status: 'settled',   payment: { method: 'mobile_money', provider: 'Airtel', mobileMoneyName: 'Susan Auma'      }, addedAt: new Date('2024-09-04') },

  // BCH-2024-0092 — Robusta Wet, Wet Season
  { id: 'BF-0004', batchId: 'BCH-2024-0092', farmerId: 'F-00388', farmerName: 'Okello David',    phone: '0782400388', commodity: 'Coffee',    grossAmount: 1_800_000, deductions: 120_000, netPayable: 1_680_000, status: 'processed', payment: { method: 'mobile_money', provider: 'MTN',    mobileMoneyName: 'David Okello'    }, addedAt: new Date('2024-09-06') },
  { id: 'BF-0005', batchId: 'BCH-2024-0092', farmerId: 'F-00389', farmerName: 'Namutebi Rose',   phone: '0772100389', commodity: 'Coffee',    grossAmount: 1_400_000, deductions:  90_000, netPayable: 1_310_000, status: 'processed', payment: { method: 'mobile_money', provider: 'MTN',    mobileMoneyName: 'Rose Namutebi'   }, addedAt: new Date('2024-09-06') },

  // BCH-2024-0093 — Maize Season A, Wet Season
  { id: 'BF-0006', batchId: 'BCH-2024-0093', farmerId: 'F-00501', farmerName: 'Akello Grace',    phone: '0754200501', commodity: 'Maize',     grossAmount:   700_000, deductions:  38_000, netPayable:   662_000, status: 'pending',   payment: { method: 'mobile_money', provider: 'MTN',    mobileMoneyName: 'Grace Akello'    }, addedAt: new Date('2024-09-10') },
  { id: 'BF-0007', batchId: 'BCH-2024-0093', farmerId: 'F-00502', farmerName: 'Ongom Felix',     phone: '0701300502', commodity: 'Maize',     grossAmount:   600_000, deductions:  30_000, netPayable:   570_000, status: 'pending',   payment: { method: 'mobile_money', provider: 'Airtel', mobileMoneyName: 'Felix Ongom'     }, addedAt: new Date('2024-09-10') },
  { id: 'BF-0008', batchId: 'BCH-2024-0093', farmerId: 'F-00503', farmerName: 'Adola Christine', phone: '0782400503', commodity: 'Maize',     grossAmount:   450_000, deductions:  27_000, netPayable:   423_000, status: 'pending',   payment: { method: 'mobile_money', provider: 'MTN',    mobileMoneyName: 'Christine Adola' }, addedAt: new Date('2024-09-10') },

  // BCH-2024-0094 — Vanilla Export, Dry Season
  { id: 'BF-0009', batchId: 'BCH-2024-0094', farmerId: 'F-00299', farmerName: 'Ssemakula John',  phone: '0772100299', commodity: 'Vanilla',   grossAmount: 5_000_000, deductions: 310_000, netPayable: 4_690_000, status: 'settled',   payment: { method: 'bank_account',  bankName: 'Centenary Bank',         accountNumber: '2010045600299', accountHolderName: 'John Ssemakula'   }, addedAt: new Date('2024-09-12') },
  { id: 'BF-0010', batchId: 'BCH-2024-0094', farmerId: 'F-00300', farmerName: 'Katende Robert',  phone: '0754200300', commodity: 'Vanilla',   grossAmount: 4_400_000, deductions: 270_000, netPayable: 4_130_000, status: 'settled',   payment: { method: 'bank_account',  bankName: 'Stanbic Bank Uganda',    accountNumber: '9030045600300', accountHolderName: 'Robert Katende'   }, addedAt: new Date('2024-09-12') },

  // BCH-2024-0095 — Sunflower, Dry Season
  { id: 'BF-0011', batchId: 'BCH-2024-0095', farmerId: 'F-00614', farmerName: 'Oryem Patrick',   phone: '0701300614', commodity: 'Sunflower', grossAmount: 1_100_000, deductions:  80_000, netPayable: 1_020_000, status: 'processed', payment: { method: 'mobile_money', provider: 'MTN',    mobileMoneyName: 'Patrick Oryem'   }, addedAt: new Date('2024-09-15') },
  { id: 'BF-0012', batchId: 'BCH-2024-0095', farmerId: 'F-00615', farmerName: 'Opio Geoffrey',   phone: '0782400615', commodity: 'Sunflower', grossAmount: 1_000_000, deductions:  70_000, netPayable:   930_000, status: 'processed', payment: { method: 'mobile_money', provider: 'Airtel', mobileMoneyName: 'Geoffrey Opio'   }, addedAt: new Date('2024-09-15') },

  // BCH-2024-0096 — Tea, Wet Season
  { id: 'BF-0013', batchId: 'BCH-2024-0096', farmerId: 'F-00477', farmerName: 'Birungi Harriet', phone: '0772100477', commodity: 'Tea',       grossAmount: 2_500_000, deductions: 170_000, netPayable: 2_330_000, status: 'pending',   payment: { method: 'mobile_money', provider: 'MTN',    mobileMoneyName: 'Harriet Birungi' }, addedAt: new Date('2024-09-18') },
  { id: 'BF-0014', batchId: 'BCH-2024-0096', farmerId: 'F-00478', farmerName: 'Ntegeka Paul',    phone: '0754200478', commodity: 'Tea',       grossAmount: 2_100_000, deductions: 140_000, netPayable: 1_960_000, status: 'pending',   payment: { method: 'bank_account',  bankName: 'PostBank Uganda',        accountNumber: '4050078900478', accountHolderName: 'Paul Ntegeka'     }, addedAt: new Date('2024-09-18') },
  { id: 'BF-0015', batchId: 'BCH-2024-0096', farmerId: 'F-00479', farmerName: 'Kagaba Prossy',   phone: '0701300479', commodity: 'Tea',       grossAmount: 2_000_000, deductions: 135_000, netPayable: 1_865_000, status: 'pending',   payment: { method: 'mobile_money', provider: 'MTN',    mobileMoneyName: 'Prossy Kagaba'   }, addedAt: new Date('2024-09-18') },

  // BCH-2024-0097 — Sesame, Dry Season
  { id: 'BF-0016', batchId: 'BCH-2024-0097', farmerId: 'F-00523', farmerName: 'Drani Moses',     phone: '0782400523', commodity: 'Sesame',    grossAmount: 2_200_000, deductions: 150_000, netPayable: 2_050_000, status: 'settled',   payment: { method: 'mobile_money', provider: 'Airtel', mobileMoneyName: 'Moses Drani'     }, addedAt: new Date('2024-09-20') },
  { id: 'BF-0017', batchId: 'BCH-2024-0097', farmerId: 'F-00524', farmerName: 'Oryema Denis',    phone: '0772100524', commodity: 'Sesame',    grossAmount: 1_700_000, deductions: 120_000, netPayable: 1_580_000, status: 'settled',   payment: { method: 'mobile_money', provider: 'MTN',    mobileMoneyName: 'Denis Oryema'    }, addedAt: new Date('2024-09-20') },
];

@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly batchesSubject = new BehaviorSubject<BatchRecord[]>([...MOCK_BATCHES]);
  private readonly farmersSubject = new BehaviorSubject<BatchFarmerRecord[]>([...MOCK_FARMERS]);
  private farmerCounter = MOCK_FARMERS.length;

  readonly batches$: Observable<BatchRecord[]> = this.batchesSubject.asObservable();
  readonly farmers$: Observable<BatchFarmerRecord[]> = this.farmersSubject.asObservable();

  getBatch(id: string): BatchRecord | undefined {
    return this.batchesSubject.value.find(b => b.id === id);
  }

  farmersForBatch$(batchId: string): Observable<BatchFarmerRecord[]> {
    return this.farmers$.pipe(map(fs => fs.filter(f => f.batchId === batchId)));
  }

  /** Role-scoped batch stream. Branch staff see only their own branch; cooperative admins see all; platform admins see none. */
  batchesForRole$(branchId: string | null | undefined, role: string | null | undefined): Observable<BatchRecord[]> {
    return this.batches$.pipe(
      map(batches => {
        if (role === 'platform_admin') return [];
        if (role === 'branch' && branchId) return batches.filter(b => b.branchId === branchId);
        return batches; // cooperative_admin sees all
      }),
    );
  }

  addBatch(data: BatchFormData): BatchRecord {
    const batch: BatchRecord = {
      id: data.batchId,
      branchId: data.branchId,
      batchName: data.batchName,
      season: data.season,
      createdAt: new Date(),
      closedAt: null,
      status: 'pending',
      farmerCount: 0,
      grossAmount: 0,
      deductions: 0,
      netPayable: 0,
    };
    this.batchesSubject.next([batch, ...this.batchesSubject.value]);
    return batch;
  }

  addFarmer(batchId: string, data: BatchFarmerFormData): BatchFarmerRecord {
    this.farmerCounter++;
    const record: BatchFarmerRecord = {
      ...data,
      id: `BF-${String(this.farmerCounter).padStart(4, '0')}`,
      batchId,
      netPayable: data.grossAmount - data.deductions,
      addedAt: new Date(),
    };
    this.farmersSubject.next([...this.farmersSubject.value, record]);
    this.reAggregate(batchId);
    return record;
  }

  updateFarmer(id: string, data: BatchFarmerFormData): void {
    const farmers = this.farmersSubject.value;
    const idx = farmers.findIndex(f => f.id === id);
    if (idx === -1) return;
    const updated: BatchFarmerRecord = {
      ...farmers[idx],
      ...data,
      netPayable: data.grossAmount - data.deductions,
    };
    const next = [...farmers.slice(0, idx), updated, ...farmers.slice(idx + 1)];
    this.farmersSubject.next(next);
    this.reAggregate(updated.batchId);
  }

  removeFarmer(id: string): void {
    const target = this.farmersSubject.value.find(f => f.id === id);
    if (!target) return;
    this.farmersSubject.next(this.farmersSubject.value.filter(f => f.id !== id));
    this.reAggregate(target.batchId);
  }

  updateBatchStatus(batchId: string, status: BatchStatus): void {
    const batches = this.batchesSubject.value;
    const idx = batches.findIndex(b => b.id === batchId);
    if (idx === -1) return;
    const updated = { ...batches[idx], status };
    this.batchesSubject.next([...batches.slice(0, idx), updated, ...batches.slice(idx + 1)]);
  }

  private reAggregate(batchId: string): void {
    const farmers = this.farmersSubject.value.filter(f => f.batchId === batchId);
    const batches = this.batchesSubject.value;
    const idx = batches.findIndex(b => b.id === batchId);
    if (idx === -1) return;

    const updated: BatchRecord = {
      ...batches[idx],
      farmerCount: farmers.length,
      grossAmount: farmers.reduce((s, f) => s + f.grossAmount, 0),
      deductions:  farmers.reduce((s, f) => s + f.deductions,  0),
      netPayable:  farmers.reduce((s, f) => s + f.netPayable,  0),
    };
    const next = [...batches.slice(0, idx), updated, ...batches.slice(idx + 1)];
    this.batchesSubject.next(next);
  }
}
