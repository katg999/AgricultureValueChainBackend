// ── Auth-level mock data ──────────────────────────────────────────────────────
//
// Dev session user injected when no real JWT is stored in localStorage.
// Matches the cooperative_admin role so the cooperative dashboard loads by default.
// branchId BR-MBL (Mbale West) because most seed delivery data is scoped there.
// ─────────────────────────────────────────────────────────────────────────────

import { AuthUser } from '../models/auth.model';

export const DEV_MOCK_USER: AuthUser = {
  id: 'DEV-COOP-001',
  fullName: 'Demo Cooperative Admin',
  email: 'admin@ugaap.dev',
  phone: '0700000001',
  role: 'cooperative_admin',
  tenantId: 'dev-tenant',
  cooperativeId: 'COOP-001',
  branchId: 'BR-MBL',
  permissions: [],
};
