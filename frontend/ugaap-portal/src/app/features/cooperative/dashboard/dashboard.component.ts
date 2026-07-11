// features/cooperative/dashboard/dashboard.component.ts
//
// Cooperative Admin home screen.
// All data comes from CooperativeDashboardService — swap mock Observables
// for real HTTP calls there without touching this component.

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { StatCardComponent, StatCardData } from '../../../shared/components/stat-card/stat-card.component';
import { ActivityItemComponent, ActivityData } from '../../../shared/components/activity-item/activity-item.component';
import { SessionService } from '../../../core/services/session.service';
import {
  CooperativeDashboardService,
  BranchPerformanceRow,
  PaymentBreakdownRow,
} from '../../../core/services/cooperative-dashboard.service';

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

  private session   = inject(SessionService);
  private dashboard = inject(CooperativeDashboardService);

  readonly user = this.session.currentUser;
  get userName(): string { return this.user()?.fullName ?? 'Admin'; }

  cooperativeName = '';
  season          = '';
  totalVolume     = '';

  stats:             StatCardData[]       = [];
  branchPerformance: BranchPerformanceRow[] = [];
  paymentBreakdown:  PaymentBreakdownRow[]  = [];
  recentActivities:  ActivityData[]         = [];

  ngOnInit(): void {
    this.dashboard.getMeta().subscribe(meta => {
      this.cooperativeName = meta.cooperativeName;
      this.season          = meta.season;
      this.totalVolume     = meta.totalVolume;
    });

    this.dashboard.getStats().subscribe(stats => {
      this.stats = stats as StatCardData[];
    });

    this.dashboard.getBranchPerformance().subscribe(rows => {
      this.branchPerformance = rows;
    });

    this.dashboard.getPaymentBreakdown().subscribe(rows => {
      this.paymentBreakdown = rows;
    });

    this.dashboard.getRecentActivities().subscribe(activities => {
      this.recentActivities = activities as ActivityData[];
    });
  }

  viewFullReport(): void {
    console.log('View full report');
  }

  loadMoreActivities(): void {
    console.log('Load more activities');
  }
}
