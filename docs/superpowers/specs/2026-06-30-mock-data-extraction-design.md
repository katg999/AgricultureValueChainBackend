# Mock Data Extraction — Design Spec
**Date:** 2026-06-30
**Scope:** Extract inline seeded/reference data from 6 service and component files into canonical mock and constants locations.

---

## Problem

Several services and components carry inline data arrays that belong in the shared mock layer:

| File | What's inline | Kind |
|---|---|---|
| `features/cooperative/user/users.service.ts` | `SEED_USERS` | Entity mock |
| `features/cooperative/agents/agents.service.ts` | `SEED_AGENTS` | Entity mock |
| `features/cooperative/collection-hubs/collection-hubs.service.ts` | `SEED_HUBS` | Entity mock |
| `features/cooperative/collection-hubs/collection-hubs.service.ts` | `UGANDA_DISTRICTS`, `COMMODITIES` | Reference data |
| `features/cooperative/edit-prices/edit-prices.component.ts` | `SEED_FLAT`, `SEED_GRADE` | Pricing mock |
| `features/cooperative/edit-prices/edit-prices.component.ts` | `branchOptions` (inline array) | Reference data |
| `core/services/roles.service.ts` | `FIRST_NAMES`, `LAST_NAMES`, `BRANCHES` | Generative stub |
| `core/services/reports-state.service.ts` | Column / chart / sort schema | UI config |

---

## Design

### Group 1 — Entity seed data → `core/mock/mock-cooperative.ts`

Five constants move to `mock-cooperative.ts` under canonical names. Each source file imports from there instead of defining inline.

| Source constant | New name in `mock-cooperative.ts` |
|---|---|
| `SEED_USERS` | `MOCK_COOPERATIVE_USERS` |
| `SEED_AGENTS` | `MOCK_AGENTS` |
| `SEED_HUBS` | `MOCK_COLLECTION_HUBS` |
| `SEED_FLAT` | `MOCK_FLAT_PRICE_ENTRIES` |
| `SEED_GRADE` | `MOCK_GRADE_PRICE_ENTRIES` |

**Type extraction:** `FlatPriceEntry` and `GradePriceEntry` are currently defined in `edit-prices.component.ts`. Since `mock-cooperative.ts` needs them, they move to a new file `core/models/pricing.model.ts`. Both the component and `mock-cooperative.ts` import from there.

**Roles stub replacement:** Remove `FIRST_NAMES`, `LAST_NAMES`, `BRANCHES` from `roles.service.ts`. Add a static `MOCK_ASSIGNED_USERS: AssignedUser[]` (8 rows) to `mock-cooperative.ts`. Update `getUsersForRole(count)` to return `MOCK_ASSIGNED_USERS.slice(0, Math.min(count, MOCK_ASSIGNED_USERS.length))`.

**Services updated:** `UsersService`, `AgentsService`, `CollectionHubsService`, `EditPricesComponent`, `RolesService` — each drops its local seed constant and imports the canonical one.

---

### Group 2 — Report schema config → no change

`COLUMNS_BY_SOURCE`, `CHART_OPTIONS`, `GROUP_BY_OPTIONS`, `SORT_BY_OPTIONS` in `core/services/reports-state.service.ts` are already well-encapsulated behind typed getter methods. No consumer accesses them directly. Moving them would add indirection for no benefit.

---

### Group 3 — Reference/lookup data → `core/mock/mock-reference-data.ts`

New file. Each function simulates a 300 ms network delay and returns a `Promise`. Components consume via RxJS `from()`:

```typescript
// Component usage
from(fetchDistricts()).subscribe(d => this.districts = d);
```

**Functions to export:**

```typescript
export const fetchDistricts        = async (): Promise<string[]> => { /* 15 Uganda districts */ }
export const fetchCommodities      = async (): Promise<string[]> => { /* 8 crop types */ }
export const fetchGenderOptions    = async (): Promise<string[]> => { /* Female, Male, Other, Prefer not to say */ }
export const fetchBankOptions      = async (): Promise<string[]> => { /* 9 Ugandan banks */ }
export const fetchRegions          = async (): Promise<string[]> => { /* 4 Uganda regions */ }
export const fetchIrrigationTypes  = async (): Promise<string[]> => { /* 3 irrigation types */ }
export const fetchLandOwnership    = async (): Promise<string[]> => { /* 4 ownership types */ }
export const fetchStockCategories  = async (): Promise<string[]> => { /* 5 stock categories */ }
export const fetchStockUnits       = async (): Promise<string[]> => { /* 5 unit types */ }
```

**Not in this file:** Role names and cooperative names — those come from `RolesService.list()` and the cooperative service, which already have real HTTP wiring.

**`edit-prices.component.ts` branch options:** Replace the inline 8-item `branchOptions` array with `MOCK_BRANCHES` imported from `core/mock/mock-branch.ts` (already canonical `BR-XXX` IDs after prior fix). No fetch function needed — branch data is already managed by the branch service layer.

---

## File Change Summary

| File | Action |
|---|---|
| `core/models/pricing.model.ts` | **Create** — `FlatPriceEntry`, `GradePriceEntry` interfaces |
| `core/mock/mock-reference-data.ts` | **Create** — all `fetchX()` functions |
| `core/mock/mock-cooperative.ts` | **Add** — `MOCK_COOPERATIVE_USERS`, `MOCK_AGENTS`, `MOCK_COLLECTION_HUBS`, `MOCK_FLAT_PRICE_ENTRIES`, `MOCK_GRADE_PRICE_ENTRIES`, `MOCK_ASSIGNED_USERS` |
| `features/cooperative/user/users.service.ts` | **Remove** `SEED_USERS`, import `MOCK_COOPERATIVE_USERS` |
| `features/cooperative/agents/agents.service.ts` | **Remove** `SEED_AGENTS`, import `MOCK_AGENTS` |
| `features/cooperative/collection-hubs/collection-hubs.service.ts` | **Remove** `SEED_HUBS`, `UGANDA_DISTRICTS`, `COMMODITIES`; import from mock files |
| `features/cooperative/edit-prices/edit-prices.component.ts` | **Remove** `SEED_FLAT`, `SEED_GRADE`, inline `branchOptions`; import from mock files |
| `core/services/roles.service.ts` | **Remove** name/branch pools; use `MOCK_ASSIGNED_USERS` |
| Form components (farmer-register, add-user x2, users-list x2, request-stock) | **Replace** inline option arrays with `from(fetchX()).subscribe(...)` |
| `core/services/reports-state.service.ts` | **No change** |
