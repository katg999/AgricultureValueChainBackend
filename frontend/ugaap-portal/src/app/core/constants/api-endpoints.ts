// ─────────────────────────────────────────────────────────────────────────────
// core/constants/api-endpoints.ts
//
// Single source of truth for every backend URL.
// Never write a raw string URL anywhere else in the app — import from here.
//
// Base URL:  /api/v1  (proxied to backend via API-Gateway)
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8083'; // API-Gateway
//const BASE = 'http://192.168.100.20:8083'; // use this when accessing from another machine on the network

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

  // ── Inventory Service — /api/v1/inventory/** via API Gateway ────────────────
  INVENTORY_BACKEND: {
    // Stock items (InventoryItemController)
    ITEMS:              `${BASE}/api/v1/inventory/items`,
    ITEM_BY_ID:         (id: string) => `${BASE}/api/v1/inventory/items/${id}`,
    ITEM_STOCK:         (id: string) => `${BASE}/api/v1/inventory/items/${id}/stock`,
    LOW_STOCK:          `${BASE}/api/v1/inventory/items/low-stock`,

    // Input credit loans (InputCreditController)
    CREDITS:            `${BASE}/api/v1/inventory/credits`,
    CREDITS_ISSUE:      `${BASE}/api/v1/inventory/credits/issue`,
    CREDIT_BY_ID:       (id: string) => `${BASE}/api/v1/inventory/credits/${id}`,
    CREDITS_BY_FARMER:  (farmerId: string) => `${BASE}/api/v1/inventory/credits/farmer/${farmerId}`,
    CREDIT_STATUS:      (loanId: string) => `${BASE}/api/v1/inventory/credits/${loanId}/status`,

    // Repayments & deductions (DeductionController)
    BATCH_DEDUCTION:    `${BASE}/api/v1/inventory/deductions/batch`,
    FINANCE_BATCH:      `${BASE}/api/v1/inventory/deductions/finance-batch`,
    MANUAL_REPAYMENT:   `${BASE}/api/v1/inventory/deductions/manual`,
    FARMER_SUMMARY:     (farmerId: string) => `${BASE}/api/v1/inventory/deductions/farmer/${farmerId}/summary`,
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

