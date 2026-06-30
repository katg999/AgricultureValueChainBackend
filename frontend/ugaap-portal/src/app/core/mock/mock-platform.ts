// core/mock/mock-platform.ts
//
// Static mock data for the Platform Admin dashboard.
// Move to API calls in PlatformDashboardService when the backend is ready.

import { StatCardData } from '../../shared/components/stat-card/stat-card.component';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface OnboardingItem {
  name:          string;
  progress:      number;
  steps:         string;
  status:        string;
  statusVariant: 'success' | 'warning' | 'info';
  live:          boolean;
}

export interface PlatformHealthItem {
  label:      string;
  value:      string;
  highlight?: boolean;
}

export interface PlatformActivity {
  actor:        string;
  event:        string;
  eventVariant: 'success' | 'info' | 'warning';
  object:       string;
  when:         string;
}

// ── Data ─────────────────────────────────────────────────────────────────────

export const MOCK_PLATFORM_STATS: StatCardData[] = [
  {
    label:     'Cooperatives Flagged',
    value:     '3',
    icon:      'building',
    trend:     '2 overdue KYC reviews',
    trendUp:   false,
    status:    'critical',
    clickable: true,
    route:     '/platform/cooperatives',
  },
  {
    label:     'Pending Approvals',
    value:     '12',
    icon:      'clock',
    trend:     '+4 since yesterday',
    trendUp:   false,
    status:    'warning',
    clickable: true,
    route:     '/platform/cooperatives',
  },
  {
    label:     'System Sync Failures',
    value:     '2',
    icon:      'alert',
    trend:     'Last failure: 1 h ago',
    trendUp:   false,
    status:    'critical',
    clickable: true,
  },
];

export const MOCK_ONBOARDING_ITEMS: OnboardingItem[] = [
  {
    name:          'Kasese Coffee Union',
    progress:      100,
    steps:         '6 of 6 steps completed',
    status:        'ACTIVE',
    statusVariant: 'success',
    live:          true,
  },
  {
    name:          'Masaka Growers Co-op',
    progress:      50,
    steps:         '3 of 6 steps completed',
    status:        'KYC PENDING',
    statusVariant: 'warning',
    live:          false,
  },
  {
    name:          'Bugisu Arabica Exports',
    progress:      67,
    steps:         '4 of 6 steps completed',
    status:        'INTEGRATING',
    statusVariant: 'info',
    live:          false,
  },
];

export const MOCK_PLATFORM_HEALTH: PlatformHealthItem[] = [
  { label: 'Active seasons',            value: '2024-B Harvest' },
  { label: 'Total branches',            value: '142'            },
  { label: 'Collection centres',        value: '894'            },
  { label: 'Ungraded deliveries',       value: '412 MT',  highlight: true },
  { label: 'Loans outstanding',         value: 'UGX 1.2B'       },
  { label: 'Reconciliation exceptions', value: '12 Open', highlight: true },
];

export const MOCK_PLATFORM_ACTIVITIES: PlatformActivity[] = [
  { actor: 'J.Mukasa',   event: 'VERIFIED', eventVariant: 'success', object: 'ORG_49102',      when: '2m ago'  },
  { actor: 'Admin Bot',  event: 'SYNC',     eventVariant: 'info',    object: 'BATCH_992',       when: '14m ago' },
  { actor: 'R.Namubiru', event: 'CONFIG',   eventVariant: 'warning', object: 'SYS_PARAM_RATE', when: '1h ago'  },
];

// ── Platform users ────────────────────────────────────────────────────────────

export interface PlatformUser {
  id:           string;
  name:         string;
  email:        string;
  phone:        string;
  role:         string;
  organization: string;
  lastLogin:    string;
}

export interface LoginHistoryEntry {
  dateTime:  string;
  ipAddress: string;
  device:    string;
  status:    'success' | 'failed';
}

export interface PlatformUserDetail extends PlatformUser {
  nationalId:          string;
  dateOfBirth:         string;
  dateRegistered:      string;
  cooperative:         string;
  twoFAStatus:         string;
  lastPasswordChange:  string;
  failedLoginAttempts: number;
  status:              'active' | 'inactive';
}

export const MOCK_PLATFORM_USERS: PlatformUser[] = [
  { id: '1', name: 'Sarah Namubiru',  email: 's.namubiru@ugaap-ug',  phone: '+256 701 445 678', role: 'PLATFORM ADMIN',    organization: 'UGAAP Central',           lastLogin: '2 mins ago'  },
  { id: '2', name: 'James Ochieng',   email: 'j.ochieng@ugaap-ug',   phone: '+256 772 234 567', role: 'COOPERATIVE ADMIN', organization: 'Kasese Coffee Coop',       lastLogin: '1 hour ago'  },
  { id: '3', name: 'Grace Atim',      email: 'g.atim@ugaap-ug',      phone: '+256 784 890 123', role: 'PLATFORM ADMIN',    organization: 'UGAAP Central',           lastLogin: 'Yesterday'   },
  { id: '4', name: 'David Wafula',    email: 'd.wafula@ugaap-ug',    phone: '+256 756 321 098', role: 'COOPERATIVE ADMIN', organization: 'Mubende Warehouse Central', lastLogin: '3 days ago'  },
];

export const MOCK_PLATFORM_USER_DETAIL: PlatformUserDetail = {
  id:                  '1',
  name:                'Sarah Namubiru',
  email:               's.namubiru@ugaap-logistics.ug',
  phone:               '+256 772 458 902',
  nationalId:          'CM8902•••••24X',
  dateOfBirth:         '14 May 1988',
  dateRegistered:      '02 January 2023',
  lastLogin:           '2024-05-24 09:14:22',
  role:                'Logistics Manager',
  organization:        'UGAAP Central',
  cooperative:         'Mubende Warehouse Central',
  twoFAStatus:         'Enabled',
  lastPasswordChange:  '04 April 2024',
  failedLoginAttempts: 0,
  status:              'active',
};

export const MOCK_LOGIN_HISTORY: LoginHistoryEntry[] = [
  { dateTime: '2024-05-24 09:14:22', ipAddress: '197.232.44.112', device: 'MacBook Pro · Chrome 125',      status: 'success' },
  { dateTime: '2024-05-23 18:22:05', ipAddress: '197.232.44.112', device: 'iPhone 15 Pro · Safari Mobile', status: 'success' },
  { dateTime: '2024-05-23 18:21:44', ipAddress: '197.232.44.112', device: 'iPhone 15 Pro · Safari Mobile', status: 'failed'  },
  { dateTime: '2024-05-22 08:45:10', ipAddress: '41.210.154.38',  device: 'MacBook Pro · Chrome 125',      status: 'success' },
  { dateTime: '2024-05-21 14:30:55', ipAddress: '41.210.154.38',  device: 'iPad Pro · Chrome iOS',         status: 'success' },
];

// ── Platform cooperatives list ─────────────────────────────────────────────────

export interface PlatformCooperative {
  id:                 string;
  name:               string;
  code:               string;
  country:            string;
  branches:           number;
  activeFarmers:      number;
  season:             string;
  status:             'active' | 'pending' | 'suspended';
  onboardingProgress: number;
  lastActivity:       string;
}

export const MOCK_PLATFORM_COOPERATIVES: PlatformCooperative[] = [
  { id: 'COOP-UG-092', name: 'Banyankole Kweterana',   code: 'COOP-UG-092', country: 'Uganda', branches: 12, activeFarmers: 4250,  season: 'Harvest Q3',  status: 'active',    onboardingProgress: 100, lastActivity: '2 mins ago'  },
  { id: 'COOP-UG-089', name: 'Bugisu Cooperative Union', code: 'COOP-UG-089', country: 'Uganda', branches: 28, activeFarmers: 15800, season: 'Post-Harvest', status: 'pending',   onboardingProgress: 75,  lastActivity: '1 hour ago'  },
  { id: 'COOP-UG-112', name: 'West Acholi Cooperative', code: 'COOP-UG-112', country: 'Uganda', branches: 8,  activeFarmers: 2100,  season: 'Planting',     status: 'suspended', onboardingProgress: 100, lastActivity: '2 days ago'  },
  { id: 'COOP-UG-015', name: 'Nyari-Kigyezi Cooperative', code: 'COOP-UG-015', country: 'Uganda', branches: 15, activeFarmers: 6720,  season: 'Harvest Q3',  status: 'active',    onboardingProgress: 100, lastActivity: '45 mins ago' },
];
