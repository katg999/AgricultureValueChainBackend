// ─────────────────────────────────────────────────────────────────────────────
// core/constants/api-endpoints.ts
//
// Single source of truth for every backend URL.
// Never write a raw string URL anywhere else in the app — import from here.
//
// Base URL:  /api/v1  (proxied to backend via API-Gateway)
// ─────────────────────────────────────────────────────────────────────────────

//const BASE = 'http://localhost:8083'; // API-Gateway call
const BASE = 'http://192.168.100.20:8083'; // Local gateway — used until remaining services are deployed

const AUTH_BASE = 'https://agriculturevaluechainbackend.onrender.com'; // Deployed AuthenticationService
const MEMBERSHIP_BASE = 'https://agriculturevaluechainbackend-1.onrender.com'; // Deployed MembershipService

export const API_ENDPOINTS = {
  // ── Authentication ──────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: `${AUTH_BASE}/auth/login`,
    LOGOUT: `${AUTH_BASE}/auth/logout`,
    VERIFY_OTP: `${AUTH_BASE}/auth/login/verify-otp`,
    VERIFY_PASSWORD_RESET_OTP: `${AUTH_BASE}/auth/password-reset/verify-otp`,
    REFRESH_TOKEN: `${AUTH_BASE}/auth/refresh-token`,
    FORGOT_PASSWORD: `${AUTH_BASE}/auth/password-reset/request`,
    RESET_PASSWORD: `${AUTH_BASE}/auth/password-reset/set-password`,
    RESEND_OTP: `${AUTH_BASE}/auth/resend-otp`,
  },

  // ── Platform Admin ──────────────────────────────────────────────────────────
  PLATFORM: {
    COOPERATIVES: `${MEMBERSHIP_BASE}/api/v1/cooperatives`,
    COOPERATIVE_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/cooperatives/${id}`,
    ACTIVATE_COOPERATIVE: (id: string) => `${MEMBERSHIP_BASE}/api/v1/cooperatives/${id}/activate`,
    DEACTIVATE_COOPERATIVE: (id: string) =>
      `${MEMBERSHIP_BASE}/api/v1/cooperatives/${id}/deactivate`,
  },

  // ── Cooperative Admin ───────────────────────────────────────────────────────
  COOPERATIVE: {
    DASHBOARD: `${MEMBERSHIP_BASE}/api/v1/cooperatives/dashboard`,
    GRADING: `${BASE}/api/v1/grades`, // ConfigurationService — not yet deployed
    PRICING: `${MEMBERSHIP_BASE}/api/v1/cooperatives/pricing`,

    FARMERS: `${MEMBERSHIP_BASE}/api/v1/farmers/search`,
    FARMER_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/farmers/${id}`,
    FARMER_APPROVE: (id: string) => `${MEMBERSHIP_BASE}/api/v1/farmers/${id}/approve`,
    FARMER_REJECT: (id: string) => `${MEMBERSHIP_BASE}/api/v1/farmers/${id}/reject`,

    ALL: `${MEMBERSHIP_BASE}/api/v1/cooperatives`,

    BRANCHES: `${MEMBERSHIP_BASE}/api/v1/cooperatives/branches`,
    BRANCH_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/cooperatives/branches/${id}`,

    COLLECTIONS: `${MEMBERSHIP_BASE}/cooperative/collections`,

    SESSION_CONFIG: `${MEMBERSHIP_BASE}/cooperative/session-config`,
    SEASON_CONFIG: `${MEMBERSHIP_BASE}/cooperative/season-config`,

    PAYMENT_BATCHES: `${BASE}/api/v1/settlements/batches`, // not yet deployed
    PAYMENT_FARMERS: `${BASE}/api/v1/settlements/farmers`, // not yet deployed

    INVENTORY: `${BASE}/api/v1/inventory`, // InventoryService — not yet deployed
    USERS: `${MEMBERSHIP_BASE}/api/v1/access/users`,
    USER_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/access/users/${id}`,

    AGENTS: `${MEMBERSHIP_BASE}/api/v1/cooperatives/agents`,
    AGENT_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/cooperatives/agents/${id}`,
    AGENT_DEACTIVATE: (id: string) =>
      `${MEMBERSHIP_BASE}/api/v1/cooperatives/agents/${id}/deactivate`,
    AGENT_ACTIVATE: (id: string) => `${MEMBERSHIP_BASE}/api/v1/cooperatives/agents/${id}/activate`,

    COLLECTION_HUBS: `${MEMBERSHIP_BASE}/cooperative/collection-hubs`,
    COLLECTION_HUB_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/cooperative/collection-hubs/${id}`,
    COLLECTION_HUB_ACTIVATE: (id: string) =>
      `${MEMBERSHIP_BASE}/cooperative/collection-hubs/${id}/activate`,
    COLLECTION_HUB_DEACTIVATE: (id: string) =>
      `${MEMBERSHIP_BASE}/cooperative/collection-hubs/${id}/deactivate`,
  },

  BRANCHES: {
    CREATE: `${MEMBERSHIP_BASE}/api/v1/branches`,
    LIST: (tenantId: string) => `${MEMBERSHIP_BASE}/api/v1/branches?tenantId=${tenantId}`,
    BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/branches/${id}`,
  },

  MEMBERS: {
    REGISTER: `${MEMBERSHIP_BASE}/api/v1/members`,
    BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/members/${id}`,
    LIST: (tenantId: string, branchId?: string) =>
      branchId
        ? `${MEMBERSHIP_BASE}/api/v1/members?tenantId=${tenantId}&branchId=${branchId}`
        : `${MEMBERSHIP_BASE}/api/v1/members?tenantId=${tenantId}`,
  },

  BRANCH: {
    DASHBOARD: `${MEMBERSHIP_BASE}/api/v1/branches/dashboard`,
    DAILY_GRADING: `${MEMBERSHIP_BASE}/api/v1/branches/daily-grading`,

    COLLECTIONS: `${MEMBERSHIP_BASE}/branch/collections`,

    FARMER_DELIVERIES: `${MEMBERSHIP_BASE}/branch/farmer-deliveries`,
    FARMER_DELIVERY_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/branch/farmer-deliveries/${id}`,
    FARMER_DELIVERIES_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/branch/farmer-deliveries/${id}`,

    FARMERS: `${MEMBERSHIP_BASE}/api/v1/farmers/search`,
    FARMER_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/farmers/${id}`,

    INVENTORY: `${BASE}/api/v1/inventory/branch`, // not yet deployed

    BATCHES: `${BASE}/api/v1/settlements/batch-recover`, // not yet deployed
    BATCH_BY_ID: (id: string) => `${BASE}/api/v1/settlements/${id}`, // not yet deployed
    PAYMENT_FARMERS: `${BASE}/api/v1/settlements/farmers`, // not yet deployed
  },

  USERS: `${MEMBERSHIP_BASE}/api/v1/access/users`,

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

  CONFIGURATION: {
    GRADES: `${BASE}/api/v1/grades`, // not yet deployed
    GRADE_BY_ID: (id: string) => `${BASE}/api/v1/grades/${id}`,

    COMMODITIES: `${BASE}/api/v1/commodities`,
    COMMODITY_BY_ID: (id: string) => `${BASE}/api/v1/commodities/${id}`,

    PRICE_FLAT: `${BASE}/api/v1/prices/flat`,
    PRICE_GRADE: `${BASE}/api/v1/prices/grade`,
    PRICES_ALL: `${BASE}/api/v1/prices`,
    PRICES_BY_BRANCH: (branchName: string) =>
      `${BASE}/api/v1/prices/branch/${encodeURIComponent(branchName)}`,
    PRICES_BY_COMMODITY: (commodityId: string) => `${BASE}/api/v1/prices/commodity/${commodityId}`,
  },

  ACCESS: {
    ROLES: `${MEMBERSHIP_BASE}/api/v1/access/roles`,
    ROLE_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/access/roles/${id}`,
    USERS: `${MEMBERSHIP_BASE}/api/v1/access/users`,
    USER_BY_ID: (id: string) => `${MEMBERSHIP_BASE}/api/v1/access/users/${id}`,
  },
} as const;
