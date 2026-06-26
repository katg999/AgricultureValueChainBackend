// features/platform/dashboard/platform-dashboard.component.ts
//
// Platform Admin home screen.
// Shows operational health of the platform: cooperative onboarding queue,
// platform-wide KPIs, system health, and recent audit activity.
// Platform admins never see individual farmer data — only aggregate signals.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Shared components

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
    {
      label:     'Pending Cooperatives',
      value:     '8',
      icon:      'clipboard',
      trend:     'Awaiting review',
      trendUp:   false,
      status:    'warning',
      clickable: true,
      route:     '/platform/cooperatives',
    },
    {
      label:     'Rejected Cooperatives',
      value:     '3',
      icon:      'alert',
      trend:     'Requires follow-up',
      trendUp:   false,
      status:    'critical',
      clickable: true,
      route:     '/platform/cooperatives',
    },
    {
      label:     'Deleted Cooperatives',
      value:     '5',
      icon:      'settings',
      trend:     'Archived records',
      trendUp:   false,
      clickable: false,
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

  constructor() {}


  ngOnInit(): void {
    // TODO: replace mock data with API calls
    console.log('Platform dashboard initialised');
  }

  viewFullAuditLogs(): void {
    console.log('Navigate to audit logs');
  }

  /** Exports all dashboard data (stats, onboarding pipeline, platform health,
   * recent activity) as a timestamped CSV file.
   */
  exportReport(): void {
    const rows: (string | number)[][] = [];

    // SECTION 1: Platform Stats
    rows.push(['=== PLATFORM STATS ===']);
    rows.push(['Label', 'Value', 'Trend']);
    this.stats.forEach(stat => {
      rows.push([stat.label, stat.value, stat.trend || '']);
    });
    rows.push([]); // empty separator row

    // SECTION 2: Onboarding Pipeline
    rows.push(['=== ONBOARDING PIPELINE ===']);
    rows.push(['Cooperative', 'Progress (%)', 'Steps', 'Status', 'Live']);
    this.onboardingItems.forEach(item => {
      rows.push([item.name, item.progress, item.steps, item.status, item.live ? 'Yes' : 'No']);
    });
    rows.push([]);

    // SECTION 3: Platform Health
    rows.push(['=== PLATFORM HEALTH ===']);
    rows.push(['Metric', 'Value', 'Highlight']);
    this.platformHealth.forEach(health => {
      rows.push([health.label, health.value, health.highlight ? 'Yes' : 'No']);
    });
    rows.push([]);

    // SECTION 4: Recent Activity
    rows.push(['=== RECENT ACTIVITY ===']);
    rows.push(['Actor', 'Event', 'Object', 'When']);
    this.recentActivity.forEach(activity => {
      rows.push([activity.actor, activity.event, activity.object, activity.when]);
    });

    // Convert to CSV with proper escaping
    const csvContent = rows.map(row =>
      row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.setAttribute('download', `platform_report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

