import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { BranchDashboardComponent } from './dashboard.component';
import { BranchDashboardService } from '../../../core/services/branch-dashboard.service';
import { PaymentBatchService } from '../finance/services/payment-batch.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ActiveBatchStatus } from '../finance/models/batch.models';

describe('BranchDashboardComponent — batch status tiles', () => {
  let fixture: ComponentFixture<BranchDashboardComponent>;
  let component: BranchDashboardComponent;

  function setup(counts: Record<ActiveBatchStatus, number>) {
    const fakeDashboard = {
      getStats: vi.fn(() => of([])),
      getTodayDeliveries: vi.fn(() => of([])),
      getRecentActivities: vi.fn(() => of([])),
    };
    const fakePaymentBatchService = {
      getBatchStatusCounts: vi.fn(() => of(counts)),
    };

    TestBed.configureTestingModule({
      imports: [BranchDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: BranchDashboardService, useValue: fakeDashboard },
        { provide: PaymentBatchService, useValue: fakePaymentBatchService },
      ],
    });

    fixture = TestBed.createComponent(BranchDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders 4 batch-status tiles with the correct counts and route', () => {
    setup({ Draft: 2, 'Pending Approval': 0, Approved: 3, Disbursed: 7 });

    expect(component.batchStats.length).toBe(4);
    expect(component.batchStats.every(s => s.route === '/branch/finance/batch-processing')).toBe(true);

    const values = component.batchStats.map(s => s.value);
    expect(values).toEqual([2, 0, 3, 7]);

    const cards = fixture.debugElement.queryAll(By.directive(StatCardComponent));
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('flags Pending Approval as warning when its count is above 0', () => {
    setup({ Draft: 0, 'Pending Approval': 1, Approved: 0, Disbursed: 0 });

    const pendingTile = component.batchStats.find(s => s.label === 'Pending Approval')!;
    expect(pendingTile.status).toBe('warning');
  });

  it('flags Pending Approval as active when its count is 0', () => {
    setup({ Draft: 0, 'Pending Approval': 0, Approved: 0, Disbursed: 0 });

    const pendingTile = component.batchStats.find(s => s.label === 'Pending Approval')!;
    expect(pendingTile.status).toBe('active');
  });
});
