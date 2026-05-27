// features/branch/dashboard/dashboard.component.ts
//
// Branch staff home screen — today's collection and grading snapshot.
// Focused on what the field agent needs right now at this branch.

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StatCardComponent, StatCardData } from '../../../shared/components/stat-card/stat-card.component';
import { ActivityItemComponent, ActivityData } from '../../../shared/components/activity-item/activity-item.component';
import { SessionService } from '../../../core/services/session.service';

interface TodayDelivery {
  ref:     string;
  farmer:  string;
  weight:  string;
  grade:   string;
  amount:  string;
  time:    string;
  status:  'graded' | 'pending' | 'queued';
}

@Component({
  selector: 'app-branch-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, ActivityItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.css',
})
export class BranchDashboardComponent implements OnInit {

  private session = inject(SessionService);
  readonly user   = this.session.currentUser;

  get userName(): string { return this.user()?.fullName ?? 'Branch Staff'; }

  // ── KPI stat cards ────────────────────────────────────────────────────────

  stats: StatCardData[] = [
    {
      label:   "Today's Collections",
      value:   '2.4 MT',
      icon:    '📥',
      trend:   '+0.8 MT from yesterday',
      trendUp: true,
    },
    {
      label:     'Grading Queue',
      value:     '18',
      icon:      '⏳',
      status:    'warning',
      clickable: true,
      route:     '/collections',
    },
    {
      label:   'Stock on Hand',
      value:   '15.6 MT',
      icon:    '📦',
      trend:   'Within capacity',
      trendUp: true,
    },
    {
      label:   'Active Farmers',
      value:   '142',
      icon:    '🚜',
      trend:   '+3 this week',
      trendUp: true,
    },
  ];

  // ── Today's deliveries ────────────────────────────────────────────────────

  deliveries: TodayDelivery[] = [
    { ref: 'DEL-9041', farmer: 'John Tumwesigye',    weight: '320 kg', grade: 'A',  amount: 'UGX 1,600K', time: '10:15', status: 'graded'  },
    { ref: 'DEL-9040', farmer: 'Rose Atukunda',      weight: '180 kg', grade: 'B+', amount: 'UGX 810K',   time: '10:02', status: 'graded'  },
    { ref: 'DEL-9039', farmer: 'Paul Ategeka',       weight: '260 kg', grade: 'A',  amount: 'UGX 1,300K', time: '09:44', status: 'graded'  },
    { ref: 'DEL-9038', farmer: 'Deborah Kembabazi',  weight: '95 kg',  grade: '—',  amount: '—',           time: '09:30', status: 'pending' },
    { ref: 'DEL-9037', farmer: 'Fred Turyamureeba',  weight: '410 kg', grade: 'A+', amount: 'UGX 2,255K', time: '09:10', status: 'graded'  },
  ];

  // ── Activity feed ─────────────────────────────────────────────────────────

  recentActivities: ActivityData[] = [
    {
      title:     'New delivery recorded',
      subtitle:  'John Tumwesigye · 320 kg · Grade A',
      timestamp: '10 mins ago',
      color:     '#10B981',
    },
    {
      title:     'Farmer registered',
      subtitle:  'Christine Nanyonjo added to branch roster',
      timestamp: '1 hr ago',
      action:    'View Profile',
      color:     '#3B82F6',
    },
    {
      title:     'Moisture test flagged',
      subtitle:  'DEL-9038 — above threshold, pending re-test',
      timestamp: '2 hrs ago',
      color:     '#F59E0B',
    },
    {
      title:     'Stock level updated',
      subtitle:  'Warehouse capacity at 68%',
      timestamp: '3 hrs ago',
      color:     '#9CA3AF',
    },
  ];

  // ── Helpers ───────────────────────────────────────────────────────────────

  statusClass(s: TodayDelivery['status']): string {
    return `status--${s}`;
  }

  statusLabel(s: TodayDelivery['status']): string {
    return { graded: 'GRADED', pending: 'PENDING', queued: 'IN QUEUE' }[s] ?? s;
  }

  ngOnInit(): void {
    // TODO: replace mock data with API calls
  }

  recordDelivery(): void {
    // Navigation handled by routerLink
  }
}
