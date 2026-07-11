// features/branch/dashboard/dashboard.component.ts
//
// Branch staff home screen.
// All data comes from BranchDashboardService — swap mock Observables
// for real HTTP calls there without touching this component.

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StatCardComponent, StatCardData } from '../../../shared/components/stat-card/stat-card.component';
import { ActivityItemComponent, ActivityData } from '../../../shared/components/activity-item/activity-item.component';
import { SessionService } from '../../../core/services/session.service';
import { BranchDashboardService, TodayDelivery } from '../../../core/services/branch-dashboard.service';

@Component({
  selector: 'app-branch-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent, ActivityItemComponent],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.css',
})
export class BranchDashboardComponent implements OnInit {

  private session            = inject(SessionService);
  private dashboard          = inject(BranchDashboardService);

  readonly user = this.session.currentUser;
  get userName(): string { return this.user()?.fullName ?? 'Branch Staff'; }

  stats:             StatCardData[]    = [];
  deliveries:        TodayDelivery[]   = [];
  recentActivities:  ActivityData[]    = [];

  ngOnInit(): void {
    this.dashboard.getStats().subscribe(stats => {
      this.stats = stats as StatCardData[];
    });

    this.dashboard.getTodayDeliveries().subscribe(deliveries => {
      this.deliveries = deliveries;
    });

    this.dashboard.getRecentActivities().subscribe(activities => {
      this.recentActivities = activities as ActivityData[];
    });
  }

  statusClass(s: TodayDelivery['status']): string {
    return `status--${s}`;
  }

  statusLabel(s: TodayDelivery['status']): string {
    return { graded: 'GRADED', pending: 'PENDING', queued: 'IN QUEUE' }[s] ?? s;
  }

  recordDelivery(): void {
    // Navigation handled by routerLink in the template
  }
}
