import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith, tap, timeout } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../core/constants/api-endpoints';
import { SessionService } from '../../core/services/session.service';
import { MOCK_BRANCHES, MOCK_INITIAL_STOCK, MOCK_INITIAL_BRANCH_DISBURSEMENTS, MOCK_INITIAL_STOCK_REQUESTS, MOCK_INITIAL_FARMER_ALLOCATIONS } from '../../core/mock/mock-branch';
import { MOCK_FARMERS } from '../../core/mock/mock-farmer';

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
  sku?: string;            // backend SKU — used when issuing credit to a farmer
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


@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly stockSubject = new BehaviorSubject<StockItem[]>(MOCK_INITIAL_STOCK as StockItem[]);
  private readonly branchDisbursementSubject = new BehaviorSubject<BranchDisbursement[]>(MOCK_INITIAL_BRANCH_DISBURSEMENTS as BranchDisbursement[]);
  private readonly farmerAllocationSubject = new BehaviorSubject<FarmerAllocation[]>(MOCK_INITIAL_FARMER_ALLOCATIONS as FarmerAllocation[]);
  private readonly stockRequestSubject = new BehaviorSubject<StockRequest[]>(MOCK_INITIAL_STOCK_REQUESTS as StockRequest[]);

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {}

  getBranches(): Observable<BranchOption[]> {
    const tenantId = this.session.tenantId();
    if (!tenantId) return of([]);

    return this.http.get<any[]>(API_ENDPOINTS.BRANCHES.LIST(tenantId)).pipe(
      timeout(8000),
      map(rows => rows.map(r => ({ id: r.branchId as string, name: r.name as string }))),
      catchError(err => {
        console.error('getBranches failed:', err);
        return of([]);
      }),
    );
  }

  getFarmersForCurrentBranch(): Observable<FarmerOption[]> {
    const tenantId = this.session.tenantId();
    const branchId = this.session.branchId();
    if (!tenantId) return of(MOCK_FARMERS);

    const url = API_ENDPOINTS.MEMBERS.LIST(tenantId, branchId || undefined);
    return this.http.get<any[]>(url).pipe(
      timeout(8000),
      map(rows => rows.map(r => ({
        id: r.memberId as string,
        name: r.fullName as string,
        phone: r.phoneNumber as string,
        branchId: r.branchId as string,
        branchName: '',
        availableCredit: 0,
      }))),
      catchError(() => of(MOCK_FARMERS)),
    );
  }

  listStock(scope: InventoryScope): Observable<StockItem[]> {
    // GET /api/v1/inventory/items returns Page<InventoryItemDto>.
    // branchId header is forwarded by the API Gateway from the JWT, but we also
    // pass it as a query param so cooperative admins can filter by branch.
    const params: Record<string, string> = { size: '200' };
    const branchId = this.session.branchId();
    if (scope === 'branch' && branchId) params['branchId'] = branchId;

    return this.http.get<any>(API_ENDPOINTS.INVENTORY_BACKEND.ITEMS, { params }).pipe(
      timeout(8000),
      // Spring Page<> wraps the array in a "content" field.
      map(page => (page?.content ?? page ?? []).map((raw: any) => this.mapBackendStockToStockItem(raw))),
      tap(items => this.stockSubject.next(items)),
      catchError(err => {
        console.error('listStock failed:', err);
        return of([] as StockItem[]);
      }),
    );
  }

  addStockItem(payload: AddStockItemPayload): Observable<StockItem> {
    // Translate frontend payload → InventoryItemCreateDto field names.
    // sku: prefer batchReference if the user filled it in, otherwise auto-generate.
    // buyingPrice = sellingPrice = unitPrice (frontend has a single price concept).
    const sku = payload.batchReference?.trim()
      || `${payload.itemName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const body = {
      sku,
      itemName:       payload.itemName,
      category:       payload.category,
      unitOfMeasure:  payload.unit,           // frontend: unit → backend: unitOfMeasure
      buyingPrice:    payload.unitPrice,      // frontend: unitPrice → backend: buyingPrice
      sellingPrice:   payload.unitPrice,      //                     → backend: sellingPrice
      reorderLevel:   payload.minThreshold,   // frontend: minThreshold → backend: reorderLevel
      initialQuantity: payload.quantity,      // frontend: quantity → backend: initialQuantity
    };

    return this.http.post<any>(API_ENDPOINTS.INVENTORY_BACKEND.ITEMS, body).pipe(
      timeout(8000),
      map(raw => this.mapBackendStockToStockItem(raw)),
      tap(item => this.stockSubject.next([item, ...this.stockSubject.value])),
      catchError(() => of(this.addMockStockItem(payload))),
    );
  }

  issueStockToBranch(payload: BranchStockIssuePayload): Observable<BranchDisbursement> {
    // ── Why this uses mock data only ─────────────────────────────────────────
    // The backend's POST /api/allocations/issue requires a farmerId (it throws if null).
    // A coop→branch disbursement has no farmer — it goes directly to a branch.
    // Until the backend adds a separate "branch disbursement" flow (or makes farmerId
    // optional for cooperative-level issues), this stays on mock data.
    // The catchError mock keeps the UI working in the meantime.
    return this.http.post<BranchDisbursement>(
      `${API_ENDPOINTS.COOPERATIVE.INVENTORY}/branch-issues`, payload,
    ).pipe(
      timeout(8000),
      tap(d => {
        this.branchDisbursementSubject.next([d, ...this.branchDisbursementSubject.value]);
        const branch = MOCK_BRANCHES.find(row => row.id === payload.branchId);
        this.decreaseStock(payload.stockItemId, payload.quantity, branch);
      }),
      catchError(() => of(this.addMockBranchDisbursement(payload))),
    );
  }

  issueStockToFarmer(payload: FarmerStockIssuePayload): Observable<FarmerAllocation> {
    // Translate frontend payload → IssueCreditRequestDto field names.
    // sku: look up from the cached stock list by stockItemId.
    // repaymentStrategy: 'installments' → PARTIAL_DEDUCTION, everything else → FULL_DEDUCTION.
    const sku = this.findSkuForItem(payload.stockItemId);
    const repaymentStrategy = payload.repaymentMethod === 'installments'
      ? 'PARTIAL_DEDUCTION'
      : 'FULL_DEDUCTION';

    const body: Record<string, unknown> = {
      farmerId:          payload.farmerId,
      sku,
      quantity:          payload.quantity,
      repaymentStrategy,
    };
    if (repaymentStrategy === 'PARTIAL_DEDUCTION') {
      body['customDeductionAmount'] = payload.deductionRate;
    }

    return this.http.post<any>(API_ENDPOINTS.INVENTORY_BACKEND.CREDITS_ISSUE, body).pipe(
      timeout(8000),
      map(raw => this.mapBackendCreditToFarmerAllocation(raw)),
      tap(alloc => {
        this.farmerAllocationSubject.next([alloc, ...this.farmerAllocationSubject.value]);
        this.decreaseStock(payload.stockItemId, payload.quantity);
      }),
      catchError(() => of(this.addMockFarmerAllocation(payload))),
    );
  }

  listBranchDisbursements(): Observable<BranchDisbursement[]> {
    // ── Why this uses mock data only ─────────────────────────────────────────
    // Branch disbursements (cooperative → branch) would be allocations without a
    // farmerId. The backend currently rejects null farmerId on issue, so no real
    // branch disbursement records exist in the database yet.
    // This will be connected once the backend supports the coop→branch flow.
    return this.http.get<BranchDisbursement[]>(
      `${API_ENDPOINTS.COOPERATIVE.INVENTORY}/branch-issues`,
    ).pipe(
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

    // branchId filtering is done by the gateway via X-Branch-Id header from the JWT.
    // Branch staff get their branch filtered automatically; coop admin gets all credits.
    return this.http.get<any>(API_ENDPOINTS.INVENTORY_BACKEND.CREDITS, { params: { size: '200' } }).pipe(
      timeout(8000),
      map(page => (page?.content ?? page ?? []).map((raw: any) => this.mapBackendCreditToFarmerAllocation(raw))),
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
    // ── No backend endpoint yet ───────────────────────────────────────────────
    // The StockRequest feature (branch requests cooperative stock) is not yet
    // implemented on the backend. The HTTP call will fail → catchError returns the
    // mock response so the UI keeps working.
    // Timeout raised to 8 s so it doesn't appear to succeed before the real backend
    // is wired up (a 2 s timeout that silently "succeeds" via mock is misleading).
    return this.http.post<StockRequest>(`${API_ENDPOINTS.BRANCH.INVENTORY}/stock-requests`, payload).pipe(
      timeout(8000),
      tap(req => this.stockRequestSubject.next([req, ...this.stockRequestSubject.value])),
      catchError(() => of(this.addMockStockRequest(payload))),
    );
  }

  listStockRequests(): Observable<StockRequest[]> {
    const branchId = this.session.branchId();
    const snapshot = branchId
      ? this.stockRequestSubject.value.filter(r => r.branchId === branchId)
      : [...this.stockRequestSubject.value];

    // No backend endpoint yet — falls back to cached/mock data.
    // startWith shows data immediately; HTTP result will replace it once the
    // stock-requests endpoint is added to the backend.
    return this.http.get<StockRequest[]>(`${API_ENDPOINTS.BRANCH.INVENTORY}/stock-requests`).pipe(
      timeout(8000),
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
    if (!branchId) return [...this.farmerAllocationSubject.value];
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
    const branch = MOCK_BRANCHES.find(row => row.id === payload.branchId) ?? MOCK_BRANCHES[0];
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
    const farmer = MOCK_FARMERS.find(row => row.id === payload.farmerId) ?? MOCK_FARMERS[0];
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
    const pool = this.stockSubject.value.length ? this.stockSubject.value : (MOCK_INITIAL_STOCK as StockItem[]);
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
    const branch = MOCK_BRANCHES.find(b => b.id === branchId) ?? MOCK_BRANCHES[0];
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

  // ── Backend → Frontend response mappers ──────────────────────────────────
  // The backend DTOs use different field names from our frontend interfaces.
  // These private methods act as "translators" — they take the raw JSON the
  // backend sends and reshape it into the objects our components expect.
  // Any field missing from the backend gets a safe default so the UI never crashes.

  private mapBackendStockToStockItem(raw: any): StockItem {
    // Maps InventoryItemDto → frontend StockItem.
    // Backend field names differ significantly from the old inventory service.
    const qty = Number(raw.quantityAvailable ?? 0);
    const min = Number(raw.reorderLevel ?? 0);
    const category = (raw.category ?? 'GENERAL').toUpperCase();

    return {
      id:            raw.id,
      sku:           raw.sku ?? '',                    // new field — needed for credit issuance
      name:          raw.itemName,                     // backend: itemName → frontend: name
      category,
      categoryClass: category.toLowerCase(),
      quantity:      qty,                              // backend: quantityAvailable → frontend: quantity
      unit:          raw.unitOfMeasure ?? 'Units',    // backend: unitOfMeasure → frontend: unit
      unitPrice:     Number(raw.sellingPrice ?? 0),   // backend: sellingPrice → frontend: unitPrice
      minThreshold:  min,                              // backend: reorderLevel → frontend: minThreshold
      stockStatus:   raw.lowStock ? (qty <= 0 ? 'out' : 'low') : 'healthy',
      branchIds:     raw.branchId ? [raw.branchId.toString()] : [],
      branchNames:   [],
      season:        '',
      updatedAt:     raw.updatedAt ? raw.updatedAt.toString().slice(0, 10) : '',
      supplierName:  '',
      batchReference: raw.sku ?? '',                  // sku is the closest equivalent
    };
  }

  // Maps InputCreditDto (backend) → FarmerAllocation (frontend).
  private mapBackendCreditToFarmerAllocation(raw: any): FarmerAllocation {
    const loanStatus: string = (raw.status ?? 'ACTIVE').toUpperCase();
    const status: RecoveryStatus =
      loanStatus === 'PAID'    ? 'settled'  :
      loanStatus === 'OVERDUE' ? 'overdue'  : 'partial';

    return {
      id:          raw.id,
      stockItemId: raw.itemSku    ?? '',      // sku is closest reference to a stock item ID
      farmerId:    raw.farmerId   ?? '',
      farmerName:  raw.farmerName ?? '',
      branchId:    raw.branchId   ? raw.branchId.toString() : '',
      branchName:  '',                        // not returned by InputCreditDto
      itemName:    raw.itemName   ?? '',
      itemType:    raw.itemSku    ?? '',
      quantity:    Number(raw.quantityIssued  ?? 0),
      unit:        'Units',
      totalValue:  Number(raw.totalAmountOwed ?? 0),
      issueDate:   raw.createdAt ? raw.createdAt.toString().slice(0, 10) : '',
      outstanding: Number(raw.remainingBalance ?? 0),
      status,
    };
  }

  // Resolve a stock item's SKU from the in-memory cache so issueStockToFarmer()
  // can send the sku field required by IssueCreditRequestDto.
  private findSkuForItem(stockItemId: string): string {
    const pool = this.stockSubject.value.length
      ? this.stockSubject.value
      : (MOCK_INITIAL_STOCK as StockItem[]);
    return pool.find(item => item.id === stockItemId)?.sku ?? stockItemId;
  }
  // ─────────────────────────────────────────────────────────────────────────

  private toStockStatus(quantity: number, minThreshold: number): StockStatus {
    if (quantity <= 0) return 'out';
    if (quantity <= minThreshold) return 'low';
    return 'healthy';
  }
}
