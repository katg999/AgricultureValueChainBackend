// ─────────────────────────────────────────────────────────────────────────────
// core/constants/api-endpoints.ts
//
// Single source of truth for every backend URL.
// Never write a raw string URL anywhere else in the app — import from here.
//
// Base URL:  /api/v1  (proxied to backend via API-Gateway)
// ─────────────────────────────────────────────────────────────────────────────

//const BASE = 'http://localhost:8083'; // API-Gateway call
const BASE = 'http://192.168.100.20:8083';

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

  // ── Platform Admin ──────────────────────────────────────────────────────────
  PLATFORM: {
    COOPERATIVES: `${BASE}/api/v1/cooperatives`,
    COOPERATIVE_BY_ID: (id: string) => `${BASE}/api/v1/cooperatives/${id}`,
    ACTIVATE_COOPERATIVE: (id: string) => `${BASE}/api/v1/cooperatives/${id}/activate`,
    DEACTIVATE_COOPERATIVE: (id: string) => `${BASE}/api/v1/cooperatives/${id}/deactivate`,
    USERS: `${BASE}/api/v1/platform/users`,
    USER_BY_ID: (id: string) => `${BASE}/api/v1/platform/users/${id}`,
    USER_LOGIN_HISTORY: (id: string) => `${BASE}/api/v1/platform/users/${id}/login-history`,
  },

  // ── Cooperative Admin ───────────────────────────────────────────────────────
  COOPERATIVE: {
    DASHBOARD: `${BASE}/api/v1/cooperatives/dashboard`,
    PROFILE: `${BASE}/api/v1/cooperatives/profile`,
    BANK_ACCOUNTS: `${BASE}/api/v1/cooperatives/bank-accounts`,
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
    // Planned gateway route for coop→branch stock issuance — backend has no branch-issues
    // endpoint yet; POST /api/allocations/issue requires a farmerId, so this stays mocked
    // until the backend accepts branch-only issues.
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

    // Branch stock requests (Prepared for INVENTORY-SERVICE)
    // Planned gateway route — no backend equivalent exists yet, unlike stock/allocations
    // which already have real endpoints under INVENTORY_BACKEND.
    STOCK_REQUESTS: `${BASE}/api/v1/inventory/branch`,

    // Inter-Service Settlements Synchronizer (SettlementController)
    BATCHES: `${BASE}/api/v1/settlements/batch-recover`,
    BATCH_BY_ID: (id: string) => `${BASE}/api/v1/settlements/${id}`,
    PAYMENT_FARMERS: `${BASE}/api/v1/settlements/farmers`,

    // Farmer disbursement transactions (SettlementController)
    PAYOUTS: `${BASE}/api/v1/settlements/payouts`,
    PAYOUT_BY_ID: (id: string) => `${BASE}/api/v1/settlements/payouts/${id}`,
    PAYOUTS_PENDING: (batchId: string) =>
      `${BASE}/api/v1/settlements/payouts/pending?batchId=${batchId}`,
  },

  USERS: `${BASE}/api/v1/access/users`,

  // ── Inventory Service — real backend paths ──────────────────────────────────
  // The COOPERATIVE.INVENTORY and BRANCH.STOCK_REQUESTS constants above are planned
  // gateway routes with no backend behind them yet (see comments there for what each
  // is actually for). These paths below are where the InventoryService microservice
  // actually listens today; the frontend calls them directly until gateway routing
  // is set up.
  INVENTORY_BACKEND: {
    STOCK_ALL: `${BASE}/api/input-stock/all`, // GET ?cooperativeId=X or ?branchId=X
    STOCK_CREATE: `${BASE}/api/input-stock`, // POST — add new stock
    ALLOCATION_ISSUE: `${BASE}/api/allocations/issue`,
    ALLOCATIONS_BY_BRANCH: (branchId: string) => `${BASE}/api/allocations/branch/${branchId}`,
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

