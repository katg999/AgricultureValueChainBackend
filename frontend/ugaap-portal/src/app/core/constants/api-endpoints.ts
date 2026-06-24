// ─────────────────────────────────────────────────────────────────────────────
// core/constants/api-endpoints.ts
//
// Single source of truth for every backend URL.
// Never write a raw string URL anywhere else in the app — import from here.
//
// Base URL:  /api/v1  (proxied to backend via API-Gateway)
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8083'; // API-Gateway call

export const API_ENDPOINTS = {
  // ── Authentication ──────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: `${BASE}/auth/login`,
    LOGOUT: `${BASE}/auth/logout`,
    VERIFY_OTP: `${BASE}/auth/login/verify-otp`,
    VERIFY_PASSWORD_RESET_OTP: `${BASE}/auth/password-reset/verify-otp`,
    REFRESH_TOKEN: `${BASE}/auth/refresh-token`,
    FORGOT_PASSWORD: `${BASE}/auth/password-reset/request`,
    RESET_PASSWORD: `${BASE}/auth/password-reset/set-password`,
    RESEND_OTP: `${BASE}/auth/resend-otp`,
  },

  MAKER_CHECKER: {
    SETUP: `${BASE}/api/v1/maker-checker/setup`,
  },

  // ── Platform Admin ──────────────────────────────────────────────────────────
  PLATFORM: {
    COOPERATIVES: `${BASE}/api/v1/cooperatives`,
    COOPERATIVE_BY_ID: (id: string) => `${BASE}/api/v1/cooperatives/${id}`,
    ACTIVATE_COOPERATIVE: (id: string) => `${BASE}/api/v1/cooperatives/${id}/activate`,
    DEACTIVATE_COOPERATIVE: (id: string) => `${BASE}/api/v1/cooperatives/${id}/deactivate`,
  },

  // ── Cooperative Admin ───────────────────────────────────────────────────────
  COOPERATIVE: {
    DASHBOARD: `${BASE}/api/v1/cooperatives/dashboard`,
    GRADING: `${BASE}/api/v1/cooperatives/grading`,
    PRICING: `${BASE}/api/v1/cooperatives/pricing`,

    // Farmers (Mapped to FarmerController)
    FARMERS: `${BASE}/api/v1/farmers/search`,
    FARMER_BY_ID: (id: string) => `${BASE}/api/v1/farmers/${id}`,
    FARMER_APPROVE: (id: string) => `${BASE}/api/v1/farmers/${id}/approve`,
    FARMER_REJECT: (id: string) => `${BASE}/api/v1/farmers/${id}/reject`,

    ALL: `${BASE}/api/v1/cooperatives`,

    // Branches
    BRANCHES: `${BASE}/api/v1/cooperatives/branches`,
    BRANCH_BY_ID: (id: string) => `${BASE}/api/v1/cooperatives/branches/${id}`,

    // Cooperative collections aggregation (Mapped to CooperativeCollectionController)
    COLLECTIONS: `${BASE}/cooperative/collections`,

    // Session/season configuration (Mapped to CooperativeCollectionController)
    SESSION_CONFIG: `${BASE}/cooperative/session-config`,
    SEASON_CONFIG: `${BASE}/cooperative/season-config`,

    PAYMENT_BATCHES: `${BASE}/api/v1/settlements/batches`,
    PAYMENT_FARMERS: `${BASE}/api/v1/settlements/farmers`,

    // Inventory Service (Staged Next Deployment)
    INVENTORY: `${BASE}/api/v1/inventory`,
    USERS: `${BASE}/api/v1/access/users`,
    USER_BY_ID: (id: string) => `${BASE}/api/v1/access/users/${id}`,

    AGENTS: `${BASE}/api/v1/cooperatives/agents`,
    AGENT_BY_ID: (id: string) => `${BASE}/api/v1/cooperatives/agents/${id}`,
    AGENT_DEACTIVATE: (id: string) => `${BASE}/api/v1/cooperatives/agents/${id}/deactivate`,
    AGENT_ACTIVATE: (id: string) => `${BASE}/api/v1/cooperatives/agents/${id}/activate`,

    // Collection hubs
    COLLECTION_HUBS: `${BASE}/cooperative/collection-hubs`,
    COLLECTION_HUB_BY_ID: (id: string) => `${BASE}/cooperative/collection-hubs/${id}`,
    COLLECTION_HUB_ACTIVATE: (id: string) => `${BASE}/cooperative/collection-hubs/${id}/activate`,
    COLLECTION_HUB_DEACTIVATE: (id: string) =>
      `${BASE}/cooperative/collection-hubs/${id}/deactivate`,
  },

  // ── Branches Infrastructure ──────────────────────────────────────────────────
  BRANCHES: {
    CREATE: `${BASE}/api/v1/branches`,
    LIST: (tenantId: string) => `${BASE}/api/v1/branches?tenantId=${tenantId}`,
    BY_ID: (id: string) => `${BASE}/api/v1/branches/${id}`,
  },

  // ── Members (Farmer registration — membership-service) ───────────────────────
  MEMBERS: {
    REGISTER: `${BASE}/api/v1/members`,
    BY_ID: (id: string) => `${BASE}/api/v1/members/${id}`,
    LIST: (tenantId: string, branchId?: string) =>
      branchId
        ? `${BASE}/api/v1/members?tenantId=${tenantId}&branchId=${branchId}`
        : `${BASE}/api/v1/members?tenantId=${tenantId}`,
  },

  // ── Branch Staff ────────────────────────────────────────────────────────────
  // Scoped to a single branch (X-Branch-ID header set by interceptor)
  // ── Branch Staff operations ──────────────────────────────────────────────────
  BRANCH: {
    DASHBOARD: `${BASE}/api/v1/branches/dashboard`,
    DAILY_GRADING: `${BASE}/api/v1/branches/daily-grading`,

    // Branch collections aggregation (Mapped to BranchCollectionController)
    COLLECTIONS: `${BASE}/branch/collections`,

    // Branch farmer delivery ledger entry CRUD (Mapped to BranchCollectionController)
    FARMER_DELIVERIES: `${BASE}/branch/farmer-deliveries`,
    FARMER_DELIVERY_BY_ID: (id: string) => `${BASE}/branch/farmer-deliveries/${id}`,
    // Backward-compat alias (some components/services may reference this old key)
    FARMER_DELIVERIES_BY_ID: (id: string) => `${BASE}/branch/farmer-deliveries/${id}`,

    // Farmer Registry Lookup (FarmerController)
    FARMERS: `${BASE}/api/v1/farmers/search`,
    FARMER_BY_ID: (id: string) => `${BASE}/api/v1/farmers/${id}`,

    // Branch-level farmer-deliveries listing (Mapped to BranchCollectionController)
    // (This reuses the same endpoint as FARMER_DELIVERIES with GET semantics)

    // Branch Inventory Hooks (Prepared for INVENTORY-SERVICE)
    INVENTORY: `${BASE}/api/v1/inventory/branch`,

    // Inter-Service Settlements Synchronizer (SettlementController)
    BATCHES: `${BASE}/api/v1/settlements/batch-recover`,
    BATCH_BY_ID: (id: string) => `${BASE}/api/v1/settlements/${id}`,
    PAYMENT_FARMERS: `${BASE}/api/v1/settlements/farmers`,
  },

  USERS: `${BASE}/api/v1/access/users`,

  // ── Inventory Service — real backend paths ──────────────────────────────────
  // The COOPERATIVE.INVENTORY and BRANCH.INVENTORY constants above are the
  // PLANNED gateway routes (not yet wired in the gateway config).
  // These paths below are where the InventoryService microservice actually listens.
  // The frontend uses these directly until the gateway routing is set up.
  INVENTORY_BACKEND: {
    STOCK_ALL:    `${BASE}/api/input-stock/all`,   // GET ?cooperativeId=X or ?branchId=X
    STOCK_CREATE: `${BASE}/api/input-stock`,        // POST — add new stock
    ALLOCATION_ISSUE:      `${BASE}/api/allocations/issue`,
    ALLOCATIONS_BY_BRANCH: (branchId: string) => `${BASE}/api/allocations/branch/${branchId}`,
    ALLOCATIONS_BY_COOP:   (coopId: string)   => `${BASE}/api/allocations/cooperative/${coopId}`,
  },

  // ── Access Control (Roles & Permissions) ───────────────────────────────────
  // Scoped to the current cooperative; used by the User management feature
  ACCESS: {
    ROLES: `${BASE}/api/v1/access/roles`,
    ROLE_BY_ID: (id: string) => `${BASE}/api/v1/access/roles/${id}`,
    ROLE_PERMISSIONS: (id: string) => `${BASE}/api/v1/access/roles/${id}/permissions`,
    USERS: `${BASE}/api/v1/access/users`,
    USER_BY_ID: (id: string) => `${BASE}/api/v1/access/users/${id}`,
  },
} as const;

// // ─────────────────────────────────────────────────────────────────────────────
// // core/constants/api-endpoints.ts
// //
// // Single source of truth for every backend URL.
// // Never write a raw string URL anywhere else in the app — import from here.
// //
// // Base URL:  /api/v1  (proxied to backend in proxy.conf.json)
// // ─────────────────────────────────────────────────────────────────────────────

// const BASE = 'http://localhost:8083'; //API-Gateway call

// export const API_ENDPOINTS = {
//   // ── Authentication ──────────────────────────────────────────────────────────
//   AUTH: {
//     LOGIN: `${BASE}/auth/login`,
//     LOGOUT: `${BASE}/auth/logout`,
//     VERIFY_OTP: `${BASE}/auth/verify-otp`,
//     VERIFY_PASSWORD_RESET_OTP: `${BASE}/auth/password-reset/verify-otp`,
//     REFRESH_TOKEN: `${BASE}/auth/refresh-token`,
//     FORGOT_PASSWORD: `${BASE}/auth/password-reset/request`,
//     RESET_PASSWORD: `${BASE}/auth/password-reset/set-password`,
//     RESEND_OTP: `${BASE}/auth/resend-otp`,
//   },

//   MAKER_CHECKER: {
//     SETUP: `${BASE}/api/v1/maker-checker/setup`,
//   },
//   // ── Platform Admin ──────────────────────────────────────────────────────────
//   // Manages all cooperatives on the platform
//   PLATFORM: {
//     COOPERATIVES: `${BASE}/api/v1/cooperatives`,
//     COOPERATIVE_BY_ID: (id: string) => `${BASE}/platform/cooperatives/${id}`,
//     ACTIVATE_COOPERATIVE: (id: string) => `${BASE}/platform/cooperatives/${id}/activate`,
//     DEACTIVATE_COOPERATIVE: (id: string) => `${BASE}/platform/cooperatives/${id}/deactivate`,
//   },

//   // ── Cooperative Admin ───────────────────────────────────────────────────────
//   // Scoped to a single cooperative (X-Cooperative-ID header set by interceptor)
//   COOPERATIVE: {
//     DASHBOARD: `${BASE}/cooperative/dashboard`,
//     GRADING: `${BASE}/cooperative/grading`,
//     PRICING: `${BASE}/cooperative/pricing`,

//     // Farmers
//     FARMERS: `${BASE}/cooperative/farmers`,
//     FARMER_BY_ID: (id: string) => `${BASE}/cooperative/farmers/${id}`,
//     FARMER_APPROVE: (id: string) => `${BASE}/cooperative/farmers/${id}/approve`,
//     FARMER_REJECT: (id: string) => `${BASE}/cooperative/farmers/${id}/reject`,

//     // Cooperatives & Branches (for management interface)
//     ALL: `${BASE}/cooperatives`,

//     // Branches
//     BRANCHES: `${BASE}/cooperative/branches`,
//     BRANCH_BY_ID: (id: string) => `${BASE}/cooperative/branches/${id}`,

//     // Collections
//     COLLECTIONS: `${BASE}/cooperative/collections`,
//     COLLECTION_BY_ID: (id: string) => `${BASE}/cooperative/collections/${id}`,

//     // Payment batches — read-only, aggregated across every branch (see PaymentBatchService)
//     PAYMENT_BATCHES: `${BASE}/cooperative/payment-batches`,
//     PAYMENT_FARMERS: `${BASE}/cooperative/payment-farmers`,

//     // Inventory & Users
//     INVENTORY: `${BASE}/cooperative/inventory`,
//     USERS: `${BASE}/cooperative/users`,
//     USER_BY_ID: (id: string) => `${BASE}/cooperative/users/${id}`,

//     // Field agents
//     AGENTS: `${BASE}/cooperative/agents`,
//     AGENT_BY_ID: (id: string) => `${BASE}/cooperative/agents/${id}`,
//     AGENT_DEACTIVATE: (id: string) => `${BASE}/cooperative/agents/${id}/deactivate`,
//     AGENT_ACTIVATE: (id: string) => `${BASE}/cooperative/agents/${id}/activate`,

//     // Collection hubs
//     COLLECTION_HUBS: `${BASE}/cooperative/collection-hubs`,
//     COLLECTION_HUB_BY_ID: (id: string) => `${BASE}/cooperative/collection-hubs/${id}`,
//     COLLECTION_HUB_ACTIVATE: (id: string) => `${BASE}/cooperative/collection-hubs/${id}/activate`,
//     COLLECTION_HUB_DEACTIVATE: (id: string) => `${BASE}/cooperative/collection-hubs/${id}/deactivate`,
//     // Delivery session-hours config (morning/midday/afternoon windows) — cooperative-wide
//     SESSION_CONFIG: `${BASE}/cooperative/session-config`,
//     // Season open/close status and month-range config — cooperative-wide
//     SEASON_CONFIG: `${BASE}/cooperative/season-config`,
//   },

//   // ── Branches ────────────────────────────────────────────────────────────────
//   BRANCHES: {
//     CREATE: `${BASE}/api/v1/branches`,
//     LIST: (tenantId: string) => `${BASE}/api/v1/branches?tenantId=${tenantId}`,
//     BY_ID: (id: string) => `${BASE}/api/v1/branches/${id}`,
//   },

//   // ── Branch Staff ────────────────────────────────────────────────────────────
//   // Scoped to a single branch (X-Branch-ID header set by interceptor)
//   BRANCH: {
//     DASHBOARD: `${BASE}/branch/dashboard`,
//     DAILY_GRADING: `${BASE}/branch/daily-grading`,

//     // Collections / Deliveries
//     COLLECTIONS: `${BASE}/branch/collections`,
//     COLLECTION_BY_ID: (id: string) => `${BASE}/branch/collections/${id}`,

//     // Farmers registered at this branch
//     FARMERS: `${BASE}/branch/farmers`,
//     FARMER_BY_ID: (id: string) => `${BASE}/branch/farmers/${id}`,

//     // Farmer-level deliveries nested inside branch collections
//     FARMER_DELIVERIES: `${BASE}/branch/farmer-deliveries`,
//     FARMER_DELIVERY_BY_ID: (id: string) => `${BASE}/branch/farmer-deliveries/${id}`,

//     // Inventory at this branch
//     INVENTORY: `${BASE}/branch/inventory`,

//     // Payment batches
//     BATCHES: `${BASE}/branch/batches`,
//     BATCH_BY_ID: (id: string) => `${BASE}/branch/batches/${id}`,

//     // Farmers eligible for payment batches at this branch (separate pool from FARMER_DELIVERIES —
//     // see PaymentBatchService for why these two farmer domains aren't merged yet)
//     PAYMENT_FARMERS: `${BASE}/branch/payment-farmers`,
//   },

//   USERS: `${BASE}/api/v1/access/users`,

//   // ── Access Control (Roles & Permissions) ───────────────────────────────────
//   // Scoped to the current cooperative; used by the User management feature
//   ACCESS: {
//     ROLES: `${BASE}/api/v1/access/roles`,
//     ROLE_BY_ID: (id: string) => `${BASE}/api/v1/access/roles/${id}`,
//     ROLE_PERMISSIONS: (id: string) => `${BASE}/api/v1/access/roles/${id}/permissions`,
//     USERS: `${BASE}/api/v1/access/users`,
//     USER_BY_ID: (id: string) => `${BASE}/api/v1/access/users/${id}`,
//   },
// } as const;
