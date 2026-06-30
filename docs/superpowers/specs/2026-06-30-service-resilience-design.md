# Service Resilience — Design Spec

**Date:** 2026-06-30
**Scope:** Add `catchError` to every HTTP-path service method so that setting `USE_MOCK = false` produces blank/hidden UI instead of crashes or stuck spinners.

---

## Problem

`USE_MOCK` is currently `false`, but the backend at `localhost:8083` is not running. Service methods that reach the HTTP path throw errors that propagate uncaught into components, crashing Angular's change detection or leaving the UI in a broken state. The goal is a "safe toggle" — flipping `USE_MOCK` produces an empty but functional app.

---

## Design

### Pattern A — Array-returning methods → `of([])`

Every service method whose return type is `Observable<T[]>` gets a `catchError` appended to its HTTP pipe:

```typescript
return this.http.get<T[]>(url).pipe(
  tap(items => this._subject.next(items)),   // only where BehaviorSubject exists
  catchError(() => of([])),
);
```

Arrays render as empty lists in components without any template changes — `*ngFor` over `[]` is already safe.

### Pattern B — Object-returning methods → `of(null)`

Methods whose return type is `Observable<SomeObject>` use:

```typescript
return this.http.get<SomeObject>(url).pipe(
  catchError(() => of(null)),
);
```

This requires the return type to widen to `Observable<SomeObject | null>` and the consuming component to guard against null (Pattern C below).

### Pattern C — Template null guards (consuming components only)

Components that subscribe to object-returning methods must not crash when `null` arrives. Two mechanisms, applied per situation:

```html
<!-- Section-level: hide the whole block -->
<div *ngIf="meta">
  {{ meta.cooperativeName }}
</div>

<!-- Property-level: show blank instead of crashing -->
{{ meta?.cooperativeName }}
```

Only the minimal guards needed to prevent crashes are added — no visual empty-state design.

---

## File Change Inventory

### Services — Array returns (Pattern A only)

| File | Methods to add `catchError(() => of([]))` |
|---|---|
| `core/services/cooperative-dashboard.service.ts` | `getStats()`, `getBranchPerformance()`, `getPaymentBreakdown()`, `getRecentActivities()` |
| `core/services/branch-dashboard.service.ts` | `getStats()`, `getTodayDeliveries()`, `getRecentActivities()` |
| `core/services/platform-dashboard.service.ts` | `getStats()`, `getOnboardingItems()`, `getPlatformHealth()`, `getRecentActivity()` |
| `core/services/branch.service.ts` | `listCooperativeBranches()`, `getActivities()`, `listBranches()` |
| `core/services/cooperative.service.ts` | `getBankAccounts()` |
| `features/branch/finance/services/payment-batch.service.ts` | `getBatches()`, `getAllFarmers()`, `getAllBatchesAcrossBranches()`, `getAllFarmersAcrossBranches()` |
| `features/cooperative/user/users.service.ts` | `list()` |
| `features/cooperative/agents/agents.service.ts` | `list()` |
| `features/cooperative/collection-hubs/collection-hubs.service.ts` | `list()` |

### Services — Object returns (Pattern B, widens return type to `T | null`)

| File | Method | Return type → widened to |
|---|---|---|
| `core/services/cooperative-dashboard.service.ts` | `getMeta()` | `Observable<CoopDashboardMeta \| null>` |
| `core/services/branch-dashboard.service.ts` | `getCollectionsStats()` | `Observable<BranchPageStats['collections'] \| null>` |
| `core/services/branch-dashboard.service.ts` | `getFarmersStats()` | `Observable<BranchPageStats['farmers'] \| null>` |
| `core/services/branch-dashboard.service.ts` | `getInventoryStats()` | `Observable<BranchPageStats['inventory'] \| null>` |
| `core/services/cooperative.service.ts` | `getProfile()` | `Observable<CooperativeProfile \| null>` |
| `core/services/branch.service.ts` | `getBranch()` | `Observable<BranchResponse \| null>` |

### Components — Null guards (Pattern C)

Components must add guards wherever they access properties of an object that is now `T | null`. Read each component before editing — only add what TypeScript or the template compiler requires.

| Component | Consumes null-returning method | Guard strategy |
|---|---|---|
| `features/cooperative/dashboard/dashboard.component.ts/.html` | `getMeta()` | `*ngIf="meta"` on the meta header section |
| `features/cooperative/branches/branch-dash/branch-dash.component.ts/.html` | `getCollectionsStats()`, `getFarmersStats()`, `getInventoryStats()` | `?.` or `*ngIf` on each stats block |
| `features/cooperative/branches/branch-detail/branch-detail.component.ts/.html` | same three stats methods | same |
| `features/cooperative/profile/cooperative-profile.component.ts/.html` | `getProfile()` | `*ngIf="profile"` |
| Any component calling `getBranch()` | `getBranch()` | `*ngIf="branch"` or `?.` on properties |

---

## Out of Scope

- **`reports.service.ts`** — BehaviorSubject-only, no HTTP calls, no changes needed.
- **`getById()` / `getCooperativeBranchById()` / similar** — already typed as `Observable<T | undefined>`; components already guard against undefined; no change.
- **`create()`, `update()`, `delete()`, `setStatus()` methods** — write paths; error handling there is a separate concern (user-visible toasts/alerts).
- **Visual empty-state UI** — placeholder text, illustrations, CTAs. Deferred to a follow-up design session.
- **`mock-reference-data.ts` fetch functions** — these always return mock data regardless of `USE_MOCK`; wiring them to a real API is deferred until endpoints exist.

---

## Constraints

- `catchError` import from `'rxjs/operators'`
- `of` import from `'rxjs'`
- The `USE_MOCK` branch of each method is unchanged
- Return type widening for object methods must be explicit: `Observable<T | null>` in the method signature
- No new dependencies introduced
- TypeScript must compile clean after every service change
