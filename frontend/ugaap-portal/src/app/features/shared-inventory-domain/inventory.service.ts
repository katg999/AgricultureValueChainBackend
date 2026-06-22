import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith, tap, timeout } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../core/constants/api-endpoints';
import { SessionService } from '../../core/services/session.service';

export type InventoryScope = 'cooperative' | 'branch';
export type StockStatus = 'healthy' | 'low' | 'out';
export type RecoveryStatus = 'settled' | 'partial' | 'overdue';
export type StockRequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled';
export type RequestUrgency = 'low' | 'medium' | 'high';

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

export type RepaymentMethod = 'post-harvest-deduction' | 'installments' | 'lump-sum';

export interface FarmerStockIssuePayload {
  stockItemId: string;
  farmerId: string;
  quantity: number;
  season: string;
  repaymentMethod: RepaymentMethod;
  deductionRate: number;
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

export interface StockRequest {
  id: string;
  itemName: string;
  category: string;
  unit: string;
  quantity: number;
  urgency: RequestUrgency;
  preferredDeliveryDate: string;
  reason: string;
  submittedAt: string;
  submittedBy: string;
  branchId: string;
  branchName: string;
  status: StockRequestStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  fulfilledAt?: string;
}

export interface StockRequestPayload {
  itemName: string;
  category: string;
  unit: string;
  quantity: number;
  urgency: RequestUrgency;
  preferredDeliveryDate?: string;
  reason?: string;
}

const BRANCHES: BranchOption[] = [
  { id: 'BR-KLA', name: 'Kampala Central' },
  { id: 'BR-JIN', name: 'Jinja Branch' },
  { id: 'BR-MBA', name: 'Mbarara Branch' },
  { id: 'BR-GUL', name: 'Gulu Branch' },
  { id: 'BR-MBL', name: 'Mbale West' },
];

const FARMERS: FarmerOption[] = [
  { id: 'UG-F-01001', name: 'Amina Nakato',   phone: '+256 701 234 567', branchId: 'BR-KLA', branchName: 'Kampala Central', availableCredit: 1500000 },
  { id: 'UG-F-01002', name: 'Moses Okello',   phone: '+256 772 456 103', branchId: 'BR-GUL', branchName: 'Gulu Branch',     availableCredit:  900000 },
  { id: 'UG-F-01003', name: 'Sarah Namutebi', phone: '+256 755 761 450', branchId: 'BR-JIN', branchName: 'Jinja Branch',    availableCredit: 2100000 },
  { id: 'UG-F-01004', name: 'Peter Mugisha',  phone: '+256 704 445 901', branchId: 'BR-MBA', branchName: 'Mbarara Branch',  availableCredit: 1200000 },
  // Mbale West — names match MOCK_FARMER_LIST for the dev mock session (BR-MBL)
  { id: 'UG-F-01005', name: 'Grace Atim',     phone: '+256 782 400 501', branchId: 'BR-MBL', branchName: 'Mbale West',      availableCredit:  750000 },
  { id: 'UG-F-01007', name: 'Dennis Ojok',    phone: '+256 772 100 502', branchId: 'BR-MBL', branchName: 'Mbale West',      availableCredit:  950000 },
  { id: 'UG-F-01008', name: 'Rose Atukunda',  phone: '+256 703 900 103', branchId: 'BR-MBL', branchName: 'Mbale West',      availableCredit: 1100000 },
];

const INITIAL_STOCK: StockItem[] = [
  { id: 'STK-001', name: 'NPK Fertilizer', category: 'FERTILIZER', categoryClass: 'fertilizer', quantity: 1250, unit: 'Bags', unitPrice: 180000, minThreshold: 200, stockStatus: 'healthy', branchIds: ['BR-KLA', 'BR-JIN', 'BR-MBA', 'BR-MBL'], branchNames: ['Kampala Central', 'Jinja Branch', 'Mbarara Branch', 'Mbale Branch'], season: '2026A', updatedAt: '2026-05-12', supplierName: 'Agro Inputs Uganda', batchReference: 'BTC-2026-NPK-001' },
  { id: 'STK-002', name: 'Maize Seeds (Longe 5)', category: 'SEEDS', categoryClass: 'seeds', quantity: 2400, unit: 'Kgs', unitPrice: 15000, minThreshold: 500, stockStatus: 'healthy', branchIds: BRANCHES.map(branch => branch.id), branchNames: BRANCHES.map(branch => branch.name), season: '2026A', updatedAt: '2026-05-11', supplierName: 'NARO Seed Centre', batchReference: 'BTC-2026-MAZ-004' },
  { id: 'STK-003', name: 'Spray Pumps (20L)', category: 'EQUIPMENT', categoryClass: 'equipment', quantity: 12, unit: 'Units', unitPrice: 130000, minThreshold: 15, stockStatus: 'low', branchIds: ['BR-MBA', 'BR-GUL'], branchNames: ['Mbarara Branch', 'Gulu Branch'], season: '2026A', updatedAt: '2026-05-09', supplierName: 'Farm Tools Ltd', batchReference: 'BTC-2026-SPR-002' },
  { id: 'STK-004', name: 'Jute Sacks (100kg)', category: 'PACKAGING', categoryClass: 'packaging', quantity: 0, unit: 'Units', unitPrice: 2500, minThreshold: 500, stockStatus: 'out', branchIds: BRANCHES.map(branch => branch.id), branchNames: BRANCHES.map(branch => branch.name), season: '2026A', updatedAt: '2026-05-08', supplierName: 'Harvest Packaging Co.', batchReference: 'BTC-2026-JUT-001' },
];

const INITIAL_BRANCH_DISBURSEMENTS: BranchDisbursement[] = [
  { id: 'BD-1001', stockItemId: 'STK-001', branchId: 'BR-KLA', branchName: 'Kampala Central', itemName: 'NPK Fertilizer',       itemType: 'FERTILIZER', quantity:  80, unit: 'Bags',  totalValue: 14400000, issueDate: '2026-05-18', status: 'received' },
  { id: 'BD-1002', stockItemId: 'STK-002', branchId: 'BR-GUL', branchName: 'Gulu Branch',     itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 300, unit: 'Kgs',   totalValue:  4500000, issueDate: '2026-05-19', status: 'issued'   },
  { id: 'BD-1003', stockItemId: 'STK-003', branchId: 'BR-MBA', branchName: 'Mbarara Branch',  itemName: 'Spray Pumps (20L)',     itemType: 'EQUIPMENT',  quantity:   4, unit: 'Units', totalValue:   520000, issueDate: '2026-05-20', status: 'received' },
  // Mbale West — visible to dev mock branch user (BR-MBL)
  { id: 'BD-1004', stockItemId: 'STK-002', branchId: 'BR-MBL', branchName: 'Mbale West',      itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 200, unit: 'Kgs',   totalValue:  3000000, issueDate: '2026-05-21', status: 'issued'   },
];

const INITIAL_STOCK_REQUESTS: StockRequest[] = [
  { id: 'REQ-1001', itemName: 'NPK Fertilizer', category: 'FERTILIZER', unit: 'Bags', quantity: 50, urgency: 'high', preferredDeliveryDate: '2026-06-20', reason: 'Seasonal demand increase from registered farmers', submittedAt: '2026-06-08', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'approved', reviewedAt: '2026-06-09', reviewedBy: 'Coop Admin' },
  { id: 'REQ-1002', itemName: 'Jute Sacks (100kg)', category: 'PACKAGING', unit: 'Units', quantity: 200, urgency: 'medium', preferredDeliveryDate: '2026-06-25', reason: 'Branch stock depleted after harvest collection', submittedAt: '2026-06-09', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'pending' },
  { id: 'REQ-1003', itemName: 'Maize Seeds (Longe 5)', category: 'SEEDS', unit: 'Kgs', quantity: 100, urgency: 'low', preferredDeliveryDate: '2026-07-01', reason: 'Next planting season preparation', submittedAt: '2026-06-10', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'rejected', reviewedAt: '2026-06-11', reviewedBy: 'Coop Admin', rejectionReason: 'Insufficient cooperative stock — resubmit in July' },
  { id: 'REQ-1004', itemName: 'Spray Pumps (20L)', category: 'EQUIPMENT', unit: 'Units', quantity: 5, urgency: 'high', preferredDeliveryDate: '2026-06-18', reason: 'Three existing pumps broken; field spraying blocked', submittedAt: '2026-06-05', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'fulfilled', reviewedAt: '2026-06-06', reviewedBy: 'Coop Admin', fulfilledAt: '2026-06-07' },
  { id: 'REQ-1005', itemName: 'Protective Gloves', category: 'TOOLS', unit: 'Pieces', quantity: 40, urgency: 'low', preferredDeliveryDate: '2026-06-30', reason: 'Safety equipment for input distribution staff', submittedAt: '2026-06-11', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'pending' },
];

const INITIAL_FARMER_ALLOCATIONS: FarmerAllocation[] = [
  { id: 'AL-1001', stockItemId: 'STK-001', farmerId: 'UG-F-01001', farmerName: 'Amina Nakato',   branchId: 'BR-KLA', branchName: 'Kampala Central', itemName: 'NPK Fertilizer',        itemType: 'FERTILIZER', quantity:  4, unit: 'Bags',  totalValue:  720000, issueDate: '2026-05-21', outstanding:       0, status: 'settled' },
  { id: 'AL-1002', stockItemId: 'STK-002', farmerId: 'UG-F-01002', farmerName: 'Moses Okello',   branchId: 'BR-GUL', branchName: 'Gulu Branch',     itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 30, unit: 'Kgs',   totalValue:  450000, issueDate: '2026-05-22', outstanding:  150000, status: 'partial' },
  { id: 'AL-1003', stockItemId: 'STK-003', farmerId: 'UG-F-01003', farmerName: 'Sarah Namutebi', branchId: 'BR-JIN', branchName: 'Jinja Branch',    itemName: 'Spray Pumps (20L)',     itemType: 'EQUIPMENT',  quantity:  1, unit: 'Units', totalValue:  130000, issueDate: '2026-05-23', outstanding:  130000, status: 'overdue' },
  // Mbale West — names match MOCK_FARMER_LIST; visible to dev mock branch user (BR-MBL)
  { id: 'AL-1004', stockItemId: 'STK-002', farmerId: 'UG-F-01005', farmerName: 'Grace Atim',     branchId: 'BR-MBL', branchName: 'Mbale West',      itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 25, unit: 'Kgs',   totalValue:  375000, issueDate: '2026-05-22', outstanding:  375000, status: 'partial' },
  { id: 'AL-1005', stockItemId: 'STK-001', farmerId: 'UG-F-01007', farmerName: 'Dennis Ojok',    branchId: 'BR-MBL', branchName: 'Mbale West',      itemName: 'NPK Fertilizer',        itemType: 'FERTILIZER', quantity:  5, unit: 'Bags',  totalValue:  900000, issueDate: '2026-05-24', outstanding:  450000, status: 'partial' },
  { id: 'AL-1006', stockItemId: 'STK-002', farmerId: 'UG-F-01008', farmerName: 'Rose Atukunda',  branchId: 'BR-MBL', branchName: 'Mbale West',      itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 20, unit: 'Kgs',   totalValue:  300000, issueDate: '2026-05-25', outstanding:  300000, status: 'overdue' },
];

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly stockSubject = new BehaviorSubject<StockItem[]>(INITIAL_STOCK);
  private readonly branchDisbursementSubject = new BehaviorSubject<BranchDisbursement[]>(INITIAL_BRANCH_DISBURSEMENTS);
  private readonly farmerAllocationSubject = new BehaviorSubject<FarmerAllocation[]>(INITIAL_FARMER_ALLOCATIONS);
  private readonly stockRequestSubject = new BehaviorSubject<StockRequest[]>(INITIAL_STOCK_REQUESTS);

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {}

  getBranches(): BranchOption[] {
    return BRANCHES;
  }

  getFarmersForCurrentBranch(): FarmerOption[] {
    const branchId = this.session.branchId();
    if (!branchId) return [];
    return FARMERS.filter(farmer => farmer.branchId === branchId);
  }

  listStock(scope: InventoryScope): Observable<StockItem[]> {
    const url = scope === 'cooperative' ? API_ENDPOINTS.COOPERATIVE.INVENTORY : API_ENDPOINTS.BRANCH.INVENTORY;

    return this.http.get<StockItem[]>(`${url}/stock`).pipe(
      timeout(8000),
      tap(items => this.stockSubject.next(items)),
      catchError(() => of(this.filterStockForScope(scope))),
    );
  }

  addStockItem(payload: AddStockItemPayload): Observable<StockItem> {
    return this.http.post<StockItem>(`${API_ENDPOINTS.COOPERATIVE.INVENTORY}/stock`, payload).pipe(
      timeout(8000),
      tap(item => this.stockSubject.next([item, ...this.stockSubject.value])),
      catchError(() => of(this.addMockStockItem(payload))),
    );
  }

  issueStockToBranch(payload: BranchStockIssuePayload): Observable<BranchDisbursement> {
    return this.http.post<BranchDisbursement>(`${API_ENDPOINTS.COOPERATIVE.INVENTORY}/branch-issues`, payload).pipe(
      timeout(8000),
      tap(disbursement => this.branchDisbursementSubject.next([disbursement, ...this.branchDisbursementSubject.value])),
      catchError(() => of(this.addMockBranchDisbursement(payload))),
    );
  }

  issueStockToFarmer(payload: FarmerStockIssuePayload): Observable<FarmerAllocation> {
    return this.http.post<FarmerAllocation>(`${API_ENDPOINTS.BRANCH.INVENTORY}/farmer-allocations`, payload).pipe(
      timeout(8000),
      tap(allocation => this.farmerAllocationSubject.next([allocation, ...this.farmerAllocationSubject.value])),
      catchError(() => of(this.addMockFarmerAllocation(payload))),
    );
  }

  listBranchDisbursements(): Observable<BranchDisbursement[]> {
    return this.http.get<BranchDisbursement[]>(`${API_ENDPOINTS.COOPERATIVE.INVENTORY}/branch-issues`).pipe(
      timeout(8000),
      tap(rows => this.branchDisbursementSubject.next(rows)),
      catchError(() => of([...this.branchDisbursementSubject.value])),
    );
  }

  // Branch staff only see their own branch; coop admin sees all.
  listBranchDisbursementsForRole$(): Observable<BranchDisbursement[]> {
    const role = this.session.userRole();
    const branchId = this.session.branchId();
    return this.listBranchDisbursements().pipe(
      map(rows => {
        if (role === 'branch' && branchId) return rows.filter(r => r.branchId === branchId);
        return rows;
      }),
    );
  }

  listFarmerAllocations(): Observable<FarmerAllocation[]> {
    const snapshot = this.filterFarmerAllocationsForBranch();
    return this.http.get<FarmerAllocation[]>(`${API_ENDPOINTS.BRANCH.INVENTORY}/farmer-allocations`).pipe(
      timeout(8000),
      tap(rows => this.farmerAllocationSubject.next(rows)),
      catchError(() => of(snapshot)),
      startWith(snapshot),
    );
  }

  // Immediate read for dropdowns that can't wait for HTTP — call listStock() alongside to refresh.
  getStockItems(scope: InventoryScope): StockItem[] {
    return this.filterStockForScope(scope);
  }

  getRecentBranchDisbursements(n = 5): BranchDisbursement[] {
    const role = this.session.userRole();
    const branchId = this.session.branchId();
    const all = this.branchDisbursementSubject.value;
    const rows = role === 'branch' && branchId ? all.filter(r => r.branchId === branchId) : all;
    return rows.slice(0, n);
  }

  getRecentFarmerAllocations(n = 5): FarmerAllocation[] {
    return this.filterFarmerAllocationsForBranch().slice(0, n);
  }

  submitStockRequest(payload: StockRequestPayload): Observable<StockRequest> {
    // 2 s timeout — short so offline dev gets the mock response without a long wait.
    return this.http.post<StockRequest>(`${API_ENDPOINTS.BRANCH.INVENTORY}/stock-requests`, payload).pipe(
      timeout(2000),
      tap(req => this.stockRequestSubject.next([req, ...this.stockRequestSubject.value])),
      catchError(() => of(this.addMockStockRequest(payload))),
    );
  }

  listStockRequests(): Observable<StockRequest[]> {
    const branchId = this.session.branchId();
    const snapshot = branchId
      ? this.stockRequestSubject.value.filter(r => r.branchId === branchId)
      : [...this.stockRequestSubject.value];

    // startWith shows data immediately; HTTP result replaces it once it arrives.
    return this.http.get<StockRequest[]>(`${API_ENDPOINTS.BRANCH.INVENTORY}/stock-requests`).pipe(
      timeout(3000),
      tap(rows => this.stockRequestSubject.next(rows)),
      catchError(() => of(snapshot)),
      startWith(snapshot),
    );
  }

  cancelStockRequest(id: string): Observable<void> {
    const removeFromStore = () =>
      this.stockRequestSubject.next(this.stockRequestSubject.value.filter(r => r.id !== id));

    return this.http.delete<void>(`${API_ENDPOINTS.BRANCH.INVENTORY}/stock-requests/${id}`).pipe(
      timeout(8000),
      tap(() => removeFromStore()),
      catchError((): Observable<void> => {
        removeFromStore();
        return of(void 0);
      }),
    );
  }

  private filterStockForScope(scope: InventoryScope): StockItem[] {
    if (scope === 'cooperative') return [...this.stockSubject.value];

    const branchId = this.session.branchId();
    if (!branchId) return [];
    return this.stockSubject.value.filter(item => item.branchIds.includes(branchId));
  }

  private filterFarmerAllocationsForBranch(): FarmerAllocation[] {
    const branchId = this.session.branchId();
    if (!branchId) return [];
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
    const pool = this.stockSubject.value.length ? this.stockSubject.value : INITIAL_STOCK;
    return pool.find(item => item.id === stockItemId) ?? pool[0];
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

  private addMockStockRequest(payload: StockRequestPayload): StockRequest {
    const branchId = this.session.branchId() ?? 'BR-MBL';
    const branch = BRANCHES.find(b => b.id === branchId) ?? BRANCHES[0];
    const request: StockRequest = {
      id: `REQ-${Date.now()}`,
      itemName: payload.itemName,
      category: payload.category.toUpperCase(),
      unit: payload.unit,
      quantity: payload.quantity,
      urgency: payload.urgency,
      preferredDeliveryDate: payload.preferredDeliveryDate ?? '',
      reason: payload.reason ?? '',
      submittedAt: new Date().toISOString().slice(0, 10),
      submittedBy: 'Branch Staff',
      branchId: branch.id,
      branchName: branch.name,
      status: 'pending',
    };
    this.stockRequestSubject.next([request, ...this.stockRequestSubject.value]);
    return request;
  }

  private toStockStatus(quantity: number, minThreshold: number): StockStatus {
    if (quantity <= 0) return 'out';
    if (quantity <= minThreshold) return 'low';
    return 'healthy';
  }
}
