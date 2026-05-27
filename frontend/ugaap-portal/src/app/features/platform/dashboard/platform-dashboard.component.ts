// features/platform/dashboard/platform-dashboard.component.ts
//
// Platform Admin home screen.
// Shows operational health of the platform: cooperative onboarding queue,
// platform-wide KPIs, system health, and recent audit activity.
// Platform admins never see individual farmer data — only aggregate signals.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StatCardComponent, StatCardData } from '../../../shared/components/stat-card/stat-card.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';

interface OnboardingItem {
  name:          string;
  progress:      number;
  steps:         string;
  status:        string;
  statusVariant: 'success' | 'warning' | 'info';
  live:          boolean;
}

interface PlatformHealthItem {
  label:      string;
  value:      string;
  highlight?: boolean;
}

interface PlatformActivity {
  actor:        string;
  event:        string;
  eventVariant: 'success' | 'info' | 'warning';
  object:       string;
  when:         string;
}

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatCardComponent,
    ProgressBarComponent,
  ],
  templateUrl: './platform-dashboard.component.html',
  styleUrl:    './platform-dashboard.component.css',
})
export class PlatformDashboardComponent implements OnInit {

  // ── KPI stat cards ────────────────────────────────────────────────────────
  // Platform-level signals only — no farm data.
  // Every card should demand attention or action from the platform admin.

  stats: StatCardData[] = [
    {
      label:     'Cooperatives Flagged',
      value:     '3',
      icon:      '🏢',
      trend:     '2 overdue KYC reviews',
      trendUp:   false,
      status:    'critical',
      clickable: true,
      route:     '/platform/cooperatives',
    },
    {
      label:     'Pending Approvals',
      value:     '12',
      icon:      '⏳',
      trend:     '+4 since yesterday',
      trendUp:   false,
      status:    'warning',
      clickable: true,
      route:     '/platform/cooperatives',
    },
    {
      label:     'System Sync Failures',
      value:     '2',
      icon:      '🔴',
      trend:     'Last failure: 1 h ago',
      trendUp:   false,
      status:    'critical',
      clickable: true,
    },
  ];

  // ── Onboarding pipeline ───────────────────────────────────────────────────

  onboardingItems: OnboardingItem[] = [
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

  // ── Platform health ───────────────────────────────────────────────────────

  platformHealth: PlatformHealthItem[] = [
    { label: 'Active seasons',               value: '2024-B Harvest' },
    { label: 'Total branches',               value: '142'            },
    { label: 'Collection centres',           value: '894'            },
    { label: 'Ungraded deliveries',          value: '412 MT',  highlight: true },
    { label: 'Loans outstanding',            value: 'UGX 1.2B'       },
    { label: 'Reconciliation exceptions',    value: '12 Open', highlight: true },
  ];

  // ── Recent platform activity ──────────────────────────────────────────────

  recentActivity: PlatformActivity[] = [
    { actor: 'J.Mukasa',    event: 'VERIFIED', eventVariant: 'success', object: 'ORG_49102',       when: '2m ago'  },
    { actor: 'Admin Bot',   event: 'SYNC',     eventVariant: 'info',    object: 'BATCH_992',        when: '14m ago' },
    { actor: 'R.Namubiru',  event: 'CONFIG',   eventVariant: 'warning', object: 'SYS_PARAM_RATE',  when: '1h ago'  },
  ];

  ngOnInit(): void {
    // TODO: replace mock data with API calls
    console.log('Platform dashboard initialised');
  }

  viewFullAuditLogs(): void {
    console.log('Navigate to audit logs');
  }
}
