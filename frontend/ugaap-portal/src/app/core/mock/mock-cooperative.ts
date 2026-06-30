// ── Cooperative-level mock data ───────────────────────────────────────────────
//
// Covers: cooperatives, roles, pricing config, season config, delivery session
// config, grade config, reports, cooperative-wide payment batch records, and
// cooperative dashboard KPIs / branch performance / payment breakdown.
// ─────────────────────────────────────────────────────────────────────────────

import { SeasonWindow } from '../models/season-config.model';
import { DeliverySessionWindow } from '../models/delivery-session.model';
import { BatchRecord } from '../../features/cooperative/finance/batch-record.model';
import { FlatPriceEntry, GradePriceEntry } from '../models/pricing.model';

// ── Cooperative dashboard ─────────────────────────────────────────────────────

export interface BranchPerformanceRow {
  branchName:  string;
  deliveries:  number;
  outstanding: string;
  status:      'healthy' | 'action-required' | 'new';
}

export interface PaymentBreakdownRow {
  status: string;
  amount: string;
  flex:   number;
  color:  string;
}

export const MOCK_COOP_NAME    = 'Bugishu Cooperative Union';
export const MOCK_COOP_SEASON  = '2026 Main Season active';
export const MOCK_TOTAL_VOLUME = 'UGX 120,000,000';

// Shapes mirror StatCardData from shared/components/stat-card
export const MOCK_COOP_STATS = [
  {
    label: 'Active agents', value: '3,200', icon: 'users',
    trend: '+12% from last season', trendUp: true,
    thresholds: { warning: 2000, critical: 1000, direction: 'below' as const },
    route: '/cooperative/agents',
  },
  {
    label: 'Total deliveries', value: '540', icon: 'box',
    trend: '+12% from last season', trendUp: true,
    route: '/cooperative/collections',
  },
  {
    label: 'Input Disbursed', value: '450,000,000', icon: 'wallet',
    trend: 'UGX', trendUp: true,
    route: '/cooperative/inventory/stock-disbursed',
  },
  {
    label: 'Outstanding', value: '120,000,000', icon: 'clipboard',
    thresholds: { warning: 50_000_000, critical: 100_000_000, direction: 'above' as const },
    route: '/cooperative/inventory/stock-disbursed',
  },
];

export const MOCK_BRANCH_PERFORMANCE: BranchPerformanceRow[] = [
  { branchName: 'Hoima Central',   deliveries: 215.4, outstanding: '34,500,000', status: 'healthy'         },
  { branchName: 'Masindi West',    deliveries: 142.8, outstanding: '58,200,000', status: 'action-required' },
  { branchName: 'Kibaale Outpost', deliveries: 98.1,  outstanding: '12,100,000', status: 'healthy'         },
  { branchName: 'Buliisa Branch',  deliveries: 83.7,  outstanding: '15,200,000', status: 'new'             },
];

export const MOCK_PAYMENT_BREAKDOWN: PaymentBreakdownRow[] = [
  { status: 'SETTLED',           amount: 'UGX 66M', flex: 66, color: '#10B981' },
  { status: 'PARTIALLY SETTLED', amount: 'UGX 36M', flex: 36, color: '#F59E0B' },
  { status: 'PENDING',           amount: 'UGX 18M', flex: 18, color: '#D1D5DB' },
];

// Shapes mirror ActivityData from shared/components/activity-item
export const MOCK_COOP_ACTIVITIES = [
  { title: 'Agnes Owino registered',          subtitle: 'Hoima Central',              timestamp: '14 mins ago', action: 'View Profile',    color: '#10B981' },
  { title: 'New delivery from Mbarara',        subtitle: '12.5 MT Robusta',            timestamp: '2 hrs ago',   action: 'BATCH-5510-COF',  actionIcon: '↗', color: '#F59E0B' },
  { title: 'Loan disbursement approved',       subtitle: 'UGX 4.2M to Okello David',  timestamp: '5 hrs ago',   color: '#3B82F6' },
  { title: 'Logistics route updated',          subtitle: 'Masindi to Kampala Central', timestamp: 'Yesterday',   color: '#9CA3AF' },
  { title: 'System Backup Completed',          subtitle: 'Scheduled Maintenance',      timestamp: '2 days ago',  color: '#6B7280' },
];

// ── Cooperatives ──────────────────────────────────────────────────────────────

export const MOCK_COOPERATIVES = [
  {
    id: 'COOP-UG-001',
    name: 'Bugisu Coffee Farmers Cooperative',
    branches: [
      { id: 'BR-MBL', name: 'Mbale Branch',   cooperativeId: 'COOP-UG-001' },
      { id: 'BR-JIN', name: 'Jinja Branch',    cooperativeId: 'COOP-UG-001' },
    ],
  },
  {
    id: 'COOP-UG-002',
    name: 'Banyankole Kweterana',
    branches: [
      { id: 'BR-MBA', name: 'Mbarara Branch',  cooperativeId: 'COOP-UG-002' },
      { id: 'BR-KLA', name: 'Kampala Central', cooperativeId: 'COOP-UG-002' },
    ],
  },
];

// ── System roles ──────────────────────────────────────────────────────────────
// Same 5 roles used by both platform and cooperative role-detail views.

export const MOCK_ROLES = [
  { id: '1', name: 'Platform Admin',    description: 'Full system access with all permissions',           permissionsCount: 48, usersCount: 12, isSystem: true,  createdAt: '2023-01-15' },
  { id: '2', name: 'Cooperative Admin', description: 'Manage cooperative operations and members',         permissionsCount: 32, usersCount: 45, isSystem: true,  createdAt: '2023-01-15' },
  { id: '3', name: 'Logistics Manager', description: 'Manage inventory, shipments, and logistics',        permissionsCount: 24, usersCount: 18, isSystem: false, createdAt: '2023-03-20' },
  { id: '4', name: 'Accountant',        description: 'Financial reporting and transaction management',     permissionsCount: 16, usersCount: 8,  isSystem: false, createdAt: '2023-04-10' },
  { id: '5', name: 'Field Officer',     description: 'On-ground data collection and farmer registration', permissionsCount: 12, usersCount: 67, isSystem: false, createdAt: '2024-02-05' },
];

// ── Cooperative pricing config ─────────────────────────────────────────────────
// Used by CooperativePricingService to seed grade options, flat prices, multipliers.

export const GRADE_OPTIONS = [
  { code: 'A', name: 'Premium'   },
  { code: 'B', name: 'Standard'  },
  { code: 'C', name: 'Low Grade' },
  { code: 'R', name: 'Rejected'  },
];

export const DEFAULT_FLAT_PRICES = [
  { commodity: 'Maize',  pricePerKg: 2_500 },
  { commodity: 'Coffee', pricePerKg: 6_000 },
  { commodity: 'Beans',  pricePerKg: 2_500 },
  { commodity: 'Rice',   pricePerKg: 3_500 },
];

export const GRADE_MULTIPLIERS = [
  { code: 'A', name: 'Premium',   mult: 1.30 },
  { code: 'B', name: 'Standard',  mult: 1.00 },
  { code: 'C', name: 'Low Grade', mult: 0.70 },
  { code: 'R', name: 'Rejected',  mult: 0.00 },
];

export const ALL_BRANCH_IDS: string[] = [
  'BR-KLA', 'BR-JIN', 'BR-MBA', 'BR-FTP',
  'BR-ADJ', 'BR-GUL', 'BR-MBL', 'BR-KIB', 'BR-LIR', 'BR-MBA2',
];

// ── Season configuration ──────────────────────────────────────────────────────

export const DEFAULT_SEASON_WINDOWS: SeasonWindow[] = [
  { type: 'Wet Season', label: 'Wet Season', startMonth: 3, endMonth: 8 },  // Mar–Aug
  { type: 'Dry Season', label: 'Dry Season', startMonth: 9, endMonth: 2 },  // Sep–Feb
];

// ── Delivery session configuration ────────────────────────────────────────────

export const DEFAULT_SESSION_WINDOWS: DeliverySessionWindow[] = [
  { id: 'morning',   label: 'Morning',   startHour: 6,  endHour: 9  },
  { id: 'midday',    label: 'Midday',    startHour: 9,  endHour: 12 },
  { id: 'afternoon', label: 'Afternoon', startHour: 12, endHour: 18 },
];

// ── Grade configuration ───────────────────────────────────────────────────────
// Used as fallback in GradeConfigComponent when the API is unavailable.

export const MOCK_GRADES = [
  { id: '1', name: 'Premium',   code: 'A', description: 'Highest quality, clean, dry, no defects', createdAt: '15 Jan 2024', branchCount: 3 },
  { id: '2', name: 'Standard',  code: 'B', description: 'Good quality with minor defects allowed',  createdAt: '15 Jan 2024', branchCount: 2 },
  { id: '3', name: 'Low Grade', code: 'C', description: 'Below average, moisture content issues',   createdAt: '15 Jan 2024', branchCount: 1 },
  { id: '4', name: 'Rejected',  code: 'R', description: 'Does not meet minimum standards',          createdAt: '15 Jan 2024', branchCount: 0 },
];

export const MOCK_BRANCH_GRADE_SUMMARIES = [
  {
    id: 'b1', name: 'Kasese Main Branch', region: 'Western Region',
    avgPrice: 7350, gradeCount: 2,
    grades: [
      { name: 'Premium',  code: 'A', pricePerKg: 8500 },
      { name: 'Standard', code: 'B', pricePerKg: 6200 },
    ],
  },
  {
    id: 'b2', name: 'Kasese North Branch', region: 'Western Region',
    avgPrice: 7150, gradeCount: 1,
    grades: [
      { name: 'Premium', code: 'A', pricePerKg: 8200 },
    ],
  },
  {
    id: 'b3', name: 'Mbarara Central', region: 'Western Region',
    avgPrice: 7550, gradeCount: 1,
    grades: [
      { name: 'Standard', code: 'B', pricePerKg: 6100 },
    ],
  },
];

// ── Reports — deliveries ──────────────────────────────────────────────────────

export const MOCK_REPORT_DELIVERIES_DATA = [
  { branch: 'Hoima',   farmer: 'Okello John',     date: '2026-05-15', quantity: 12.4, grade: 'A', value: '3,720,000',  status: 'Graded'  },
  { branch: 'Masindi', farmer: 'Mugisha Peter',    date: '2026-05-14', quantity: 8.6,  grade: 'B', value: '2,150,000',  status: 'Paid'    },
  { branch: 'Gulu',    farmer: 'Nakato Sarah',     date: '2026-05-14', quantity: 15.2, grade: 'A', value: '4,560,000',  status: 'Graded'  },
  { branch: 'Lira',    farmer: 'Apio Grace',       date: '2026-05-13', quantity: 7.8,  grade: 'C', value: '1,560,000',  status: 'Pending' },
  { branch: 'Mbale',   farmer: 'Otim Charles',     date: '2026-05-13', quantity: 10.5, grade: 'A', value: '3,150,000',  status: 'Paid'    },
  { branch: 'Hoima',   farmer: 'Lubega James',     date: '2026-05-12', quantity: 14.1, grade: 'B', value: '3,525,000',  status: 'Graded'  },
  { branch: 'Masindi', farmer: 'Namukasa Ruth',    date: '2026-05-12', quantity: 6.3,  grade: 'A', value: '1,890,000',  status: 'Pending' },
  { branch: 'Gulu',    farmer: 'Ogenga Patrick',   date: '2026-05-11', quantity: 19.7, grade: 'A', value: '5,910,000',  status: 'Paid'    },
  { branch: 'Lira',    farmer: 'Kamukama Denis',   date: '2026-05-11', quantity: 9.2,  grade: 'B', value: '2,300,000',  status: 'Graded'  },
  { branch: 'Soroti',  farmer: 'Atukunda Mary',    date: '2026-05-10', quantity: 11.8, grade: 'A', value: '3,540,000',  status: 'Pending' },
];

// ── Reports — grading ─────────────────────────────────────────────────────────

export const MOCK_REPORT_GRADING_DATA = [
  { branch: 'Hoima',   gradeA: 129, gradeB: 56, gradeC: 18, rejected: 12, total: 215, qualityScore: 87 },
  { branch: 'Masindi', gradeA: 64,  gradeB: 48, gradeC: 21, rejected: 9,  total: 142, qualityScore: 82 },
  { branch: 'Gulu',    gradeA: 44,  gradeB: 32, gradeC: 14, rejected: 8,  total: 98,  qualityScore: 78 },
  { branch: 'Lira',    gradeA: 39,  gradeB: 28, gradeC: 12, rejected: 8,  total: 87,  qualityScore: 75 },
  { branch: 'Mbale',   gradeA: 34,  gradeB: 24, gradeC: 10, rejected: 8,  total: 76,  qualityScore: 73 },
  { branch: 'Soroti',  gradeA: 28,  gradeB: 20, gradeC: 9,  rejected: 7,  total: 64,  qualityScore: 70 },
];

// ── Reports — payments ────────────────────────────────────────────────────────

export const MOCK_REPORT_PAYMENTS_DATA = [
  { farmer: 'Okello John',     branch: 'Hoima',   delivered: 24.5, value: '7,350,000',  paid: '7,350,000',  outstanding: '0',          status: 'Settled' },
  { farmer: 'Mugisha Peter',   branch: 'Masindi', delivered: 21.3, value: '5,325,000',  paid: '3,000,000',  outstanding: '2,325,000',  status: 'Partial' },
  { farmer: 'Nakato Sarah',    branch: 'Gulu',    delivered: 18.7, value: '5,610,000',  paid: '5,610,000',  outstanding: '0',          status: 'Settled' },
  { farmer: 'Apio Grace',      branch: 'Lira',    delivered: 16.2, value: '3,240,000',  paid: '0',          outstanding: '3,240,000',  status: 'Pending' },
  { farmer: 'Otim Charles',    branch: 'Mbale',   delivered: 14.8, value: '4,440,000',  paid: '4,440,000',  outstanding: '0',          status: 'Settled' },
  { farmer: 'Lubega James',    branch: 'Hoima',   delivered: 13.6, value: '3,400,000',  paid: '2,000,000',  outstanding: '1,400,000',  status: 'Partial' },
  { farmer: 'Ogenga Patrick',  branch: 'Gulu',    delivered: 11.2, value: '3,360,000',  paid: '0',          outstanding: '3,360,000',  status: 'Overdue' },
  { farmer: 'Kamukama Denis',  branch: 'Soroti',  delivered: 9.8,  value: '2,940,000',  paid: '2,940,000',  outstanding: '0',          status: 'Settled' },
];

// ── Reports — members ─────────────────────────────────────────────────────────

export const MOCK_REPORT_MEMBERS_DATA = [
  { name: 'Okello John',    branch: 'Hoima',   registered: '2023-03-15', deliveries: 8, totalValue: '24,000,000', lastActive: '2026-05-15', status: 'Active'   },
  { name: 'Mugisha Peter',  branch: 'Masindi', registered: '2022-11-20', deliveries: 6, totalValue: '15,000,000', lastActive: '2026-05-14', status: 'Active'   },
  { name: 'Nakato Sarah',   branch: 'Gulu',    registered: '2023-06-10', deliveries: 5, totalValue: '18,000,000', lastActive: '2026-05-14', status: 'Active'   },
  { name: 'Apio Grace',     branch: 'Lira',    registered: '2024-01-05', deliveries: 3, totalValue: '9,000,000',  lastActive: '2026-04-20', status: 'Inactive' },
  { name: 'Otim Charles',   branch: 'Mbale',   registered: '2022-08-22', deliveries: 7, totalValue: '21,000,000', lastActive: '2026-05-13', status: 'Active'   },
  { name: 'Lubega James',   branch: 'Hoima',   registered: '2023-09-12', deliveries: 6, totalValue: '18,000,000', lastActive: '2026-05-12', status: 'Active'   },
  { name: 'Ogenga Patrick', branch: 'Gulu',    registered: '2021-05-03', deliveries: 9, totalValue: '28,000,000', lastActive: '2026-05-11', status: 'Active'   },
  { name: 'Kamukama Denis', branch: 'Soroti',  registered: '2023-07-18', deliveries: 4, totalValue: '12,000,000', lastActive: '2026-05-10', status: 'Active'   },
  { name: 'Atukunda Mary',  branch: 'Soroti',  registered: '2024-02-28', deliveries: 2, totalValue: '6,000,000',  lastActive: '2026-04-30', status: 'Inactive' },
  { name: 'Namukasa Ruth',  branch: 'Masindi', registered: '2023-11-08', deliveries: 5, totalValue: '15,500,000', lastActive: '2026-05-08', status: 'Active'   },
];

// ── Custom report view data ───────────────────────────────────────────────────
// Keyed by report dataSource; used as fallback when the API is unavailable.

export const MOCK_CUSTOM_REPORT_DATA: Record<string, any[]> = {
  deliveries: [
    { branch: 'Hoima',   farmer: 'Okello John',     date: '2026-05-15', deliveryId: 'DEL-001', quantity: 12.4, grade: 'A', gradeCode: 'A1', value: '3,720,000', paymentStatus: 'Paid',    gradedBy: 'Mugisha S.', status: 'Graded'  },
    { branch: 'Masindi', farmer: 'Mugisha Peter',    date: '2026-05-14', deliveryId: 'DEL-002', quantity: 8.6,  grade: 'B', gradeCode: 'B2', value: '2,150,000', paymentStatus: 'Paid',    gradedBy: 'Nakato R.',  status: 'Paid'    },
    { branch: 'Gulu',    farmer: 'Nakato Sarah',     date: '2026-05-14', deliveryId: 'DEL-003', quantity: 15.2, grade: 'A', gradeCode: 'A2', value: '4,560,000', paymentStatus: 'Pending', gradedBy: 'Otim A.',    status: 'Graded'  },
    { branch: 'Lira',    farmer: 'Apio Grace',       date: '2026-05-13', deliveryId: 'DEL-004', quantity: 7.8,  grade: 'C', gradeCode: 'C1', value: '1,560,000', paymentStatus: 'Pending', gradedBy: 'Lubega P.',  status: 'Pending' },
    { branch: 'Mbale',   farmer: 'Otim Charles',     date: '2026-05-13', deliveryId: 'DEL-005', quantity: 10.5, grade: 'A', gradeCode: 'A1', value: '3,150,000', paymentStatus: 'Paid',    gradedBy: 'Ogen C.',    status: 'Paid'    },
    { branch: 'Hoima',   farmer: 'Lubega James',     date: '2026-05-12', deliveryId: 'DEL-006', quantity: 14.1, grade: 'B', gradeCode: 'B1', value: '3,525,000', paymentStatus: 'Pending', gradedBy: 'Mugisha S.', status: 'Graded'  },
    { branch: 'Soroti',  farmer: 'Atukunda Mary',    date: '2026-05-11', deliveryId: 'DEL-007', quantity: 11.8, grade: 'A', gradeCode: 'A2', value: '3,540,000', paymentStatus: 'Paid',    gradedBy: 'Apio T.',    status: 'Paid'    },
  ],
  grading: [
    { branch: 'Hoima',   gradeA: 129, gradeB: 56, gradeC: 18, rejected: 12, total: 215, qualityScore: 87, gradedBy: 'Mugisha S.' },
    { branch: 'Masindi', gradeA: 64,  gradeB: 48, gradeC: 21, rejected: 9,  total: 142, qualityScore: 82, gradedBy: 'Nakato R.'  },
    { branch: 'Gulu',    gradeA: 44,  gradeB: 32, gradeC: 14, rejected: 8,  total: 98,  qualityScore: 78, gradedBy: 'Otim A.'    },
    { branch: 'Lira',    gradeA: 39,  gradeB: 28, gradeC: 12, rejected: 8,  total: 87,  qualityScore: 75, gradedBy: 'Lubega P.'  },
    { branch: 'Mbale',   gradeA: 34,  gradeB: 24, gradeC: 10, rejected: 8,  total: 76,  qualityScore: 73, gradedBy: 'Ogen C.'    },
    { branch: 'Soroti',  gradeA: 28,  gradeB: 20, gradeC: 9,  rejected: 7,  total: 64,  qualityScore: 70, gradedBy: 'Apio T.'    },
  ],
  payments: [
    { farmer: 'Okello John',     branch: 'Hoima',   delivered: 24.5, value: '7,350,000', paid: '7,350,000', outstanding: '0',          status: 'Settled' },
    { farmer: 'Mugisha Peter',   branch: 'Masindi', delivered: 21.3, value: '5,325,000', paid: '3,000,000', outstanding: '2,325,000',  status: 'Partial' },
    { farmer: 'Nakato Sarah',    branch: 'Gulu',    delivered: 18.7, value: '5,610,000', paid: '5,610,000', outstanding: '0',          status: 'Settled' },
    { farmer: 'Apio Grace',      branch: 'Lira',    delivered: 16.2, value: '3,240,000', paid: '0',          outstanding: '3,240,000',  status: 'Pending' },
    { farmer: 'Otim Charles',    branch: 'Mbale',   delivered: 14.8, value: '4,440,000', paid: '4,440,000', outstanding: '0',          status: 'Settled' },
    { farmer: 'Kamukama Denis',  branch: 'Soroti',  delivered: 12.1, value: '3,630,000', paid: '2,000,000', outstanding: '1,630,000',  status: 'Partial' },
  ],
  members: [
    { name: 'Okello John',   branch: 'Hoima',   registered: '2023-03-15', deliveries: 8, totalValue: '24,000,000', lastActive: '2026-05-15', status: 'Active'   },
    { name: 'Mugisha Peter', branch: 'Masindi', registered: '2022-11-20', deliveries: 6, totalValue: '15,000,000', lastActive: '2026-05-14', status: 'Active'   },
    { name: 'Nakato Sarah',  branch: 'Gulu',    registered: '2023-06-10', deliveries: 5, totalValue: '18,000,000', lastActive: '2026-05-14', status: 'Active'   },
    { name: 'Apio Grace',    branch: 'Lira',    registered: '2024-01-05', deliveries: 3, totalValue: '9,000,000',  lastActive: '2026-04-20', status: 'Inactive' },
    { name: 'Otim Charles',  branch: 'Mbale',   registered: '2022-08-22', deliveries: 7, totalValue: '21,000,000', lastActive: '2026-05-13', status: 'Active'   },
  ],
};

// ── Cooperative profile ───────────────────────────────────────────────────────

export interface CooperativeProfile {
  name:               string;
  registrationNumber: string;
  address:            string;
  country:            string;
  poBox:              string;
  websiteUrl:         string;
  memberSince:        string;
  status:             'active' | 'suspended';
}

export const MOCK_COOP_PROFILE: CooperativeProfile = {
  name:               'Bugishu Cooperative Union',
  registrationNumber: 'COOP/2024/0157',
  address:            'Plot 12, Republic Street, Mbale',
  country:            'Uganda',
  poBox:              'P.O. Box 547, Mbale',
  websiteUrl:         'https://bugishu.coop',
  memberSince:        '2024-03-18',
  status:             'active',
};

// Shape matches CooperativeBankAccount from cooperative.service.ts
export const MOCK_COOP_BANK_ACCOUNTS = [
  {
    id:            '1',
    bankName:      'Stanbic Bank Uganda',
    bankBranch:    'Mbale Branch',
    accountName:   'Bugishu Cooperative Union Ltd',
    accountNumber: '9030012345678',
    isPrimary:     true,
  },
];

// ── Reports chart data ────────────────────────────────────────────────────────
// Numeric series used by ReportsService chart getters.
// The component keeps Chart.js config logic; the service keeps data.

export interface ChartSeries { labels: string[]; data: number[]; }
export interface StackedChartSeries {
  labels:   string[];
  datasets: Array<{ label: string; data: number[]; backgroundColor: string }>;
}

export const MOCK_DELIVERY_TREND: Record<string, ChartSeries> = {
  monthly: { labels: ['Dec','Jan','Feb','Mar','Apr','May'],                                                                           data: [92,108,134,156,148,215] },
  weekly:  { labels: ['Wk 44','Wk 46','Wk 48','Wk 50','Wk 52','Wk 2','Wk 4','Wk 6','Wk 8','Wk 10'],                               data: [38,42,51,48,55,61,58,72,68,78] },
  daily:   { labels: ['15 May','16','17','18','19','20','21','22','23','24','25','26','27','28'],                                     data: [18,12,24,16,20,8,15,22,19,25,14,18,21,28] },
};

export const MOCK_DELIVERY_BY_BRANCH:   ChartSeries = { labels: ['Hoima','Masindi','Gulu','Lira','Mbale','Soroti'],              data: [215,142,98,87,76,64] };
export const MOCK_DELIVERY_STATUS_SPLIT: ChartSeries = { labels: ['Pending','Graded','Paid'],                                    data: [45,230,265] };
export const MOCK_TOP_FARMERS_DELIVERY: ChartSeries  = { labels: ['Ogenga P.','Okello J.','Mugisha P.','Nakato S.','Atukunda M.'], data: [24.5,21.3,18.7,16.2,14.8] };

export const MOCK_GRADING_DISTRIBUTION: ChartSeries = { labels: ['Grade A','Grade B','Grade C','Rejected'], data: [338,188,84,44] };
export const MOCK_GRADING_BY_BRANCH: StackedChartSeries = {
  labels: ['Hoima','Masindi','Gulu','Lira','Mbale','Soroti'],
  datasets: [
    { label: 'Grade A',  data: [129,64,44,39,34,28], backgroundColor: '#10B981' },
    { label: 'Grade B',  data: [56,48,32,28,24,20],  backgroundColor: '#3B82F6' },
    { label: 'Grade C',  data: [18,21,14,12,10,9],   backgroundColor: '#F59E0B' },
    { label: 'Rejected', data: [12,9,8,8,8,7],       backgroundColor: '#EF4444' },
  ],
};
export const MOCK_QUALITY_TREND:    ChartSeries = { labels: ['Dec','Jan','Feb','Mar','Apr','May'],      data: [78,80,79,82,83,81] };
export const MOCK_REJECTION_RATES:  ChartSeries = { labels: ['Hoima','Masindi','Gulu','Lira','Mbale','Soroti'], data: [5.6,6.3,8.2,9.2,10.5,10.9] };

export const MOCK_PAYMENT_STATUS_BY_BRANCH: StackedChartSeries = {
  labels: ['Hoima','Masindi','Gulu','Lira','Mbale','Soroti'],
  datasets: [
    { label: 'Settled', data: [32,18,12,8,7,5], backgroundColor: '#10B981' },
    { label: 'Partial', data: [8,12,6,5,4,3],   backgroundColor: '#F59E0B' },
    { label: 'Pending', data: [4,6,3,4,3,2],    backgroundColor: '#EF4444' },
  ],
};
export const MOCK_PAYMENT_TREND:       ChartSeries = { labels: ['Dec','Jan','Feb','Mar','Apr','May'],          data: [28,34,42,38,45,52] };
export const MOCK_RECOVERY_RATE                    = 78; // percent
export const MOCK_OUTSTANDING_BY_BRANCH: ChartSeries = { labels: ['Masindi','Hoima','Lira','Gulu','Mbale','Soroti'], data: [12.6,8.4,5.8,6.2,3.4,2.1] };

export const MOCK_MEMBER_TREND:            ChartSeries = { labels: ['Dec','Jan','Feb','Mar','Apr','May'],             data: [8,12,6,14,10,14] };
export const MOCK_MEMBERS_BY_BRANCH:       ChartSeries = { labels: ['Hoima','Masindi','Mbale','Gulu','Soroti','Lira'], data: [124,98,86,82,78,74] };
export const MOCK_ACTIVE_MEMBER_SPLIT:     ChartSeries = { labels: ['Active','Inactive'],                             data: [425,117] };
export const MOCK_TOP_FARMERS_DELIVERIES:  ChartSeries = { labels: ['Ogenga P.','Okello J.','Otim C.','Lubega J.','Mugisha P.'], data: [9,8,7,6,6] };

// ── Cooperative-level payment batch records ────────────────────────────────────
// Used by BatchService (cooperative finance view) as seed data.

export const MOCK_COOPERATIVE_BATCHES: BatchRecord[] = [
  {
    id: 'B-001',
    batchName: 'August 2024 Coffee Run',
    branchId: 'BR-MBL',
    season: 'Wet Season',
    farmerCount: 14,
    grossAmount: 5_600_000,
    deductions: 800_000,
    netPayable: 4_800_000,
    status: 'processed',
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'B-002',
    batchName: 'September Maize — Mbarara',
    branchId: 'BR-MBA',
    season: 'Wet Season',
    farmerCount: 22,
    grossAmount: 8_800_000,
    deductions: 1_320_000,
    netPayable: 7_480_000,
    status: 'pending',
    createdAt: new Date('2024-09-28'),
  },
  {
    id: 'B-003',
    batchName: 'Dry Season Sesame Batch',
    branchId: 'BR-GUL',
    season: 'Dry Season',
    farmerCount: 9,
    grossAmount: 3_150_000,
    deductions: 315_000,
    netPayable: 2_835_000,
    status: 'settled',
    createdAt: new Date('2024-10-05'),
  },
  {
    id: 'B-004',
    batchName: 'Kiboga Vanilla Q4',
    branchId: 'BR-KIB',
    season: 'Dry Season',
    farmerCount: 6,
    grossAmount: 9_000_000,
    deductions: 900_000,
    netPayable: 8_100_000,
    status: 'pending',
    createdAt: new Date('2024-10-12'),
  },
  {
    id: 'B-005',
    batchName: 'Lira Sesame October',
    branchId: 'BR-LIR',
    season: 'Dry Season',
    farmerCount: 18,
    grossAmount: 6_300_000,
    deductions: 630_000,
    netPayable: 5_670_000,
    status: 'pending',
    createdAt: new Date('2024-10-18'),
  },
];

// ── Cooperative users ─────────────────────────────────────────────────────────

export const MOCK_COOPERATIVE_USERS = [
  { id: '1', name: 'Sarah Namubiru',   email: 's.namubiru@ugaap.co.ug',  phone: '+256 701 445 678', role: 'COOPERATIVE ADMIN', organization: 'UGAAP Central',            lastLogin: '2 mins ago', status: 'active'   as const },
  { id: '2', name: 'James Okello',     email: 'j.okello@ugaap.co.ug',    phone: '+256 754 123 456', role: 'LOGISTICS MANAGER', organization: 'Kasese Coffee Coop',        lastLogin: '1 hour ago', status: 'active'   as const },
  { id: '3', name: 'Mary Atim',        email: 'm.atim@ugaap.co.ug',      phone: '+256 772 987 654', role: 'ACCOUNTANT',        organization: 'Mubende Warehouse Central', lastLogin: 'Yesterday',  status: 'active'   as const },
  { id: '4', name: 'Robert Ssemakula', email: 'r.ssemakula@ugaap.co.ug', phone: '+256 700 654 321', role: 'COOPERATIVE ADMIN', organization: 'Kasese Coffee Coop',        lastLogin: '3 days ago', status: 'inactive' as const },
];

// ── Field agents ──────────────────────────────────────────────────────────────

export const MOCK_AGENTS = [
  { id: 'agt-001', agentCode: 'AGT-0001', fullName: 'Moses Byaruhanga', phone: '+256772114501', email: 'moses.b@bugishu.coop', nationalId: 'CM900421003XKE', role: 'field_agent'      as const, branchId: 'BR-HOI', branchName: 'Hoima Central',    assignedFarmers: 64, collectionsThisSeason: '18.2 MT', status: 'active'   as const, registeredAt: '2025-02-14' },
  { id: 'agt-002', agentCode: 'AGT-0002', fullName: 'Sarah Nambooze',   phone: '+256701558294', email: 'sarah.n@bugishu.coop', nationalId: 'CF880317002LMQ', role: 'collection_clerk' as const, branchId: 'BR-HOI', branchName: 'Hoima Central',    assignedFarmers: 41, collectionsThisSeason: '12.7 MT', status: 'active'   as const, registeredAt: '2025-03-02' },
  { id: 'agt-003', agentCode: 'AGT-0003', fullName: 'Ivan Okello',      phone: '+256759301873', email: 'ivan.o@bugishu.coop',  nationalId: 'CM921105004PRT', role: 'field_agent'      as const, branchId: 'BR-GUL', branchName: 'Gulu Branch',      assignedFarmers: 52, collectionsThisSeason: '15.9 MT', status: 'active'   as const, registeredAt: '2025-04-19' },
  { id: 'agt-004', agentCode: 'AGT-0004', fullName: 'Grace Akello',     phone: '+256782446120', email: 'grace.a@bugishu.coop', nationalId: 'CF950623001ZWB', role: 'field_agent'      as const, branchId: 'BR-LIR', branchName: 'Lira Cooperative', assignedFarmers: 38, collectionsThisSeason: '9.4 MT',  status: 'inactive' as const, registeredAt: '2025-01-28' },
  { id: 'agt-005', agentCode: 'AGT-0005', fullName: 'Peter Wanyama',    phone: '+256703918456', email: 'peter.w@bugishu.coop', nationalId: 'CM870914005QAC', role: 'collection_clerk' as const, branchId: 'BR-MBL', branchName: 'Mbale West',       assignedFarmers: 47, collectionsThisSeason: '14.1 MT', status: 'active'   as const, registeredAt: '2025-05-07' },
];

// ── Collection hubs ───────────────────────────────────────────────────────────

export const MOCK_COLLECTION_HUBS = [
  { id: 'hub-001', hubCode: 'HUB-0001', name: 'Hoima Market Hub',               location: 'Hoima Trading Centre, Plot 14',  district: 'Hoima',   branchId: 'BR-HOI', branchName: 'Hoima Central',    capacity: 50, currentLoad: 32.4, commodities: ['Robusta Coffee', 'Maize'],              status: 'active'   as const, createdAt: '2025-01-10' },
  { id: 'hub-002', hubCode: 'HUB-0002', name: 'Masindi South Collection Point',  location: 'Masindi-Kampala Rd, Km 4',      district: 'Masindi', branchId: 'BR-MAS', branchName: 'Masindi Depot',    capacity: 80, currentLoad: 71.0, commodities: ['Robusta Coffee'],                       status: 'active'   as const, createdAt: '2025-02-03' },
  { id: 'hub-003', hubCode: 'HUB-0003', name: 'Gulu Farmers Hub',                location: 'Gulu Central Market, Stall 22', district: 'Gulu',    branchId: 'BR-GUL', branchName: 'Gulu Branch',      capacity: 40, currentLoad: 12.7, commodities: ['Simsim', 'Soya Beans', 'Millet'],      status: 'active'   as const, createdAt: '2025-03-18' },
  { id: 'hub-004', hubCode: 'HUB-0004', name: 'Lira East Aggregation Centre',    location: 'Lira Municipality, Block C',    district: 'Lira',    branchId: 'BR-LIR', branchName: 'Lira Cooperative', capacity: 60, currentLoad: 0,    commodities: ['Sunflower', 'Soya Beans'],              status: 'inactive' as const, createdAt: '2025-04-22' },
  { id: 'hub-005', hubCode: 'HUB-0005', name: 'Mbale West Hub',                  location: 'Mbale Industrial Area, Shed B', district: 'Mbale',   branchId: 'BR-MBL', branchName: 'Mbale West',       capacity: 35, currentLoad: 28.9, commodities: ['Arabica Coffee', 'Maize'],              status: 'active'   as const, createdAt: '2025-05-30' },
];

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
