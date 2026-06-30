# Service Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `catchError` to every HTTP-path service method so that `USE_MOCK = false` produces an empty but functional app instead of crashes.

**Architecture:** Array-returning methods fall back to `of([])` — no template changes needed. Object-returning methods fall back to `of(null)` and widen their return type to `T | null` — consuming components add minimal `*ngIf` / `?.` guards. The `USE_MOCK` branch of every method is untouched.

**Tech Stack:** Angular 18, RxJS (`catchError` from `rxjs/operators`, `of` from `rxjs`), TypeScript strict mode.

## Global Constraints

- `catchError` imported from `'rxjs/operators'`; `of` imported from `'rxjs'`
- Only the HTTP-path (non-`USE_MOCK`) branch of each method is modified
- Return type of object-returning methods must be explicitly widened: `Observable<T | null>`
- No new dependencies introduced
- `npx tsc --noEmit` must pass after every task
- No visual empty-state design — sections hide or go blank; no placeholder text or illustrations added

---

### Task 1: Array catchError — dashboard services

**Files:**
- Modify: `frontend/ugaap-portal/src/app/core/services/cooperative-dashboard.service.ts`
- Modify: `frontend/ugaap-portal/src/app/core/services/branch-dashboard.service.ts`
- Modify: `frontend/ugaap-portal/src/app/core/services/platform-dashboard.service.ts`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: nothing consumed by other tasks — changes are self-contained

Read each file before editing to confirm the exact HTTP pipe structure.

- [ ] **Step 1: Add `catchError(() => of([]))` to `cooperative-dashboard.service.ts`**

Ensure `catchError` is imported from `'rxjs/operators'` and `of` from `'rxjs'`. Then update the four array-returning HTTP paths:

```typescript
getStats(): Observable<StatCardData[]> {
  if (USE_MOCK) { return of([...MOCK_COOP_STATS] as StatCardData[]); }
  return this.http.get<StatCardData[]>(`${this.apiUrl}/stats`).pipe(
    catchError(() => of([])),
  );
}

getBranchPerformance(): Observable<BranchPerformanceRow[]> {
  if (USE_MOCK) { return of([...MOCK_BRANCH_PERFORMANCE]); }
  return this.http.get<BranchPerformanceRow[]>(`${this.apiUrl}/branch-performance`).pipe(
    catchError(() => of([])),
  );
}

getPaymentBreakdown(): Observable<PaymentBreakdownRow[]> {
  if (USE_MOCK) { return of([...MOCK_PAYMENT_BREAKDOWN]); }
  return this.http.get<PaymentBreakdownRow[]>(`${this.apiUrl}/payment-breakdown`).pipe(
    catchError(() => of([])),
  );
}

getRecentActivities(): Observable<CoopActivity[]> {
  if (USE_MOCK) { return of([...MOCK_COOP_ACTIVITIES]); }
  return this.http.get<CoopActivity[]>(`${this.apiUrl}/recent-activities`).pipe(
    catchError(() => of([])),
  );
}
```

- [ ] **Step 2: Add `catchError(() => of([]))` to `branch-dashboard.service.ts`**

```typescript
getStats(): Observable<StatCardData[]> {
  if (USE_MOCK) { return of([...MOCK_BRANCH_STATS] as StatCardData[]); }
  return this.http.get<StatCardData[]>(`${this.apiUrl}/stats`).pipe(
    catchError(() => of([])),
  );
}

getTodayDeliveries(): Observable<TodayDelivery[]> {
  if (USE_MOCK) { return of([...MOCK_TODAY_DELIVERIES]); }
  return this.http.get<TodayDelivery[]>(`${this.apiUrl}/today-deliveries`).pipe(
    catchError(() => of([])),
  );
}

getRecentActivities(): Observable<BranchActivity[]> {
  if (USE_MOCK) { return of([...MOCK_BRANCH_DASH_ACTIVITIES]); }
  return this.http.get<BranchActivity[]>(`${this.apiUrl}/recent-activities`).pipe(
    catchError(() => of([])),
  );
}
```

- [ ] **Step 3: Add `catchError(() => of([]))` to `platform-dashboard.service.ts`**

Read the file first to confirm method bodies. Add `.pipe(catchError(() => of([])))` to the HTTP path of `getStats()`, `getOnboardingItems()`, `getPlatformHealth()`, and `getRecentActivity()`. If any method already has a `.pipe()`, append `catchError(() => of([]))` inside it.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/ugaap-portal/src/app/core/services/cooperative-dashboard.service.ts
git add frontend/ugaap-portal/src/app/core/services/branch-dashboard.service.ts
git add frontend/ugaap-portal/src/app/core/services/platform-dashboard.service.ts
git commit -m "fix: add catchError to array-returning dashboard service methods"
```

---

### Task 2: Array catchError — entity and feature services

**Files:**
- Modify: `frontend/ugaap-portal/src/app/core/services/branch.service.ts`
- Modify: `frontend/ugaap-portal/src/app/core/services/cooperative.service.ts`
- Modify: `frontend/ugaap-portal/src/app/features/branch/finance/services/payment-batch.service.ts`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/user/users.service.ts`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/agents/agents.service.ts`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/collection-hubs/collection-hubs.service.ts`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: nothing consumed by other tasks

Read each file before editing. For services that already have `.pipe(tap(...), catchError(...))` on their HTTP calls, check if `catchError` is already present — if so, skip that method.

- [ ] **Step 1: Update `branch.service.ts`**

Add `catchError(() => of([]))` to the HTTP path of: `listCooperativeBranches()`, `getActivities()`, `listBranches()`.

Example pattern — apply to all three:
```typescript
listCooperativeBranches(): Observable<CooperativeBranch[]> {
  if (USE_MOCK) { /* existing mock return unchanged */ }
  return this.http.get<CooperativeBranch[]>(/* existing URL */).pipe(
    catchError(() => of([])),
  );
}
```

- [ ] **Step 2: Update `cooperative.service.ts`**

Add `catchError(() => of([]))` to `getBankAccounts()` HTTP path only.

- [ ] **Step 3: Update `payment-batch.service.ts`**

Add `catchError(() => of([]))` to the HTTP path of: `getBatches()`, `getAllFarmers()`, `getAllBatchesAcrossBranches()`, `getAllFarmersAcrossBranches()`.

- [ ] **Step 4: Update `users.service.ts`**

Add `catchError(() => of([]))` to `list()` HTTP path. The existing pipe already has `tap(users => this._users.next(users))` — add catchError after tap:

```typescript
list(): Observable<User[]> {
  if (USE_MOCK) return of([...MOCK_COOPERATIVE_USERS] as User[]);
  return this.http.get<User[]>(API_ENDPOINTS.COOPERATIVE.USERS).pipe(
    tap(users => this._users.next(users)),
    catchError(() => of([])),
  );
}
```

- [ ] **Step 5: Update `agents.service.ts`**

Same pattern as users.service.ts — add `catchError(() => of([]))` to `list()` HTTP path after the existing `tap`.

- [ ] **Step 6: Update `collection-hubs.service.ts`**

Same pattern — add `catchError(() => of([]))` to `list()` HTTP path.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add \
  frontend/ugaap-portal/src/app/core/services/branch.service.ts \
  frontend/ugaap-portal/src/app/core/services/cooperative.service.ts \
  frontend/ugaap-portal/src/app/features/branch/finance/services/payment-batch.service.ts \
  frontend/ugaap-portal/src/app/features/cooperative/user/users.service.ts \
  frontend/ugaap-portal/src/app/features/cooperative/agents/agents.service.ts \
  frontend/ugaap-portal/src/app/features/cooperative/collection-hubs/collection-hubs.service.ts
git commit -m "fix: add catchError to array-returning entity and feature service methods"
```

---

### Task 3: Object catchError + return type widening + template null guards

Tasks 3 and 4 are merged into one: type widening in services creates tsc errors in consumers, so both must be fixed before any commit. Do all service changes first, run tsc to surface the error list, then fix every consumer before committing.

**Files (services):**
- Modify: `frontend/ugaap-portal/src/app/core/services/cooperative-dashboard.service.ts`
- Modify: `frontend/ugaap-portal/src/app/core/services/branch-dashboard.service.ts`
- Modify: `frontend/ugaap-portal/src/app/core/services/cooperative.service.ts`
- Modify: `frontend/ugaap-portal/src/app/core/services/branch.service.ts`

**Files (components — read before editing to find exact property names):**
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/dashboard/dashboard.component.ts` + `.html`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/branches/branch-dash/branch-dash.component.ts` + `.html`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/branches/branch-detail/branch-detail.component.ts` + `.html`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/profile/cooperative-profile.component.ts` + `.html`
- Modify: any other component tsc surfaces after the service changes

**Interfaces:**
- Consumes: nothing from other tasks
- Produces:
  - `CooperativeDashboardService.getMeta(): Observable<CoopDashboardMeta | null>`
  - `BranchDashboardService.getCollectionsStats(): Observable<BranchPageStats['collections'] | null>`
  - `BranchDashboardService.getFarmersStats(): Observable<BranchPageStats['farmers'] | null>`
  - `BranchDashboardService.getInventoryStats(): Observable<BranchPageStats['inventory'] | null>`
  - `CooperativeService.getProfile(): Observable<CooperativeProfile | null>`
  - `BranchService.getBranch(): Observable<BranchResponse | null>`

- [ ] **Step 1: Update `cooperative-dashboard.service.ts` — `getMeta()`**

Widen the return type and add catchError:

```typescript
getMeta(): Observable<CoopDashboardMeta | null> {
  if (USE_MOCK) {
    return of({ cooperativeName: MOCK_COOP_NAME, season: MOCK_COOP_SEASON, totalVolume: MOCK_TOTAL_VOLUME });
  }
  return this.http.get<CoopDashboardMeta>(`${this.apiUrl}/meta`).pipe(
    catchError(() => of(null)),
  );
}
```

- [ ] **Step 2: Update `branch-dashboard.service.ts` — three stats methods**

```typescript
getCollectionsStats(): Observable<BranchPageStats['collections'] | null> {
  if (USE_MOCK) { return of({ ...MOCK_BRANCH_PAGE_STATS.collections }); }
  return this.http.get<BranchPageStats['collections']>(`${this.apiUrl}/collections-stats`).pipe(
    catchError(() => of(null)),
  );
}

getFarmersStats(): Observable<BranchPageStats['farmers'] | null> {
  if (USE_MOCK) { return of({ ...MOCK_BRANCH_PAGE_STATS.farmers }); }
  return this.http.get<BranchPageStats['farmers']>(`${this.apiUrl}/farmers-stats`).pipe(
    catchError(() => of(null)),
  );
}

getInventoryStats(): Observable<BranchPageStats['inventory'] | null> {
  if (USE_MOCK) { return of({ ...MOCK_BRANCH_PAGE_STATS.inventory }); }
  return this.http.get<BranchPageStats['inventory']>(`${this.apiUrl}/inventory-stats`).pipe(
    catchError(() => of(null)),
  );
}
```

- [ ] **Step 3: Update `cooperative.service.ts` — `getProfile()`**

Read the file first to confirm the method body, then widen return type and add catchError:

```typescript
getProfile(): Observable<CooperativeProfile | null> {
  if (USE_MOCK) { /* existing mock return — unchanged */ }
  return this.http.get<CooperativeProfile>(/* existing URL */).pipe(
    catchError(() => of(null)),
  );
}
```

- [ ] **Step 4: Update `branch.service.ts` — `getBranch()`**

Read the file first to confirm the method body, then widen return type and add catchError:

```typescript
getBranch(branchId: string): Observable<BranchResponse | null> {
  if (USE_MOCK) { /* existing mock return — unchanged */ }
  return this.http.get<BranchResponse>(/* existing URL */).pipe(
    catchError(() => of(null)),
  );
}
```

- [ ] **Step 5: Run tsc to get the full list of consumer errors**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit 2>&1
```

Expected: errors on every component property that was typed as `CoopDashboardMeta`, `BranchPageStats[...]`, `CooperativeProfile`, or `BranchResponse` without `| null`. Note every file and property name — these are all the components to fix in Steps 6–10.

- [ ] **Step 6: Fix `cooperative/dashboard/dashboard.component.ts` + `.html`**

Read both files. Find the property storing `getMeta()` result and widen it:
```typescript
meta: CoopDashboardMeta | null = null;
```
In the template, wrap the section that accesses `meta` properties:
```html
<ng-container *ngIf="meta">
  <!-- content using meta.cooperativeName, meta.season, meta.totalVolume -->
</ng-container>
```

- [ ] **Step 7: Fix `branch-dash.component.ts` + `.html`**

Read both files. Widen the three stats properties:
```typescript
collectionsStats: BranchPageStats['collections'] | null = null;
farmersStats:     BranchPageStats['farmers']     | null = null;
inventoryStats:   BranchPageStats['inventory']   | null = null;
```
Wrap each stats block in the template:
```html
<div *ngIf="collectionsStats"><!-- collections content --></div>
<div *ngIf="farmersStats"><!-- farmers content --></div>
<div *ngIf="inventoryStats"><!-- inventory content --></div>
```

- [ ] **Step 8: Fix `branch-detail.component.ts` + `.html`**

Same pattern as Step 7 — branch-detail also subscribes to the three stats methods.

- [ ] **Step 9: Fix `cooperative-profile.component.ts` + `.html`**

Read both files. Widen the profile property:
```typescript
profile: CooperativeProfile | null = null;
```
Wrap the profile content:
```html
<ng-container *ngIf="profile">
  <!-- all content using profile.* -->
</ng-container>
```

- [ ] **Step 10: Fix any remaining components from the tsc error list (Step 5)**

For each remaining error: widen the property type in `.ts` to `T | null = null`, add `*ngIf` on the consuming section in `.html`. Use optional chaining `?.` only when the element cannot be conditionally hidden.

- [ ] **Step 11: Verify TypeScript compiles clean**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: **zero errors**.

- [ ] **Step 12: Commit all service + component changes together**

```bash
git add \
  frontend/ugaap-portal/src/app/core/services/cooperative-dashboard.service.ts \
  frontend/ugaap-portal/src/app/core/services/branch-dashboard.service.ts \
  frontend/ugaap-portal/src/app/core/services/cooperative.service.ts \
  frontend/ugaap-portal/src/app/core/services/branch.service.ts \
  frontend/ugaap-portal/src/app/features/cooperative/dashboard/dashboard.component.ts \
  frontend/ugaap-portal/src/app/features/cooperative/dashboard/dashboard.component.html \
  frontend/ugaap-portal/src/app/features/cooperative/branches/branch-dash/branch-dash.component.ts \
  frontend/ugaap-portal/src/app/features/cooperative/branches/branch-dash/branch-dash.component.html \
  frontend/ugaap-portal/src/app/features/cooperative/branches/branch-detail/branch-detail.component.ts \
  frontend/ugaap-portal/src/app/features/cooperative/branches/branch-detail/branch-detail.component.html \
  frontend/ugaap-portal/src/app/features/cooperative/profile/cooperative-profile.component.ts \
  frontend/ugaap-portal/src/app/features/cooperative/profile/cooperative-profile.component.html
# git add any additional files fixed in Step 10
git commit -m "fix: object-returning service methods return T | null; add template null guards"
```
