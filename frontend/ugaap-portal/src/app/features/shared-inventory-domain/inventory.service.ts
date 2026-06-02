import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../core/constants/api-endpoints';
import { SessionService } from '../../core/services/session.service';

export type InventoryScope = 'cooperative' | 'branch';
export type StockStatus = 'healthy' | 'low' | 'out';
export type RecoveryStatus = 'settled' | 'partial' | 'overdue';

export interface BranchOption {
  id: string;
  name: string;
}

export interface FarmerOption {
  id: string;
  name: string;
  phone: string;
  branchId: string;
  branchName: string;
  availableCredit: number;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  categoryClass: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  minThreshold: number;
  stockStatus: StockStatus;
  branchIds: string[];
  branchNames: string[];
  season: string;
  updatedAt: string;
  supplierName: string;
  batchReference: string;
}

export interface AddStockItemPayload {
  itemName: string;
  category: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  receivedDate: string;
  minThreshold: number;
  supplierName: string;
  batchReference: string;
}

export interface BranchStockIssuePayload {
  stockItemId: string;
  branchId: string;
  quantity: number;
  season: string;
}

export interface FarmerStockIssuePayload {
  stockItemId: string;
  farmerId: string;
  quantity: number;
  season: string;
}

export interface BranchDisbursement {
  id: string;
  stockItemId: string;
  branchId: string;
  branchName: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unit: string;
  totalValue: number;
  issueDate: string;
  status: 'issued' | 'received';
}

export interface FarmerAllocation {
  id: string;
  stockItemId: string;
  farmerId: string;
  farmerName: string;
  branchId: string;
  branchName: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unit: string;
  totalValue: number;
  issueDate: string;
  outstanding: number;
  status: RecoveryStatus;
}

const BRANCHES: BranchOption[] = [
  { id: 'BR-KLA', name: 'Kampala Central' },
  { id: 'BR-JIN', name: 'Jinja Branch' },
  { id: 'BR-MBA', name: 'Mbarara Branch' },
  { id: 'BR-GUL', name: 'Gulu Branch' },
  { id: 'BR-MBL', name: 'Mbale Branch' },
];

const FARMERS: FarmerOption[] = [
  { id: 'UG-F-01001', name: 'Amina Nakato', phone: '+256 701 234 567', branchId: 'BR-KLA', branchName: 'Kampala Central', availableCredit: 1500000 },
  { id: 'UG-F-01002', name: 'Moses Okello', phone: '+256 772 456 103', branchId: 'BR-GUL', branchName: 'Gulu Branch', availableCredit: 900000 },
  { id: 'UG-F-01003', name: 'Sarah Namutebi', phone: '+256 755 761 450', branchId: 'BR-JIN', branchName: 'Jinja Branch', availableCredit: 2100000 },
  { id: 'UG-F-01004', name: 'Peter Mugisha', phone: '+256 704 445 901', branchId: 'BR-MBA', branchName: 'Mbarara Branch', availableCredit: 1200000 },
];

const INITIAL_STOCK: StockItem[] = [
  { id: 'STK-001', name: 'NPK Fertilizer', category: 'FERTILIZER', categoryClass: 'fertilizer', quantity: 1250, unit: 'Bags', unitPrice: 180000, minThreshold: 200, stockStatus: 'healthy', branchIds: ['BR-KLA', 'BR-JIN', 'BR-MBA', 'BR-MBL'], branchNames: ['Kampala Central', 'Jinja Branch', 'Mbarara Branch', 'Mbale Branch'], season: '2026A', updatedAt: '2026-05-12', supplierName: 'Agro Inputs Uganda', batchReference: 'BTC-2026-NPK-001' },
  { id: 'STK-002', name: 'Maize Seeds (Longe 5)', category: 'SEEDS', categoryClass: 'seeds', quantity: 2400, unit: 'Kgs', unitPrice: 15000, minThreshold: 500, stockStatus: 'healthy', branchIds: BRANCHES.map(branch => branch.id), branchNames: BRANCHES.map(branch => branch.name), season: '2026A', updatedAt: '2026-05-11', supplierName: 'NARO Seed Centre', batchReference: 'BTC-2026-MAZ-004' },
  { id: 'STK-003', name: 'Spray Pumps (20L)', category: 'EQUIPMENT', categoryClass: 'equipment', quantity: 12, unit: 'Units', unitPrice: 130000, minThreshold: 15, stockStatus: 'low', branchIds: ['BR-MBA', 'BR-GUL'], branchNames: ['Mbarara Branch', 'Gulu Branch'], season: '2026A', updatedAt: '2026-05-09', supplierName: 'Farm Tools Ltd', batchReference: 'BTC-2026-SPR-002' },
  { id: 'STK-004', name: 'Jute Sacks (100kg)', category: 'PACKAGING', categoryClass: 'packaging', quantity: 0, unit: 'Units', unitPrice: 2500, minThreshold: 500, stockStatus: 'out', branchIds: BRANCHES.map(branch => branch.id), branchNames: BRANCHES.map(branch => branch.name), season: '2026A', updatedAt: '2026-05-08', supplierName: 'Harvest Packaging Co.', batchReference: 'BTC-2026-JUT-001' },
];

const INITIAL_BRANCH_DISBURSEMENTS: BranchDisbursement[] = [
  { id: 'BD-1001', stockItemId: 'STK-001', branchId: 'BR-KLA', branchName: 'Kampala Central', itemName: 'NPK Fertilizer', itemType: 'FERTILIZER', quantity: 80, unit: 'Bags', totalValue: 14400000, issueDate: '2026-05-18', status: 'received' },
  { id: 'BD-1002', stockItemId: 'STK-002', branchId: 'BR-GUL', branchName: 'Gulu Branch', itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS', quantity: 300, unit: 'Kgs', totalValue: 4500000, issueDate: '2026-05-19', status: 'issued' },
  { id: 'BD-1003', stockItemId: 'STK-003', branchId: 'BR-MBA', branchName: 'Mbarara Branch', itemName: 'Spray Pumps (20L)', itemType: 'EQUIPMENT', quantity: 4, unit: 'Units', totalValue: 520000, issueDate: '2026-05-20', status: 'received' },
];

const INITIAL_FARMER_ALLOCATIONS: FarmerAllocation[] = [
  { id: 'AL-1001', stockItemId: 'STK-001', farmerId: 'UG-F-01001', farmerName: 'Amina Nakato', branchId: 'BR-KLA', branchName: 'Kampala Central', itemName: 'NPK Fertilizer', itemType: 'FERTILIZER', quantity: 4, unit: 'Bags', totalValue: 720000, issueDate: '2026-05-21', outstanding: 0, status: 'settled' },
  { id: 'AL-1002', stockItemId: 'STK-002', farmerId: 'UG-F-01002', farmerName: 'Moses Okello', branchId: 'BR-GUL', branchName: 'Gulu Branch', itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS', quantity: 30, unit: 'Kgs', totalValue: 450000, issueDate: '2026-05-22', outstanding: 150000, status: 'partial' },
  { id: 'AL-1003', stockItemId: 'STK-003', farmerId: 'UG-F-01003', farmerName: 'Sarah Namutebi', branchId: 'BR-JIN', branchName: 'Jinja Branch', itemName: 'Spray Pumps (20L)', itemType: 'EQUIPMENT', quantity: 1, unit: 'Units', totalValue: 130000, issueDate: '2026-05-23', outstanding: 130000, status: 'overdue' },
];

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly stockSubject = new BehaviorSubject<StockItem[]>(INITIAL_STOCK);
  private readonly branchDisbursementSubject = new BehaviorSubject<BranchDisbursement[]>(INITIAL_BRANCH_DISBURSEMENTS);
  private readonly farmerAllocationSubject = new BehaviorSubject<FarmerAllocation[]>(INITIAL_FARMER_ALLOCATIONS);

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {}

  getBranches(): BranchOption[] {
    return BRANCHES;
  }

  getFarmersForCurrentBranch(): FarmerOption[] {
    const branchId = this.session.branchId() ?? 'BR-KLA';
    return FARMERS.filter(farmer => farmer.branchId === branchId);
  }

  listStock(scope: InventoryScope): Observable<StockItem[]> {
    const url = scope === 'cooperative' ? API_ENDPOINTS.COOPERATIVE.INVENTORY : API_ENDPOINTS.BRANCH.INVENTORY;

    return this.http.get<StockItem[]>(`${url}/stock`).pipe(
      tap(items => this.stockSubject.next(items)),
      catchError(() => of(this.filterStockForScope(scope))),
    );
  }

  addStockItem(payload: AddStockItemPayload): Observable<StockItem> {
    return this.http.post<StockItem>(`${API_ENDPOINTS.COOPERATIVE.INVENTORY}/stock`, payload).pipe(
      tap(item => this.stockSubject.next([item, ...this.stockSubject.value])),
      catchError(() => of(this.addMockStockItem(payload))),
    );
  }

  issueStockToBranch(payload: BranchStockIssuePayload): Observable<BranchDisbursement> {
    return this.http.post<BranchDisbursement>(`${API_ENDPOINTS.COOPERATIVE.INVENTORY}/branch-issues`, payload).pipe(
      tap(disbursement => this.branchDisbursementSubject.next([disbursement, ...this.branchDisbursementSubject.value])),
      catchError(() => of(this.addMockBranchDisbursement(payload))),
    );
  }

  issueStockToFarmer(payload: FarmerStockIssuePayload): Observable<FarmerAllocation> {
    return this.http.post<FarmerAllocation>(`${API_ENDPOINTS.BRANCH.INVENTORY}/farmer-allocations`, payload).pipe(
      tap(allocation => this.farmerAllocationSubject.next([allocation, ...this.farmerAllocationSubject.value])),
      catchError(() => of(this.addMockFarmerAllocation(payload))),
    );
  }

  listBranchDisbursements(): Observable<BranchDisbursement[]> {
    return this.http.get<BranchDisbursement[]>(`${API_ENDPOINTS.COOPERATIVE.INVENTORY}/branch-issues`).pipe(
      tap(rows => this.branchDisbursementSubject.next(rows)),
      catchError(() => of([...this.branchDisbursementSubject.value])),
    );
  }

  listFarmerAllocations(): Observable<FarmerAllocation[]> {
    return this.http.get<FarmerAllocation[]>(`${API_ENDPOINTS.BRANCH.INVENTORY}/farmer-allocations`).pipe(
      tap(rows => this.farmerAllocationSubject.next(rows)),
      catchError(() => of(this.filterFarmerAllocationsForBranch())),
    );
  }

  private filterStockForScope(scope: InventoryScope): StockItem[] {
    if (scope === 'cooperative') return [...this.stockSubject.value];

    const branchId = this.session.branchId() ?? 'BR-KLA';
    return this.stockSubject.value.filter(item => item.branchIds.includes(branchId));
  }

  private filterFarmerAllocationsForBranch(): FarmerAllocation[] {
    const branchId = this.session.branchId() ?? 'BR-KLA';
    return this.farmerAllocationSubject.value.filter(row => row.branchId === branchId);
  }

  private addMockStockItem(payload: AddStockItemPayload): StockItem {
    const item: StockItem = {
      id: `STK-${Date.now()}`,
      name: payload.itemName,
      category: payload.category.toUpperCase(),
      categoryClass: payload.category.toLowerCase(),
      quantity: payload.quantity,
      unit: payload.unit,
      unitPrice: payload.unitPrice,
      minThreshold: payload.minThreshold,
      stockStatus: this.toStockStatus(payload.quantity, payload.minThreshold),
      branchIds: [],
      branchNames: [],
      season: '2026A',
      updatedAt: payload.receivedDate,
      supplierName: payload.supplierName,
      batchReference: payload.batchReference,
    };

    this.stockSubject.next([item, ...this.stockSubject.value]);
    return item;
  }

  private addMockBranchDisbursement(payload: BranchStockIssuePayload): BranchDisbursement {
    const stock = this.findStock(payload.stockItemId);
    const branch = BRANCHES.find(row => row.id === payload.branchId) ?? BRANCHES[0];
    const disbursement: BranchDisbursement = {
      id: `BD-${Date.now()}`,
      stockItemId: stock.id,
      branchId: branch.id,
      branchName: branch.name,
      itemName: stock.name,
      itemType: stock.category,
      quantity: payload.quantity,
      unit: stock.unit,
      totalValue: payload.quantity * stock.unitPrice,
      issueDate: new Date().toISOString().slice(0, 10),
      status: 'issued',
    };

    this.decreaseStock(stock.id, payload.quantity, branch);
    this.branchDisbursementSubject.next([disbursement, ...this.branchDisbursementSubject.value]);
    return disbursement;
  }

  private addMockFarmerAllocation(payload: FarmerStockIssuePayload): FarmerAllocation {
    const stock = this.findStock(payload.stockItemId);
    const farmer = FARMERS.find(row => row.id === payload.farmerId) ?? FARMERS[0];
    const allocation: FarmerAllocation = {
      id: `AL-${Date.now()}`,
      stockItemId: stock.id,
      farmerId: farmer.id,
      farmerName: farmer.name,
      branchId: farmer.branchId,
      branchName: farmer.branchName,
      itemName: stock.name,
      itemType: stock.category,
      quantity: payload.quantity,
      unit: stock.unit,
      totalValue: payload.quantity * stock.unitPrice,
      issueDate: new Date().toISOString().slice(0, 10),
      outstanding: payload.quantity * stock.unitPrice,
      status: 'partial',
    };

    this.decreaseStock(stock.id, payload.quantity);
    this.farmerAllocationSubject.next([allocation, ...this.farmerAllocationSubject.value]);
    return allocation;
  }

  private findStock(stockItemId: string): StockItem {
    return this.stockSubject.value.find(item => item.id === stockItemId) ?? this.stockSubject.value[0];
  }

  private decreaseStock(stockItemId: string, quantity: number, branch?: BranchOption): void {
    const items = this.stockSubject.value.map(item => {
      if (item.id !== stockItemId) return item;

      const nextQuantity = Math.max(item.quantity - quantity, 0);
      const branchIds = branch && !item.branchIds.includes(branch.id) ? [...item.branchIds, branch.id] : item.branchIds;
      const branchNames = branch && !item.branchNames.includes(branch.name) ? [...item.branchNames, branch.name] : item.branchNames;

      return {
        ...item,
        quantity: nextQuantity,
        stockStatus: this.toStockStatus(nextQuantity, item.minThreshold),
        branchIds,
        branchNames,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
    });

    this.stockSubject.next(items);
  }

  private toStockStatus(quantity: number, minThreshold: number): StockStatus {
    if (quantity <= 0) return 'out';
    if (quantity <= minThreshold) return 'low';
    return 'healthy';
  }
}
