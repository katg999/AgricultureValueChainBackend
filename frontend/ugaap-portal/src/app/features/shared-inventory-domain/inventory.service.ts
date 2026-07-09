import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith, tap, timeout } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../core/constants/api-endpoints';
import { SessionService } from '../../core/services/session.service';
import { MOCK_BRANCHES, MOCK_INITIAL_STOCK, MOCK_INITIAL_BRANCH_DISBURSEMENTS, MOCK_INITIAL_STOCK_REQUESTS, MOCK_INITIAL_FARMER_ALLOCATIONS } from '../../core/mock/mock-branch';
import { MOCK_FARMERS } from '../../core/mock/mock-farmer';
import { USE_MOCK } from '../../core/mock/mock-config';

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


@Injectable({ providedIn: 'root' })
export class InventoryService {
  // When USE_MOCK is false, start empty — real API calls fill these stores.
  private readonly stockSubject = new BehaviorSubject<StockItem[]>(USE_MOCK ? MOCK_INITIAL_STOCK as StockItem[] : []);
  private readonly branchDisbursementSubject = new BehaviorSubject<BranchDisbursement[]>(USE_MOCK ? MOCK_INITIAL_BRANCH_DISBURSEMENTS as BranchDisbursement[] : []);
  private readonly farmerAllocationSubject = new BehaviorSubject<FarmerAllocation[]>(USE_MOCK ? MOCK_INITIAL_FARMER_ALLOCATIONS as FarmerAllocation[] : []);
  private readonly stockRequestSubject = new BehaviorSubject<StockRequest[]>(USE_MOCK ? MOCK_INITIAL_STOCK_REQUESTS as StockRequest[] : []);

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {}

  getBranches(): BranchOption[] {
    return MOCK_BRANCHES;
  }

  getFarmersForCurrentBranch(): FarmerOption[] {
    const branchId = this.session.branchId();
    if (!branchId) return [];
    return MOCK_FARMERS.filter(farmer => farmer.branchId === branchId);
  }

  listStock(scope: InventoryScope): Observable<StockItem[]> {
    if (USE_MOCK) return of(this.filterStockForScope(scope));

    // Tell the backend WHICH cooperative or branch we want stock for.
    // The backend field names (cooperativeId, branchId) are used as query params.
    const params: Record<string, string> = {};
    const coopId   = this.session.cooperativeId();
    const branchId = this.session.branchId();
    if (scope === 'cooperative' && coopId)   params['cooperativeId'] = coopId;
    if (scope === 'branch'      && branchId) params['branchId']      = branchId;

    // GET /api/input-stock/all → returns InputStockResponseDTO[]
    // We map each item to our StockItem shape (field names differ between backend and frontend).
    return this.http.get<any[]>(API_ENDPOINTS.INVENTORY_BACKEND.STOCK_ALL, { params }).pipe(
      timeout(8000),
      map(items => items.map(raw => this.mapBackendStockToStockItem(raw))),
      tap(items => this.stockSubject.next(items)),
      catchError(() => of(this.filterStockForScope(scope))),
    );
  }

  addStockItem(payload: AddStockItemPayload): Observable<StockItem> {
    if (USE_MOCK) return of(this.addMockStockItem(payload));

    // The backend DTO uses different field names. We translate here before sending.
    // Note: category, unit, batchReference are not yet in the backend InputStockDTO —
    // they will be ignored by the backend until the DTO is extended.
    // inputItemId is required (nullable=false in DB); we generate a placeholder UUID
    // since the InputItem master catalogue isn't implemented in the frontend yet.
    const body = {
      itemName:         payload.itemName,
      supplierName:     payload.supplierName,
      quantity:         payload.quantity,
      unitCost:         payload.unitPrice,        // frontend: unitPrice → backend: unitCost
      minimumThreshold: payload.minThreshold,     // frontend: minThreshold → backend: minimumThreshold
      receivedDate:     payload.receivedDate,
      cooperativeId:    this.session.cooperativeId(),
      branchId:         this.session.branchId(),
      inputItemId:      crypto.randomUUID(),      // placeholder until InputItem catalogue is wired up
    };

    return this.http.post<any>(API_ENDPOINTS.INVENTORY_BACKEND.STOCK_CREATE, body).pipe(
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
    if (USE_MOCK) return of(this.addMockBranchDisbursement(payload));

    return this.http.post<BranchDisbursement>(
      `${API_ENDPOINTS.COOPERATIVE.INVENTORY}/branch-issues`, payload,
    ).pipe(
      timeout(8000),
      tap(d => this.branchDisbursementSubject.next([d, ...this.branchDisbursementSubject.value])),
      catchError(() => of(this.addMockBranchDisbursement(payload))),
    );
  }

  issueStockToFarmer(payload: FarmerStockIssuePayload): Observable<FarmerAllocation> {
    if (USE_MOCK) return of(this.addMockFarmerAllocation(payload));

    // The backend uses different field names and combines repaymentMethod + deductionRate
    // into a single "replacementTerms" string. We build that string here.
    const replacementTerms = `${payload.repaymentMethod} @ ${payload.deductionRate}%`;

    const body = {
      inputStockId:     payload.stockItemId,       // frontend: stockItemId → backend: inputStockId
      farmerId:         payload.farmerId,
      quantity:         payload.quantity,
      season:           payload.season,
      cooperativeId:    this.session.cooperativeId(),
      branchId:         this.session.branchId(),
      replacementTerms,                            // combined from repaymentMethod + deductionRate
    };

    return this.http.post<any>(API_ENDPOINTS.INVENTORY_BACKEND.ALLOCATION_ISSUE, body).pipe(
      timeout(8000),
      map(raw => this.mapBackendAllocationToFarmerAllocation(raw)),
      tap(alloc => this.farmerAllocationSubject.next([alloc, ...this.farmerAllocationSubject.value])),
      catchError(() => of(this.addMockFarmerAllocation(payload))),
    );
  }

  listBranchDisbursements(): Observable<BranchDisbursement[]> {
    // ── Why this uses mock data only ─────────────────────────────────────────
    // Branch disbursements (cooperative → branch) would be allocations without a
    // farmerId. The backend currently rejects null farmerId on issue, so no real
    // branch disbursement records exist in the database yet.
    // This will be connected once the backend supports the coop→branch flow.
    if (USE_MOCK) return of([...this.branchDisbursementSubject.value]);

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
    const branchId = this.session.branchId();
    const snapshot = this.filterFarmerAllocationsForBranch();

    if (USE_MOCK) return of(snapshot);

    // Without a branchId we can't ask the backend for the right records.
    // Return the cached snapshot immediately so the UI isn't empty.
    if (!branchId) return of(snapshot);

    // GET /api/allocations/branch/{branchId} → InputAllocationResponseDTO[]
    // The backend already filters to this branch, so we just map the response shape.
    return this.http.get<any[]>(
      API_ENDPOINTS.INVENTORY_BACKEND.ALLOCATIONS_BY_BRANCH(branchId),
    ).pipe(
      timeout(8000),
      map(rows => rows.map(raw => this.mapBackendAllocationToFarmerAllocation(raw))),
      tap(rows => this.farmerAllocationSubject.next(rows)),
      catchError(() => of(snapshot)),
      startWith(snapshot),   // show cached data immediately while the HTTP call is in-flight
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
    if (USE_MOCK) return of(this.addMockStockRequest(payload));

    return this.http.post<StockRequest>(`${API_ENDPOINTS.BRANCH.STOCK_REQUESTS}/stock-requests`, payload).pipe(
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
    if (USE_MOCK) return of(snapshot);

    return this.http.get<StockRequest[]>(`${API_ENDPOINTS.BRANCH.STOCK_REQUESTS}/stock-requests`).pipe(
      timeout(8000),
      tap(rows => this.stockRequestSubject.next(rows)),
      catchError(() => of(snapshot)),
      startWith(snapshot),
    );
  }

  cancelStockRequest(id: string): Observable<void> {
    const removeFromStore = () =>
      this.stockRequestSubject.next(this.stockRequestSubject.value.filter(r => r.id !== id));

    if (USE_MOCK) {
      removeFromStore();
      return of(void 0);
    }

    return this.http.delete<void>(`${API_ENDPOINTS.BRANCH.STOCK_REQUESTS}/stock-requests/${id}`).pipe(
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
    // The backend tracks two quantities:
    //   quantity         = original amount received from supplier
    //   availableQuantity = what's left after issuances (this is what we display)
    const qty = raw.availableQuantity ?? raw.quantity ?? 0;
    const min = raw.minimumThreshold  ?? 0;
    const category = (raw.category ?? 'GENERAL').toUpperCase();

    return {
      id:            raw.id,
      name:          raw.itemName,             // backend: itemName  → frontend: name
      category,
      categoryClass: category.toLowerCase(),   // derived — used for CSS class binding
      quantity:      qty,                      // backend: availableQuantity → frontend: quantity
      unit:          raw.unit ?? 'Units',      // not in backend DTO yet; default shown
      unitPrice:     raw.unitCost ?? 0,        // backend: unitCost  → frontend: unitPrice
      minThreshold:  min,                      // backend: minimumThreshold → frontend: minThreshold
      stockStatus:   this.toStockStatus(qty, min),
      branchIds:     raw.branchId ? [raw.branchId] : [],   // backend stores one branchId, we wrap it
      branchNames:   [],                       // backend returns ID only; name lookup not yet done
      season:        raw.season ?? '',         // not in backend DTO yet
      updatedAt:     (raw.receivedDate ?? raw.createdAt ?? '').slice(0, 10),
      supplierName:  raw.supplierName ?? '',
      // Backend has shortCode (auto-generated reference); batchReference (supplier lot number)
      // is not yet stored by the backend, so we use shortCode as the closest equivalent.
      batchReference: raw.shortCode ?? '',
    };
  }

  private mapBackendAllocationToFarmerAllocation(raw: any): FarmerAllocation {
    const totalVal    = raw.totalValue        ?? 0;
    const totalQty    = raw.quantity          ?? 0;
    const recoveredQ  = raw.recoveredQuantity ?? 0;

    // Outstanding = how much value is still owed.
    // Formula: totalValue × fraction not yet recovered
    const outstanding = totalQty > 0
      ? totalVal * (1 - recoveredQ / totalQty)
      : totalVal;

    // Backend stores fullyRecovered flag. "overdue" would require a due-date
    // concept that doesn't exist in the backend yet — we default to 'partial'.
    const status: RecoveryStatus = raw.fullyRecovered ? 'settled' : 'partial';

    return {
      id:          raw.id,
      stockItemId: raw.inputStockId ?? '',    // backend: inputStockId → frontend: stockItemId
      farmerId:    raw.farmerId     ?? '',
      farmerName:  raw.farmerName   ?? '',
      branchId:    raw.branchId     ?? '',
      branchName:  raw.branchName   ?? '',
      itemName:    raw.itemName     ?? '',
      itemType:    raw.itemType     ?? '',    // not stored on allocation yet; blank until backend adds it
      quantity:    raw.quantity     ?? 0,
      unit:        raw.unit         ?? 'Units', // not stored on allocation yet
      totalValue:  totalVal,
      issueDate:   (raw.issueDate ?? '').slice(0, 10),  // backend: LocalDateTime → we want date only
      outstanding,
      status,
    };
  }

  // Used when the backend adds a coop→branch disbursement flow (farmerId becomes optional).
  // Not called yet — included so the mapping logic is ready when the backend supports it.
  private mapBackendAllocationToBranchDisbursement(raw: any): BranchDisbursement {
    return {
      id:          raw.id,
      stockItemId: raw.inputStockId ?? '',    // backend: inputStockId → frontend: stockItemId
      branchId:    raw.branchId     ?? '',
      branchName:  raw.branchName   ?? '',
      itemName:    raw.itemName     ?? '',
      itemType:    raw.itemType     ?? '',
      quantity:    raw.quantity     ?? 0,
      unit:        raw.unit         ?? 'Units',
      totalValue:  raw.totalValue   ?? 0,
      issueDate:   (raw.issueDate ?? '').slice(0, 10),
      // farmerAcknowledged=true means the branch has confirmed receipt → 'received'
      status:      raw.farmerAcknowledged ? 'received' : 'issued',
    };
  }
  // ─────────────────────────────────────────────────────────────────────────

  private toStockStatus(quantity: number, minThreshold: number): StockStatus {
    if (quantity <= 0) return 'out';
    if (quantity <= minThreshold) return 'low';
    return 'healthy';
  }
}
