// features/platform/dashboard/platform-dashboard.component.ts
//
// Platform Admin home screen.
// Shows operational health of the platform: cooperative onboarding queue,
// platform-wide KPIs, system health, and recent audit activity.
// Platform admins never see individual farmer data — only aggregate signals.

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StatCardComponent, StatCardData } from '../../../shared/components/stat-card/stat-card.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import {
  PlatformDashboardService,
  OnboardingItem,
  PlatformHealthItem,
  PlatformActivity,
} from '../../../core/services/platform-dashboard.service';

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

  private dashboard = inject(PlatformDashboardService);

  stats:           StatCardData[]       = [];
  onboardingItems: OnboardingItem[]     = [];
  platformHealth:  PlatformHealthItem[] = [];
  recentActivity:  PlatformActivity[]   = [];

  ngOnInit(): void {
    this.dashboard.getStats().subscribe(stats => {
      this.stats = stats;
    });

    this.dashboard.getOnboardingItems().subscribe(items => {
      this.onboardingItems = items;
    });

    this.dashboard.getPlatformHealth().subscribe(health => {
      this.platformHealth = health;
    });

    this.dashboard.getRecentActivity().subscribe(activity => {
      this.recentActivity = activity;
    });
  }

  viewFullAuditLogs(): void {
    console.log('Navigate to audit logs');
  }

  /** Exports all dashboard data as a timestamped CSV file. */
  exportReport(): void {
    const rows: (string | number)[][] = [];

    rows.push(['=== PLATFORM STATS ===']);
    rows.push(['Label', 'Value', 'Trend']);
    this.stats.forEach(stat => {
      rows.push([stat.label, stat.value, stat.trend || '']);
    });
    rows.push([]);

    rows.push(['=== ONBOARDING PIPELINE ===']);
    rows.push(['Cooperative', 'Progress (%)', 'Steps', 'Status', 'Live']);
    this.onboardingItems.forEach(item => {
      rows.push([item.name, item.progress, item.steps, item.status, item.live ? 'Yes' : 'No']);
    });
    rows.push([]);

    rows.push(['=== PLATFORM HEALTH ===']);
    rows.push(['Metric', 'Value', 'Highlight']);
    this.platformHealth.forEach(health => {
      rows.push([health.label, health.value, health.highlight ? 'Yes' : 'No']);
    });
    rows.push([]);

    rows.push(['=== RECENT ACTIVITY ===']);
    rows.push(['Actor', 'Event', 'Object', 'When']);
    this.recentActivity.forEach(activity => {
      rows.push([activity.actor, activity.event, activity.object, activity.when]);
    });

    const csvContent = rows.map(row =>
      row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

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
