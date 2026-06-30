# Mock Data Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract all inline seed/reference data out of service and component files into the canonical mock layer, and wire form components to async fetch functions.

**Architecture:** Entity mock data moves to `mock-cooperative.ts`. A new `mock-reference-data.ts` provides async `fetchX()` functions for static lookup lists. A new `core/models/pricing.model.ts` holds the pricing interfaces so both the mock file and the component can share them without circular imports. Form components call `from(fetchX()).subscribe(...)` in `ngOnInit`.

**Tech Stack:** Angular 18 standalone components, TypeScript, RxJS `from()`

## Global Constraints

- Angular standalone components — no NgModule imports
- All mock data imports use `USE_MOCK` guard where the service already has it; pure reference fetch functions do not (they are always mock until the real API is ready)
- No changes to `core/services/reports-state.service.ts`
- `from` must be imported from `'rxjs'` in every component that uses it
- Branch IDs use the canonical `BR-XXX` format established in prior work

---

### Task 1: Create `core/models/pricing.model.ts`

**Files:**
- Create: `frontend/ugaap-portal/src/app/core/models/pricing.model.ts`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/edit-prices/edit-prices.component.ts` (update interface import only — no logic change yet)

**Interfaces:**
- Produces: `FlatPriceEntry`, `GradePriceEntry` — used by Task 2 (mock data) and Task 6 (component)

- [ ] **Step 1: Create the model file**

```typescript
// core/models/pricing.model.ts

export interface FlatPriceEntry {
  id: string;
  commodity: string;
  pricePerKg: number;
  branch: string;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface GradePriceEntry {
  id: string;
  commodity: string;
  gradeCode: string;
  gradeName: string;
  pricePerKg: number;
  branch: string;
  effectiveFrom: string;
  effectiveTo: string;
}
```

- [ ] **Step 2: Update the import in `edit-prices.component.ts`**

Remove the two interface definitions from the top of `edit-prices.component.ts` and add this import in their place:

```typescript
import { FlatPriceEntry, GradePriceEntry } from '../../../core/models/pricing.model';
```

The rest of the component is unchanged in this task.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/ugaap-portal/src/app/core/models/pricing.model.ts
git add frontend/ugaap-portal/src/app/features/cooperative/edit-prices/edit-prices.component.ts
git commit -m "refactor: extract FlatPriceEntry and GradePriceEntry to core/models/pricing.model.ts"
```

---

### Task 2: Extend `mock-cooperative.ts` with all new seed constants

**Files:**
- Modify: `frontend/ugaap-portal/src/app/core/mock/mock-cooperative.ts`

**Interfaces:**
- Consumes: `FlatPriceEntry`, `GradePriceEntry` from `core/models/pricing.model`
- Produces: `MOCK_COOPERATIVE_USERS`, `MOCK_AGENTS`, `MOCK_COLLECTION_HUBS`, `MOCK_FLAT_PRICE_ENTRIES`, `MOCK_GRADE_PRICE_ENTRIES`, `MOCK_ASSIGNED_USERS`

- [ ] **Step 1: Add the import for pricing types at the top of `mock-cooperative.ts`**

Add after the existing imports:

```typescript
import { FlatPriceEntry, GradePriceEntry } from '../models/pricing.model';
```

- [ ] **Step 2: Add `MOCK_COOPERATIVE_USERS` to `mock-cooperative.ts`**

Append after the existing `// ── Cooperative dashboard` block:

```typescript
// ── Cooperative users ─────────────────────────────────────────────────────────

export const MOCK_COOPERATIVE_USERS = [
  { id: '1', name: 'Sarah Namubiru',   email: 's.namubiru@ugaap.co.ug',  phone: '+256 701 445 678', role: 'COOPERATIVE ADMIN', organization: 'UGAAP Central',            lastLogin: '2 mins ago', status: 'active'   as const },
  { id: '2', name: 'James Okello',     email: 'j.okello@ugaap.co.ug',    phone: '+256 754 123 456', role: 'LOGISTICS MANAGER', organization: 'Kasese Coffee Coop',        lastLogin: '1 hour ago', status: 'active'   as const },
  { id: '3', name: 'Mary Atim',        email: 'm.atim@ugaap.co.ug',      phone: '+256 772 987 654', role: 'ACCOUNTANT',        organization: 'Mubende Warehouse Central', lastLogin: 'Yesterday',  status: 'active'   as const },
  { id: '4', name: 'Robert Ssemakula', email: 'r.ssemakula@ugaap.co.ug', phone: '+256 700 654 321', role: 'COOPERATIVE ADMIN', organization: 'Kasese Coffee Coop',        lastLogin: '3 days ago', status: 'inactive' as const },
];
```

- [ ] **Step 3: Add `MOCK_AGENTS` to `mock-cooperative.ts`**

```typescript
// ── Field agents ──────────────────────────────────────────────────────────────

export const MOCK_AGENTS = [
  { id: 'agt-001', agentCode: 'AGT-0001', fullName: 'Moses Byaruhanga', phone: '+256772114501', email: 'moses.b@bugishu.coop', nationalId: 'CM900421003XKE', role: 'field_agent'      as const, branchId: 'BR-HOI', branchName: 'Hoima Central',    assignedFarmers: 64, collectionsThisSeason: '18.2 MT', status: 'active'   as const, registeredAt: '2025-02-14' },
  { id: 'agt-002', agentCode: 'AGT-0002', fullName: 'Sarah Nambooze',   phone: '+256701558294', email: 'sarah.n@bugishu.coop', nationalId: 'CF880317002LMQ', role: 'collection_clerk' as const, branchId: 'BR-HOI', branchName: 'Hoima Central',    assignedFarmers: 41, collectionsThisSeason: '12.7 MT', status: 'active'   as const, registeredAt: '2025-03-02' },
  { id: 'agt-003', agentCode: 'AGT-0003', fullName: 'Ivan Okello',      phone: '+256759301873', email: 'ivan.o@bugishu.coop',  nationalId: 'CM921105004PRT', role: 'field_agent'      as const, branchId: 'BR-GUL', branchName: 'Gulu Branch',      assignedFarmers: 52, collectionsThisSeason: '15.9 MT', status: 'active'   as const, registeredAt: '2025-04-19' },
  { id: 'agt-004', agentCode: 'AGT-0004', fullName: 'Grace Akello',     phone: '+256782446120', email: 'grace.a@bugishu.coop', nationalId: 'CF950623001ZWB', role: 'field_agent'      as const, branchId: 'BR-LIR', branchName: 'Lira Cooperative', assignedFarmers: 38, collectionsThisSeason: '9.4 MT',  status: 'inactive' as const, registeredAt: '2025-01-28' },
  { id: 'agt-005', agentCode: 'AGT-0005', fullName: 'Peter Wanyama',    phone: '+256703918456', email: 'peter.w@bugishu.coop', nationalId: 'CM870914005QAC', role: 'collection_clerk' as const, branchId: 'BR-MBL', branchName: 'Mbale West',       assignedFarmers: 47, collectionsThisSeason: '14.1 MT', status: 'active'   as const, registeredAt: '2025-05-07' },
];
```

- [ ] **Step 4: Add `MOCK_COLLECTION_HUBS` to `mock-cooperative.ts`**

```typescript
// ── Collection hubs ───────────────────────────────────────────────────────────

export const MOCK_COLLECTION_HUBS = [
  { id: 'hub-001', hubCode: 'HUB-0001', name: 'Hoima Market Hub',               location: 'Hoima Trading Centre, Plot 14',  district: 'Hoima',   branchId: 'BR-HOI', branchName: 'Hoima Central',    capacity: 50, currentLoad: 32.4, commodities: ['Robusta Coffee', 'Maize'],              status: 'active'   as const, createdAt: '2025-01-10' },
  { id: 'hub-002', hubCode: 'HUB-0002', name: 'Masindi South Collection Point',  location: 'Masindi-Kampala Rd, Km 4',      district: 'Masindi', branchId: 'BR-MAS', branchName: 'Masindi Depot',    capacity: 80, currentLoad: 71.0, commodities: ['Robusta Coffee'],                       status: 'active'   as const, createdAt: '2025-02-03' },
  { id: 'hub-003', hubCode: 'HUB-0003', name: 'Gulu Farmers Hub',                location: 'Gulu Central Market, Stall 22', district: 'Gulu',    branchId: 'BR-GUL', branchName: 'Gulu Branch',      capacity: 40, currentLoad: 12.7, commodities: ['Simsim', 'Soya Beans', 'Millet'],      status: 'active'   as const, createdAt: '2025-03-18' },
  { id: 'hub-004', hubCode: 'HUB-0004', name: 'Lira East Aggregation Centre',    location: 'Lira Municipality, Block C',    district: 'Lira',    branchId: 'BR-LIR', branchName: 'Lira Cooperative', capacity: 60, currentLoad: 0,    commodities: ['Sunflower', 'Soya Beans'],              status: 'inactive' as const, createdAt: '2025-04-22' },
  { id: 'hub-005', hubCode: 'HUB-0005', name: 'Mbale West Hub',                  location: 'Mbale Industrial Area, Shed B', district: 'Mbale',   branchId: 'BR-MBL', branchName: 'Mbale West',       capacity: 35, currentLoad: 28.9, commodities: ['Arabica Coffee', 'Maize'],              status: 'active'   as const, createdAt: '2025-05-30' },
];
```

- [ ] **Step 5: Add `MOCK_FLAT_PRICE_ENTRIES` and `MOCK_GRADE_PRICE_ENTRIES` to `mock-cooperative.ts`**

```typescript
// ── Pricing entries ───────────────────────────────────────────────────────────

export const MOCK_FLAT_PRICE_ENTRIES: FlatPriceEntry[] = [
  { id: 'FP-1', commodity: 'Maize',  pricePerKg: 2_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'FP-2', commodity: 'Coffee', pricePerKg: 6_000, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'FP-3', commodity: 'Beans',  pricePerKg: 2_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'FP-4', commodity: 'Rice',   pricePerKg: 3_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
];

export const MOCK_GRADE_PRICE_ENTRIES: GradePriceEntry[] = [
  { id: 'GP-1', commodity: 'Maize',  gradeCode: 'A', gradeName: 'Premium',   pricePerKg: 3_250, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-2', commodity: 'Maize',  gradeCode: 'B', gradeName: 'Standard',  pricePerKg: 2_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-3', commodity: 'Maize',  gradeCode: 'C', gradeName: 'Low Grade', pricePerKg: 1_750, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-4', commodity: 'Coffee', gradeCode: 'A', gradeName: 'Premium',   pricePerKg: 7_800, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-5', commodity: 'Coffee', gradeCode: 'B', gradeName: 'Standard',  pricePerKg: 6_000, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-6', commodity: 'Beans',  gradeCode: 'A', gradeName: 'Premium',   pricePerKg: 3_250, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-7', commodity: 'Beans',  gradeCode: 'B', gradeName: 'Standard',  pricePerKg: 2_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
];
```

- [ ] **Step 6: Add `MOCK_ASSIGNED_USERS` to `mock-cooperative.ts`**

These replace the generative name/branch pools in `roles.service.ts` — names are preserved exactly:

```typescript
// ── Role assigned users ───────────────────────────────────────────────────────

export const MOCK_ASSIGNED_USERS = [
  { id: 'u1', name: 'Sarah Nakato',  email: 'sarah.nakato@coop.ug',  branch: 'Kampala Branch',     assignedAt: '2024-01-01' },
  { id: 'u2', name: 'James Ochieng', email: 'james.ochieng@coop.ug', branch: 'Jinja Branch',       assignedAt: '2024-01-02' },
  { id: 'u3', name: 'Grace Atim',    email: 'grace.atim@coop.ug',    branch: 'Mbale Branch',       assignedAt: '2024-01-03' },
  { id: 'u4', name: 'David Wafula',  email: 'david.wafula@coop.ug',  branch: 'Fort Portal Branch', assignedAt: '2024-01-04' },
  { id: 'u5', name: 'Alice Apio',    email: 'alice.apio@coop.ug',    branch: 'Adjumani Branch',    assignedAt: '2024-01-05' },
  { id: 'u6', name: 'Peter Ssali',   email: 'peter.ssali@coop.ug',   branch: 'Kampala Branch',     assignedAt: '2024-01-06' },
  { id: 'u7', name: 'Lydia Nambi',   email: 'lydia.nambi@coop.ug',   branch: 'Jinja Branch',       assignedAt: '2024-01-07' },
  { id: 'u8', name: 'Moses Kato',    email: 'moses.kato@coop.ug',    branch: 'Mbale Branch',       assignedAt: '2024-01-08' },
];
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/ugaap-portal/src/app/core/mock/mock-cooperative.ts
git commit -m "feat: add MOCK_COOPERATIVE_USERS, MOCK_AGENTS, MOCK_COLLECTION_HUBS, MOCK_FLAT_PRICE_ENTRIES, MOCK_GRADE_PRICE_ENTRIES, MOCK_ASSIGNED_USERS to mock-cooperative"
```

---

### Task 3: Update `users.service.ts`

**Files:**
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/user/users.service.ts`

**Interfaces:**
- Consumes: `MOCK_COOPERATIVE_USERS` from `core/mock/mock-cooperative`

- [ ] **Step 1: Replace `SEED_USERS` with import**

Remove the entire `const SEED_USERS: User[] = [...]` block and add to the imports section:

```typescript
import { MOCK_COOPERATIVE_USERS } from '../../../core/mock/mock-cooperative';
```

- [ ] **Step 2: Update all three references from `SEED_USERS` to `MOCK_COOPERATIVE_USERS`**

```typescript
// BehaviorSubject init
private readonly _users = new BehaviorSubject<User[]>(
  USE_MOCK ? [...MOCK_COOPERATIVE_USERS] as User[] : [],
);

// list()
list(): Observable<User[]> {
  if (USE_MOCK) return of([...MOCK_COOPERATIVE_USERS] as User[]);
  // ...

// getById()
getById(id: string): Observable<User | undefined> {
  if (USE_MOCK) return of(MOCK_COOPERATIVE_USERS.find(u => u.id === id) as User | undefined);
  // ...
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/ugaap-portal/src/app/features/cooperative/user/users.service.ts
git commit -m "refactor: move SEED_USERS to MOCK_COOPERATIVE_USERS in mock-cooperative"
```

---

### Task 4: Update `agents.service.ts`

**Files:**
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/agents/agents.service.ts`

**Interfaces:**
- Consumes: `MOCK_AGENTS` from `core/mock/mock-cooperative`

- [ ] **Step 1: Replace `SEED_AGENTS` with import**

Remove the entire `const SEED_AGENTS: Agent[] = [...]` block and add to the imports section:

```typescript
import { MOCK_AGENTS } from '../../../core/mock/mock-cooperative';
```

- [ ] **Step 2: Update all three references from `SEED_AGENTS` to `MOCK_AGENTS`**

```typescript
// BehaviorSubject init
private readonly _agents = new BehaviorSubject<Agent[]>(
  USE_MOCK ? [...MOCK_AGENTS] as Agent[] : [],
);

// list()
list(): Observable<Agent[]> {
  if (USE_MOCK) return of([...MOCK_AGENTS] as Agent[]);
  // ...

// getById()
getById(id: string): Observable<Agent | undefined> {
  if (USE_MOCK) return of(MOCK_AGENTS.find(a => a.id === id) as Agent | undefined);
  // ...
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/ugaap-portal/src/app/features/cooperative/agents/agents.service.ts
git commit -m "refactor: move SEED_AGENTS to MOCK_AGENTS in mock-cooperative"
```

---

### Task 5: Update `collection-hubs.service.ts`

**Files:**
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/collection-hubs/collection-hubs.service.ts`

**Interfaces:**
- Consumes: `MOCK_COLLECTION_HUBS` from `core/mock/mock-cooperative`
- Note: `UGANDA_DISTRICTS` and `COMMODITIES` are removed here — the form component will get them from `mock-reference-data.ts` in Task 9.

- [ ] **Step 1: Add import for `MOCK_COLLECTION_HUBS`**

Add to the imports section (the `MOCK_BRANCHES` import is already there from prior work):

```typescript
import { MOCK_COLLECTION_HUBS } from '../../../core/mock/mock-cooperative';
```

- [ ] **Step 2: Remove `SEED_HUBS`, `UGANDA_DISTRICTS`, `COMMODITIES`**

Delete these three exported/const blocks entirely:

```typescript
// DELETE the entire SEED_HUBS const block
// DELETE export const UGANDA_DISTRICTS = [...]
// DELETE export const COMMODITIES = [...]
```

- [ ] **Step 3: Update all three references from `SEED_HUBS` to `MOCK_COLLECTION_HUBS`**

```typescript
// BehaviorSubject init
private readonly _hubs = new BehaviorSubject<CollectionHub[]>(
  USE_MOCK ? [...MOCK_COLLECTION_HUBS] as CollectionHub[] : [],
);

// list()
list(): Observable<CollectionHub[]> {
  if (USE_MOCK) return of([...MOCK_COLLECTION_HUBS] as CollectionHub[]);
  // ...

// getById()
getById(id: string): Observable<CollectionHub | undefined> {
  if (USE_MOCK) return of(MOCK_COLLECTION_HUBS.find(h => h.id === id) as CollectionHub | undefined);
  // ...
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: errors on `UGANDA_DISTRICTS` and `COMMODITIES` in `collection-hub-form.component.ts` — these will be fixed in Task 9. All other errors: none.

- [ ] **Step 5: Commit**

```bash
git add frontend/ugaap-portal/src/app/features/cooperative/collection-hubs/collection-hubs.service.ts
git commit -m "refactor: move SEED_HUBS to MOCK_COLLECTION_HUBS; remove UGANDA_DISTRICTS and COMMODITIES from service"
```

---

### Task 6: Update `edit-prices.component.ts`

**Files:**
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/edit-prices/edit-prices.component.ts`

**Interfaces:**
- Consumes: `FlatPriceEntry`, `GradePriceEntry` from `core/models/pricing.model` (import already added in Task 1)
- Consumes: `MOCK_FLAT_PRICE_ENTRIES`, `MOCK_GRADE_PRICE_ENTRIES` from `core/mock/mock-cooperative`
- Consumes: `MOCK_BRANCHES` from `core/mock/mock-branch`

- [ ] **Step 1: Add imports for mock data and branches**

```typescript
import { MOCK_FLAT_PRICE_ENTRIES, MOCK_GRADE_PRICE_ENTRIES } from '../../../core/mock/mock-cooperative';
import { MOCK_BRANCHES } from '../../../core/mock/mock-branch';
```

- [ ] **Step 2: Remove `SEED_FLAT` and `SEED_GRADE` constant blocks**

Delete the two `const SEED_FLAT` and `const SEED_GRADE` blocks entirely (lines currently around 42–57 of the component).

- [ ] **Step 3: Update the signal initialisers to use the imported constants**

```typescript
flatEntries  = signal<FlatPriceEntry[]>(USE_MOCK  ? [...MOCK_FLAT_PRICE_ENTRIES]  : []);
gradeEntries = signal<GradePriceEntry[]>(USE_MOCK ? [...MOCK_GRADE_PRICE_ENTRIES] : []);
```

- [ ] **Step 4: Replace the inline `branchOptions` with `MOCK_BRANCHES` plus the "all" sentinel**

```typescript
readonly branchOptions = [
  { id: 'all', name: 'All Branches' },
  ...MOCK_BRANCHES,
];
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/ugaap-portal/src/app/features/cooperative/edit-prices/edit-prices.component.ts
git commit -m "refactor: move SEED_FLAT/SEED_GRADE to mock-cooperative; replace branchOptions with MOCK_BRANCHES"
```

---

### Task 7: Update `roles.service.ts`

**Files:**
- Modify: `frontend/ugaap-portal/src/app/core/services/roles.service.ts`

**Interfaces:**
- Consumes: `MOCK_ASSIGNED_USERS` from `core/mock/mock-cooperative`

- [ ] **Step 1: Add import for `MOCK_ASSIGNED_USERS`**

```typescript
import { MOCK_ROLES, MOCK_ASSIGNED_USERS } from '../mock/mock-cooperative';
```

- [ ] **Step 2: Remove the three generative constant pools**

Delete these three lines entirely:

```typescript
// DELETE:
const FIRST_NAMES = ['Sarah', 'James', 'Grace', 'David', 'Alice', 'Peter', 'Lydia', 'Moses'];
const LAST_NAMES  = ['Nakato', 'Ochieng', 'Atim', 'Wafula', 'Apio', 'Ssali', 'Nambi', 'Kato'];
const BRANCHES    = ['Kampala Branch', 'Jinja Branch', 'Mbale Branch', 'Fort Portal Branch', 'Adjumani Branch'];
```

- [ ] **Step 3: Replace `getUsersForRole` body**

```typescript
getUsersForRole(usersCount: number): AssignedUser[] {
  return (MOCK_ASSIGNED_USERS as AssignedUser[]).slice(0, Math.min(usersCount, MOCK_ASSIGNED_USERS.length));
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/ugaap-portal/src/app/core/services/roles.service.ts
git commit -m "refactor: replace generative name pools with static MOCK_ASSIGNED_USERS in roles.service"
```

---

### Task 8: Create `core/mock/mock-reference-data.ts`

**Files:**
- Create: `frontend/ugaap-portal/src/app/core/mock/mock-reference-data.ts`

**Interfaces:**
- Produces: `fetchDistricts`, `fetchCommodities`, `fetchGenderOptions`, `fetchBankOptions`, `fetchRegions`, `fetchIrrigationTypes`, `fetchLandOwnership`, `fetchStockCategories`, `fetchStockUnits`, `fetchRoleFilterOptions`, `fetchCooperationOptions` — all `() => Promise<string[]>`

- [ ] **Step 1: Create the file**

```typescript
// core/mock/mock-reference-data.ts
//
// Async fetch functions for static reference / lookup data.
// Each simulates a 300 ms network round-trip so components behave identically
// whether running against mock or a real API.
// Replace the body of any function with a real http call when the endpoint is ready.

const delay = <T>(data: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), 300));

export const fetchDistricts = (): Promise<string[]> =>
  delay([
    'Hoima', 'Masindi', 'Gulu', 'Lira', 'Mbale', 'Kampala',
    'Jinja', 'Mbarara', 'Arua', 'Soroti', 'Tororo', 'Kasese',
    'Kabale', 'Fort Portal', 'Masaka',
  ]);

export const fetchCommodities = (): Promise<string[]> =>
  delay(['Robusta Coffee', 'Arabica Coffee', 'Maize', 'Rice', 'Sunflower', 'Soya Beans', 'Simsim', 'Millet']);

export const fetchGenderOptions = (): Promise<string[]> =>
  delay(['Female', 'Male', 'Other', 'Prefer not to say']);

export const fetchBankOptions = (): Promise<string[]> =>
  delay([
    'Stanbic Bank', 'Centenary Bank', 'DFCU Bank', 'Bank of Africa',
    'Equity Bank', 'Absa Bank', 'Post Bank', 'Finance Trust Bank', 'Other',
  ]);

export const fetchRegions = (): Promise<string[]> =>
  delay(['Central Region', 'Eastern Region', 'Northern Region', 'Western Region']);

export const fetchIrrigationTypes = (): Promise<string[]> =>
  delay(['Rain-fed', 'Irrigation', 'Both']);

export const fetchLandOwnership = (): Promise<string[]> =>
  delay(['Owned', 'Leased', 'Communal', 'Family Land']);

export const fetchStockCategories = (): Promise<string[]> =>
  delay(['FERTILIZER', 'SEEDS', 'EQUIPMENT', 'PACKAGING', 'TOOLS']);

export const fetchStockUnits = (): Promise<string[]> =>
  delay(['Bags', 'Kgs', 'Units', 'Sacks', 'Pieces']);

export const fetchRoleFilterOptions = (): Promise<string[]> =>
  delay(['All Roles', 'PLATFORM ADMIN', 'COOPERATIVE ADMIN', 'LOGISTICS MANAGER', 'ACCOUNTANT']);

export const fetchCooperationOptions = (): Promise<string[]> =>
  delay(['All Cooperations', 'UGAAP Central', 'Kasese Coffee Coop', 'Mubende Warehouse Central']);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/ugaap-portal/src/app/core/mock/mock-reference-data.ts
git commit -m "feat: add mock-reference-data.ts with async fetch functions for all lookup lists"
```

---

### Task 9: Update form components to use fetch functions

**Files:**
- Modify: `frontend/ugaap-portal/src/app/features/branch/branch-farmers/branch.farmer-register/branch.farmer-register.component.ts`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/user/add-user/add-user.component.ts`
- Modify: `frontend/ugaap-portal/src/app/features/platform/user/add-user/add-user.component.ts`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/user/users-list/users-list.component.ts`
- Modify: `frontend/ugaap-portal/src/app/features/platform/user/users-list/users-list.component.ts`
- Modify: `frontend/ugaap-portal/src/app/features/branch/inventory/request-stock/request-stock.component.ts`
- Modify: `frontend/ugaap-portal/src/app/features/cooperative/collection-hubs/collection-hub-form/collection-hub-form.component.ts`

**Interfaces:**
- Consumes: all `fetchX()` functions from `core/mock/mock-reference-data`
- Consumes: `from` from `'rxjs'`

The pattern is the same in every file:
1. Add `from` to the `rxjs` import
2. Add `fetchX` to the `mock-reference-data` import
3. Change `readonly propName = [...]` to `propName: string[] = []`
4. Add/extend `ngOnInit()` to call `from(fetchX()).subscribe(v => this.propName = v)`
5. If the component doesn't implement `OnInit`, add `implements OnInit` and the lifecycle method

- [ ] **Step 1: Update `branch.farmer-register.component.ts`**

Add imports:
```typescript
import { OnInit } from '@angular/core';
import { from } from 'rxjs';
import {
  fetchGenderOptions,
  fetchIrrigationTypes,
  fetchRegions,
  fetchLandOwnership,
  fetchBankOptions,
} from '../../../../core/mock/mock-reference-data';
```

Change the class declaration:
```typescript
export class BranchFarmerRegisterComponent implements OnInit {
```

Replace the five `readonly` option arrays with mutable properties:
```typescript
genderOptions:       string[] = [];
irrigationOptions:   string[] = [];
locationOptions:     string[] = [];
landOwnershipOptions: string[] = [];
bankOptions:         string[] = [];
```

Add `ngOnInit()`:
```typescript
ngOnInit(): void {
  from(fetchGenderOptions()).subscribe(v    => this.genderOptions        = v);
  from(fetchIrrigationTypes()).subscribe(v  => this.irrigationOptions    = v);
  from(fetchRegions()).subscribe(v          => this.locationOptions       = v);
  from(fetchLandOwnership()).subscribe(v    => this.landOwnershipOptions  = v);
  from(fetchBankOptions()).subscribe(v      => this.bankOptions           = v);
}
```

- [ ] **Step 2: Update `cooperative/user/add-user/add-user.component.ts`**

Add imports:
```typescript
import { from } from 'rxjs';
import { fetchGenderOptions } from '../../../../core/mock/mock-reference-data';
```

Replace:
```typescript
genderOptions: string[] = [];
roleOptions   = ['Admin', 'Logistics Manager', 'Accountant', 'Field Officer'];
```

In the existing `ngOnInit()`:
```typescript
ngOnInit(): void {
  from(fetchGenderOptions()).subscribe(v => this.genderOptions = v);
  // ... existing ngOnInit logic
}
```

Note: `roleOptions` stays as a hardcoded array — these are the roles specific to the cooperative scope and aren't in the reference data file.

- [ ] **Step 3: Update `platform/user/add-user/add-user.component.ts`**

Add imports:
```typescript
import { from } from 'rxjs';
import { fetchGenderOptions } from '../../../../core/mock/mock-reference-data';
```

Replace:
```typescript
genderOptions: string[] = [];
roleOptions   = ['Admin', 'Maker', 'Checker', 'Logistics Manager', 'Accountant', 'Field Officer'];
```

In the existing `ngOnInit()`:
```typescript
ngOnInit(): void {
  from(fetchGenderOptions()).subscribe(v => this.genderOptions = v);
  // ... existing ngOnInit logic
}
```

- [ ] **Step 4: Update `cooperative/user/users-list/users-list.component.ts`**

Add imports:
```typescript
import { from } from 'rxjs';
import { fetchRoleFilterOptions, fetchCooperationOptions } from '../../../../core/mock/mock-reference-data';
```

Replace:
```typescript
roleOptions:        string[] = [];
cooperationOptions: string[] = [];
```

Add/extend `ngOnInit()`:
```typescript
ngOnInit(): void {
  from(fetchRoleFilterOptions()).subscribe(v   => this.roleOptions        = v);
  from(fetchCooperationOptions()).subscribe(v  => this.cooperationOptions = v);
}
```

Add `implements OnInit` and `OnInit` import if not already present.

- [ ] **Step 5: Update `platform/user/users-list/users-list.component.ts`**

Same as Step 4 — identical pattern, same imports and same two fetch calls.

- [ ] **Step 6: Update `request-stock/request-stock.component.ts`**

Add imports:
```typescript
import { from } from 'rxjs';
import { fetchStockCategories, fetchStockUnits } from '../../../../core/mock/mock-reference-data';
```

Replace:
```typescript
categories: string[] = [];
units:      string[] = [];
```

Add/extend `ngOnInit()`:
```typescript
ngOnInit(): void {
  from(fetchStockCategories()).subscribe(v => this.categories = v);
  from(fetchStockUnits()).subscribe(v      => this.units      = v);
}
```

Add `implements OnInit` and `OnInit` import if not already present.

- [ ] **Step 7: Update `collection-hub-form/collection-hub-form.component.ts`**

This component previously imported `UGANDA_DISTRICTS` and `COMMODITIES` from `collection-hubs.service.ts` (removed in Task 5). Replace with fetch functions.

Remove from import:
```typescript
// REMOVE: UGANDA_DISTRICTS, COMMODITIES from the collection-hubs.service import
```

Add imports:
```typescript
import { from } from 'rxjs';
import { fetchDistricts, fetchCommodities } from '../../../../core/mock/mock-reference-data';
```

Replace:
```typescript
districts:     string[] = [];
allCommodities: string[] = [];
```

In the existing `ngOnInit()`:
```typescript
ngOnInit(): void {
  from(fetchDistricts()).subscribe(v   => this.districts      = v);
  from(fetchCommodities()).subscribe(v => this.allCommodities = v);
  // ... existing ngOnInit logic (edit mode hub loading)
}
```

- [ ] **Step 8: Verify TypeScript compiles clean**

```bash
cd frontend/ugaap-portal && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add \
  frontend/ugaap-portal/src/app/features/branch/branch-farmers/branch.farmer-register/branch.farmer-register.component.ts \
  frontend/ugaap-portal/src/app/features/cooperative/user/add-user/add-user.component.ts \
  frontend/ugaap-portal/src/app/features/platform/user/add-user/add-user.component.ts \
  frontend/ugaap-portal/src/app/features/cooperative/user/users-list/users-list.component.ts \
  frontend/ugaap-portal/src/app/features/platform/user/users-list/users-list.component.ts \
  frontend/ugaap-portal/src/app/features/branch/inventory/request-stock/request-stock.component.ts \
  frontend/ugaap-portal/src/app/features/cooperative/collection-hubs/collection-hub-form/collection-hub-form.component.ts
git commit -m "refactor: replace inline option arrays with fetchX() from mock-reference-data across form components"
```
