// ─────────────────────────────────────────────────────────────────────────────
// core/constants/api-endpoints.ts
//
// Single source of truth for every backend URL.
// Never write a raw string URL anywhere else in the app — import from here.
//
// Base URL:  /api/v1  (proxied to backend in proxy.conf.json)
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8083'; //API-Gateway call


export const API_ENDPOINTS = {
  // ── Authentication ──────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: `${BASE}/auth/login`,
    LOGOUT: `${BASE}/auth/logout`,
    VERIFY_OTP: `${BASE}/auth/verify-otp`,
    REFRESH_TOKEN: `${BASE}/auth/refresh-token`,
    FORGOT_PASSWORD: `${BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE}/auth/reset-password`,
    RESEND_OTP: `${BASE}/auth/resend-otp`,
  },

  // ── Platform Admin ──────────────────────────────────────────────────────────
  // Manages all cooperatives on the platform
  PLATFORM: {
    COOPERATIVES: `${BASE}/api/v1/cooperatives`,
    COOPERATIVE_BY_ID: (id: string) => `${BASE}/platform/cooperatives/${id}`,
    ACTIVATE_COOPERATIVE: (id: string) => `${BASE}/platform/cooperatives/${id}/activate`,
    DEACTIVATE_COOPERATIVE: (id: string) => `${BASE}/platform/cooperatives/${id}/deactivate`,
  },

  // ── Cooperative Admin ───────────────────────────────────────────────────────
  // Scoped to a single cooperative (X-Cooperative-ID header set by interceptor)
  COOPERATIVE: {
    DASHBOARD: `${BASE}/cooperative/dashboard`,
    GRADING: `${BASE}/cooperative/grading`,
    PRICING: `${BASE}/cooperative/pricing`,

    // Farmers
    FARMERS: `${BASE}/cooperative/farmers`,
    FARMER_BY_ID: (id: string) => `${BASE}/cooperative/farmers/${id}`,
    FARMER_APPROVE: (id: string) => `${BASE}/cooperative/farmers/${id}/approve`,
    FARMER_REJECT: (id: string) => `${BASE}/cooperative/farmers/${id}/reject`,

    // Cooperatives & Branches (for management interface)
    ALL: `${BASE}/cooperatives`,

    // Cooperatives & Branches (for management interface)
    ALL:              `${BASE}/cooperatives`,

    // Branches
    BRANCHES: `${BASE}/cooperative/branches`,
    BRANCH_BY_ID: (id: string) => `${BASE}/cooperative/branches/${id}`,

    // Inventory & Users
    INVENTORY: `${BASE}/cooperative/inventory`,
    USERS: `${BASE}/cooperative/users`,
    USER_BY_ID: (id: string) => `${BASE}/cooperative/users/${id}`,
  },

  // ── Branch Staff ────────────────────────────────────────────────────────────
  // Scoped to a single branch (X-Branch-ID header set by interceptor)
  BRANCH: {
    DASHBOARD: `${BASE}/branch/dashboard`,
    DAILY_GRADING: `${BASE}/branch/daily-grading`,

    // Collections / Deliveries
    COLLECTIONS: `${BASE}/branch/collections`,
    COLLECTION_BY_ID: (id: string) => `${BASE}/branch/collections/${id}`,

    // Farmers registered at this branch
    FARMERS: `${BASE}/branch/farmers`,
    FARMER_BY_ID: (id: string) => `${BASE}/branch/farmers/${id}`,

    // Inventory at this branch
    INVENTORY: `${BASE}/branch/inventory`,
  },

  // ── Access Control (Roles & Permissions) ───────────────────────────────────
  // Scoped to the current cooperative; used by the User management feature
  ACCESS: {
    ROLES: `${BASE}/access/roles`,
    ROLE_BY_ID: (id: string) => `${BASE}/access/roles/${id}`,
    ROLE_PERMISSIONS: (id: string) => `${BASE}/access/roles/${id}/permissions`,
    USERS: `${BASE}/access/users`,
    USER_BY_ID: (id: string) => `${BASE}/access/users/${id}`,
  },
} as const;
