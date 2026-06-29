// core/constants/permissions.ts
//
// SINGLE SOURCE OF TRUTH for every permission in the system.
//
// The whole app is permission-based:
//   • The role form renders this catalog as service tabs (Farmers, Inventory, …)
//     so an admin can grant granular actions per service.
//   • The sidebar only shows nav items the user holds at least one permission
//     for (see PermissionsService.filterNav).
//   • Route guards and the *hasPermission directive check the same ids.
//
// Permission id convention:  <service>.<action>          e.g. "farmers.approve"
// Sub-areas nest one level:  <service>.<area>.<action>   e.g. "reports.payments.view"
// A nav item tagged with permissionModule: 'farmers' is visible when the user
// holds ANY "farmers.*" permission.
//
// Icons are key strings resolved to SVGs inside permission-tabs.component.html
// (same convention the sidebar uses) — no emoji, no image assets.
//
// Adding a new service:
//   1. Add a PermissionService block to PERMISSION_CATALOG below.
//   2. Tag the matching NavItem in dashboard-config.service.ts with
//      permissionModule (and per-child `permissions` for submenus).
//   3. Routes opt in via data: { permissions: [...] } + permissionGuard.
//   4. If the icon key is new, add a matching @case to the icon template in
//      permission-tabs.component.html.

// ── Types ─────────────────────────────────────────────────────────────────────

/** Which area(s) of the app a service belongs to — used to scope the role form */
export type PermissionScope = 'platform' | 'cooperative' | 'branch';

export interface PermissionDef {
  /** Unique id, "<service>.<action>" or "<service>.<area>.<action>" */
  id: string;
  /** Short label shown next to the checkbox */
  label: string;
  /** One-line explanation of what the permission unlocks */
  description?: string;
}

export interface PermissionService {
  /** Module key — the prefix of every permission id in this service */
  key: string;
  /** Display name shown on the tab */
  name: string;
  /** Icon key resolved to an SVG in permission-tabs.component.html */
  icon: string;
  /** Which role forms show this service */
  scopes: PermissionScope[];
  /** Everything a user can do under this service */
  permissions: PermissionDef[];
}

// ── Catalog ───────────────────────────────────────────────────────────────────

export const PERMISSION_CATALOG: PermissionService[] = [

  {
    key: 'dashboard', name: 'Dashboard', icon: 'dashboard',
    scopes: ['platform', 'cooperative', 'branch'],
    permissions: [
      { id: 'dashboard.view',    label: 'View dashboard',        description: 'See the landing dashboard with KPI cards' },
      { id: 'dashboard.metrics', label: 'View detailed metrics', description: 'Drill into charts and trend breakdowns' },
    ],
  },

  {
    key: 'organisation', name: 'Organisation Setup', icon: 'building',
    scopes: ['cooperative'],
    permissions: [
      { id: 'organisation.view',    label: 'View organisation',         description: 'Open the organisation setup section' },
      { id: 'organisation.create',  label: 'Onboard organisation',      description: 'Start the onboarding wizard' },
      { id: 'organisation.edit',    label: 'Edit organisation details', description: 'Change registration and contact details' },
      { id: 'organisation.submit',  label: 'Submit for approval',       description: 'Send changes into the maker-checker queue' },
      { id: 'organisation.approve', label: 'Approve changes',           description: 'Checker approval of submitted changes' },
      { id: 'organisation.reject',  label: 'Reject changes',            description: 'Checker rejection of submitted changes' },
    ],
  },

  {
    key: 'configuration', name: 'Configuration', icon: 'settings',
    scopes: ['cooperative'],
    permissions: [
      { id: 'configuration.view',          label: 'View configuration', description: 'Open the configuration hub' },
      { id: 'configuration.grades.view',   label: 'View grade config',  description: 'See grading rules and grade lists' },
      { id: 'configuration.grades.create', label: 'Create grades',      description: 'Add new produce grades' },
      { id: 'configuration.grades.edit',   label: 'Edit grades',        description: 'Modify existing grading rules' },
      { id: 'configuration.grades.delete', label: 'Delete grades',      description: 'Remove produce grades' },
      { id: 'configuration.prices.view',            label: 'View prices',                description: 'See current grade/branch price settings' },
      { id: 'configuration.prices.edit',            label: 'Edit prices',                description: 'Update grade/branch produce prices' },
      { id: 'configuration.prices.commodity.view',  label: 'View commodity prices',      description: 'See the cooperative commodity unit price list' },
      { id: 'configuration.prices.commodity.edit',  label: 'Edit commodity prices',      description: 'Set and manage commodity unit prices for farmer deliveries' },
      { id: 'configuration.sessions.view',          label: 'View session hours',         description: 'See configured delivery session windows' },
      { id: 'configuration.sessions.edit',          label: 'Edit session hours',         description: 'Change delivery session start/end times' },
    ],
  },

  {
    key: 'collections', name: 'Collections', icon: 'deliveries',
    scopes: ['cooperative', 'branch'],
    permissions: [
      { id: 'collections.view',    label: 'View deliveries',    description: 'See the delivery / collection list' },
      { id: 'collections.record',  label: 'Record deliveries',  description: 'Capture new produce deliveries' },
      { id: 'collections.edit',    label: 'Edit deliveries',    description: 'Correct recorded deliveries' },
      { id: 'collections.delete',  label: 'Delete deliveries',  description: 'Remove wrongly captured deliveries' },
      { id: 'collections.grade',   label: 'Grade deliveries',   description: 'Assign grades during daily grading' },
      { id: 'collections.approve', label: 'Approve deliveries', description: 'Sign off graded deliveries' },
      { id: 'collections.reject',  label: 'Reject deliveries',  description: 'Send graded deliveries back for review' },
      { id: 'collections.export',  label: 'Export collections', description: 'Download collection data' },
    ],
  },

  {
    key: 'farmers', name: 'Farmers', icon: 'farmers',
    scopes: ['cooperative', 'branch'],
    permissions: [
      { id: 'farmers.view',       label: 'View farmers',       description: 'See the farmer list and profiles' },
      { id: 'farmers.register',   label: 'Register farmers',   description: 'Enroll new farmers' },
      { id: 'farmers.edit',       label: 'Edit farmers',       description: 'Update farmer details' },
      { id: 'farmers.approve',    label: 'Approve farmers',    description: 'Approve pending farmer registrations' },
      { id: 'farmers.reject',     label: 'Reject farmers',     description: 'Reject pending farmer registrations' },
      { id: 'farmers.deactivate', label: 'Deactivate farmers', description: 'Suspend or remove farmers' },
      { id: 'farmers.export',     label: 'Export farmers',     description: 'Download farmer data' },
    ],
  },

  {
    key: 'agents', name: 'Agents', icon: 'agents',
    scopes: ['cooperative'],
    permissions: [
      { id: 'agents.view',       label: 'View agents',       description: 'See the agent list and profiles' },
      { id: 'agents.register',   label: 'Register agents',   description: 'Enroll new field agents' },
      { id: 'agents.edit',       label: 'Edit agents',       description: 'Update agent details and branch assignment' },
      { id: 'agents.deactivate', label: 'Deactivate agents', description: 'Suspend or reactivate agent accounts' },
      { id: 'agents.export',     label: 'Export agents',     description: 'Download agent data' },
    ],
  },

  {
    key: 'collection_hubs', name: 'Collection Hubs', icon: 'hub',
    scopes: ['cooperative'],
    permissions: [
      { id: 'collection_hubs.view',       label: 'View hubs',        description: 'See the collection hub list and details' },
      { id: 'collection_hubs.create',     label: 'Create hubs',      description: 'Register new collection hubs' },
      { id: 'collection_hubs.edit',       label: 'Edit hubs',        description: 'Update hub details, capacity and commodities' },
      { id: 'collection_hubs.deactivate', label: 'Deactivate hubs',  description: 'Suspend or reactivate collection hubs' },
      { id: 'collection_hubs.delete',     label: 'Delete hubs',      description: 'Permanently remove collection hubs' },
      { id: 'collection_hubs.export',     label: 'Export hub data',  description: 'Download collection hub records' },
    ],
  },

  {
    key: 'branches', name: 'Branches', icon: 'branches',
    scopes: ['cooperative'],
    permissions: [
      { id: 'branches.view',        label: 'View branches',           description: 'See the branch list' },
      { id: 'branches.create',      label: 'Create branches',         description: 'Onboard new branches' },
      { id: 'branches.edit',        label: 'Edit branches',           description: 'Update branch details' },
      { id: 'branches.deactivate',  label: 'Deactivate branches',     description: 'Close or suspend branches' },
      { id: 'branches.performance', label: 'View branch performance', description: 'Open per-branch dashboards and stats' },
    ],
  },

  {
    key: 'inventory', name: 'Inventory', icon: 'inventory',
    scopes: ['cooperative', 'branch'],
    permissions: [
      { id: 'inventory.view',     label: 'View current stock',   description: 'See stock levels' },
      { id: 'inventory.receive',  label: 'Receive stock',        description: 'Record incoming stock' },
      { id: 'inventory.issue',    label: 'Issue stock',          description: 'Issue stock to branches or staff' },
      { id: 'inventory.request',  label: 'Request stock',        description: 'Raise stock requests to the cooperative' },
      { id: 'inventory.disburse', label: 'View disbursed stock', description: 'See the stock-disbursed register' },
      { id: 'inventory.transfer', label: 'Transfer stock',       description: 'Move stock between locations' },
      { id: 'inventory.adjust',   label: 'Adjust stock',         description: 'Correct stock counts' },
      { id: 'inventory.export',   label: 'Export inventory',     description: 'Download inventory data' },
    ],
  },

  {
    key: 'finance', name: 'Finance', icon: 'finance',
    scopes: ['cooperative', 'branch'],
    permissions: [
      { id: 'finance.view',            label: 'View payment batches',    description: 'See batch processing and batch farmer lists' },
      { id: 'finance.batches.create',  label: 'Create payment batches',  description: 'Assemble farmer payments into a batch' },
      { id: 'finance.batches.edit',    label: 'Edit payment batches',    description: 'Adjust batches before submission' },
      { id: 'finance.batches.approve', label: 'Approve payment batches', description: 'Sign off batches for processing' },
      { id: 'finance.batches.process', label: 'Process payments',        description: 'Execute approved payment batches' },
      { id: 'finance.export',          label: 'Export finance data',     description: 'Download batch and payment data' },
    ],
  },

  {
    key: 'users', name: 'User Management', icon: 'users',
    scopes: ['platform', 'cooperative'],
    permissions: [
      { id: 'users.view',           label: 'View users',       description: 'See the user list' },
      { id: 'users.create',         label: 'Create users',     description: 'Invite or add users' },
      { id: 'users.edit',           label: 'Edit users',       description: 'Update user details and assignments' },
      { id: 'users.deactivate',     label: 'Deactivate users', description: 'Suspend or remove user accounts' },
      { id: 'users.reset_password', label: 'Reset passwords',  description: 'Trigger password resets for users' },
    ],
  },

  {
    key: 'roles', name: 'Roles & Permissions', icon: 'roles',
    scopes: ['platform', 'cooperative'],
    permissions: [
      { id: 'roles.view',   label: 'View roles',            description: 'See the roles list' },
      { id: 'roles.create', label: 'Create roles',          description: 'Define new roles' },
      { id: 'roles.edit',   label: 'Edit roles',            description: 'Change role details and permissions' },
      { id: 'roles.delete', label: 'Delete roles',          description: 'Remove unused roles' },
      { id: 'roles.assign', label: 'Assign roles to users', description: 'Attach or detach roles on user accounts' },
    ],
  },

  // Reports are split by report type so a role can be limited to only the
  // reports it needs — e.g. an accountant sees Payments but not Members.
  // Each type carries its own view + export pair; the section itself,
  // scheduled exports and the custom builder are separate grants.
  {
    key: 'reports', name: 'Reports', icon: 'reports',
    scopes: ['platform', 'cooperative'],
    permissions: [
      { id: 'reports.view',             label: 'Open reports section',      description: 'Access the reports area; specific report types are granted below' },

      { id: 'reports.deliveries.view',   label: 'View delivery reports',    description: 'Delivery volumes, trends and per-branch breakdowns' },
      { id: 'reports.deliveries.export', label: 'Export delivery reports',  description: 'Download delivery reports as Excel / PDF / CSV' },

      { id: 'reports.grading.view',      label: 'View grading reports',     description: 'Grade distribution, rejection rates and quality scores' },
      { id: 'reports.grading.export',    label: 'Export grading reports',   description: 'Download grading reports as Excel / PDF / CSV' },

      { id: 'reports.payments.view',     label: 'View payment reports',     description: 'Payout totals, outstanding balances and payment status' },
      { id: 'reports.payments.export',   label: 'Export payment reports',   description: 'Download payment reports as Excel / PDF / CSV' },

      { id: 'reports.members.view',      label: 'View member reports',      description: 'Farmer activity, registrations and delivery history' },
      { id: 'reports.members.export',    label: 'Export member reports',    description: 'Download member reports as Excel / PDF / CSV' },

      { id: 'reports.custom.view',       label: 'View custom reports',      description: 'Open reports built with the custom report builder' },
      { id: 'reports.custom.create',     label: 'Build custom reports',     description: 'Compose new reports in the custom report builder' },
      { id: 'reports.custom.export',     label: 'Export custom reports',    description: 'Download custom reports as Excel / PDF / CSV' },
    ],
  },

  {
    key: 'cooperatives', name: 'Cooperatives', icon: 'building',
    scopes: ['platform'],
    permissions: [
      { id: 'cooperatives.view',    label: 'View cooperatives',    description: 'See all cooperatives on the platform' },
      { id: 'cooperatives.onboard', label: 'Onboard cooperatives', description: 'Run the cooperative onboarding wizard' },
      { id: 'cooperatives.edit',    label: 'Edit cooperatives',    description: 'Update cooperative details' },
      { id: 'cooperatives.approve', label: 'Approve cooperatives', description: 'Checker approval of new cooperatives' },
      { id: 'cooperatives.reject',  label: 'Reject cooperatives',  description: 'Checker rejection of new cooperatives' },
      { id: 'cooperatives.suspend', label: 'Suspend cooperatives', description: 'Suspend or deactivate a cooperative' },
    ],
  },

  {
    key: 'settings', name: 'System Settings', icon: 'settings',
    scopes: ['platform'],
    permissions: [
      { id: 'settings.view', label: 'View settings', description: 'See platform-wide configuration' },
      { id: 'settings.edit', label: 'Edit settings', description: 'Change platform-wide configuration' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wildcard — a user holding this permission can do everything */
export const ALL_PERMISSIONS_WILDCARD = '*';

/** Services visible in a given role-form scope */
export function catalogForScope(scope: PermissionScope): PermissionService[] {
  return PERMISSION_CATALOG.filter(s => s.scopes.includes(scope));
}

/** Flat list of every permission id in the system */
export function allPermissionIds(): string[] {
  return PERMISSION_CATALOG.flatMap(s => s.permissions.map(p => p.id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKEND WIRE FORMAT — MODULE:ACTION constants
//
// The constants below mirror the Java enum in shared/security/Permission.java
// exactly, so permission strings carried in the backend JWT drop straight in
// without translation. They are consumed by PermissionsService and the
// *hasPermission directive.
//
// Relationship to the catalog above: the catalog ids (e.g. "farmers.approve")
// are the granular, UI-facing breakdown; each maps onto one of these coarser
// MODULE:ACTION pairs when talking to the backend (see the role form's
// toBackendPermissions()). Once the backend stores granular ids natively the
// two layers collapse into one.
// ═══════════════════════════════════════════════════════════════════════════════

export const PERMISSIONS = {

  // ── MEMBERSHIP — users, farmers, cooperative members, branch members ─────────
  MEMBERSHIP_VIEW:    'MEMBERSHIP:VIEW',
  MEMBERSHIP_CREATE:  'MEMBERSHIP:CREATE',
  MEMBERSHIP_EDIT:    'MEMBERSHIP:EDIT',
  MEMBERSHIP_APPROVE: 'MEMBERSHIP:APPROVE',
  MEMBERSHIP_DELETE:  'MEMBERSHIP:DELETE',

  // ── BRANCHES — creating, editing, and deactivating branch offices ────────────
  BRANCHES_VIEW:    'BRANCHES:VIEW',
  BRANCHES_CREATE:  'BRANCHES:CREATE',
  BRANCHES_EDIT:    'BRANCHES:EDIT',
  BRANCHES_APPROVE: 'BRANCHES:APPROVE',
  BRANCHES_DELETE:  'BRANCHES:DELETE',

  // ── INVENTORY — stock levels, disbursements, issue stock, grading, pricing ───
  INVENTORY_VIEW:    'INVENTORY:VIEW',
  INVENTORY_CREATE:  'INVENTORY:CREATE',
  INVENTORY_EDIT:    'INVENTORY:EDIT',
  INVENTORY_APPROVE: 'INVENTORY:APPROVE',
  INVENTORY_DELETE:  'INVENTORY:DELETE',

  // ── REPORTING — viewing, exporting, and scheduling reports ───────────────────
  REPORTING_VIEW:    'REPORTING:VIEW',
  REPORTING_CREATE:  'REPORTING:CREATE',
  REPORTING_EDIT:    'REPORTING:EDIT',
  REPORTING_APPROVE: 'REPORTING:APPROVE',
  REPORTING_DELETE:  'REPORTING:DELETE',

  // ── ACCESS MANAGEMENT — roles, permission assignment, user access ────────────
  ACCESS_MANAGEMENT_VIEW:    'ACCESS_MANAGEMENT:VIEW',
  ACCESS_MANAGEMENT_CREATE:  'ACCESS_MANAGEMENT:CREATE',
  ACCESS_MANAGEMENT_EDIT:    'ACCESS_MANAGEMENT:EDIT',
  ACCESS_MANAGEMENT_APPROVE: 'ACCESS_MANAGEMENT:APPROVE',
  ACCESS_MANAGEMENT_DELETE:  'ACCESS_MANAGEMENT:DELETE',

} as const;

/** Strongly-typed union of every valid backend permission string */
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ── Role name constants ───────────────────────────────────────────────────────
// Full names match the backend Role.name field stored in the database.
// Short aliases match the role strings used in the frontend (session, routes).

export const ROLES = {
  // Full backend role names (come back in the JWT `roles` claim)
  PLATFORM_ADMIN:    'PLATFORM_ADMIN',
  COOPERATIVE_ADMIN: 'COOPERATIVE_ADMIN',
  BRANCH_MANAGER:    'BRANCH_MANAGER',
  FIELD_AGENT:       'FIELD_AGENT',

  // Short aliases used in frontend route guards and the dev mock user
  PLATFORM:          'platform',
  COOPERATIVE:       'cooperative',
  BRANCH:            'branch',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
