// features/cooperative/dashboard/dashboard.component.ts
//
// Cooperative Admin home screen.
// Shows season-level KPIs, branch performance, payment recovery, and recent activity.

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StatCardComponent, StatCardData } from '../../../shared/components/stat-card/stat-card.component';
import { ActivityItemComponent, ActivityData } from '../../../shared/components/activity-item/activity-item.component';
import { SessionService } from '../../../core/services/session.service';

interface BranchPerformance {
  branchName:  string;
  deliveries:  number;
  outstanding: string;
  status:      'healthy' | 'action-required' | 'new';
}

interface PaymentBreakdown {
  status: string;
  amount: string;
  flex:   number;   // proportional width in the stacked bar
  color:  string;
}

@Component({
  selector: 'app-cooperative-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatCardComponent,
    ActivityItemComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.css',
})
export class CooperativeDashboardComponent implements OnInit {

  private session = inject(SessionService);
  readonly user   = this.session.currentUser;

  // ── Greeting ─────────────────────────────────────────────────────────────

  get userName():        string { return this.user()?.fullName ?? 'Admin'; }
  cooperativeName = 'Bugishu Cooperative Union';
  season          = '2026 Main Season active';

  // ── KPI stat cards ────────────────────────────────────────────────────────

  // Thresholds are hardcoded for now — the shape matches what the backend
  // will eventually supply per stat. Tapping a card opens its route.
  stats: StatCardData[] = [
    {
      label:   'Active agents',
      value:   '3,200',
      icon:    'users',
      trend:   '+12% from last season',
      trendUp: true,
      // Agent base shrinks → degrade: ≤2,000 warning, ≤1,000 critical
      thresholds: { warning: 2000, critical: 1000, direction: 'below' },
      route:   '/cooperative/agents',
    },
    {
      label:   'Total deliveries',
      value:   '540',
      icon:    'box',
      trend:   '+12% from last season',
      trendUp: true,
      route:   '/cooperative/collections',
    },
    {
      label:   'Input Disbursed',
      value:   '450,000,000',
      icon:    'wallet',
      trend:   'UGX',
      trendUp: true,
      route:   '/cooperative/inventory/stock-disbursed',
    },
    {
      label:      'Outstanding',
      value:      '120,000,000',
      icon:       'clipboard',
      // Outstanding balance grows → degrade: ≥50M warning, ≥100M critical
      thresholds: { warning: 50_000_000, critical: 100_000_000, direction: 'above' },
      route:      '/cooperative/inventory/stock-disbursed',
    },
  ];

  // ── Branch performance ────────────────────────────────────────────────────

  branchPerformance: BranchPerformance[] = [
    { branchName: 'Hoima Central',   deliveries: 215.4, outstanding: '34,500,000', status: 'healthy'         },
    { branchName: 'Masindi West',    deliveries: 142.8, outstanding: '58,200,000', status: 'action-required' },
    { branchName: 'Kibaale Outpost', deliveries: 98.1,  outstanding: '12,100,000', status: 'healthy'         },
    { branchName: 'Buliisa Branch',  deliveries: 83.7,  outstanding: '15,200,000', status: 'new'             },
  ];

  // ── Payment breakdown ─────────────────────────────────────────────────────

  paymentBreakdown: PaymentBreakdown[] = [
    { status: 'SETTLED',           amount: 'UGX 66M',  flex: 66, color: '#10B981' },
    { status: 'PARTIALLY SETTLED', amount: 'UGX 36M',  flex: 36, color: '#F59E0B' },
    { status: 'PENDING',           amount: 'UGX 18M',  flex: 18, color: '#D1D5DB' },
  ];

  totalVolume = 'UGX 120,000,000';

  // ── Recent activity ───────────────────────────────────────────────────────

  recentActivities: ActivityData[] = [
    {
      title:     'Agnes Owino registered',
      subtitle:  'Hoima Central',
      timestamp: '14 mins ago',
      action:    'View Profile',
      color:     '#10B981',
    },
    {
      title:      'New delivery from Mbarara',
      subtitle:   '12.5 MT Robusta',
      timestamp:  '2 hrs ago',
      action:     'BATCH-5510-COF',
      actionIcon: '↗',
      color:      '#F59E0B',
    },
    {
      title:     'Loan disbursement approved',
      subtitle:  'UGX 4.2M to Okello David',
      timestamp: '5 hrs ago',
      color:     '#3B82F6',
    },
    {
      title:     'Logistics route updated',
      subtitle:  'Masindi to Kampala Central',
      timestamp: 'Yesterday',
      color:     '#9CA3AF',
    },
    {
      title:     'System Backup Completed',
      subtitle:  'Scheduled Maintenance',
      timestamp: '2 days ago',
      color:     '#6B7280',
    },
  ];

  ngOnInit(): void {
    // TODO: replace mock data with API calls
    console.log('Cooperative dashboard initialised');
  }

  viewFullReport(): void {
    console.log('View full report');
  }

  loadMoreActivities(): void {
    console.log('Load more activities');
  }
}
