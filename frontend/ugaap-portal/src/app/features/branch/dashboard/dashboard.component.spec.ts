import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';

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

  it('preserves stat-card DOM elements across batchStats updates (trackBy — avoids re-animating on refresh)', () => {
    const counts$ = new Subject<Record<ActiveBatchStatus, number>>();
    const fakeDashboard = {
      getStats: vi.fn(() => of([])),
      getTodayDeliveries: vi.fn(() => of([])),
      getRecentActivities: vi.fn(() => of([])),
    };
    const fakePaymentBatchService = {
      getBatchStatusCounts: vi.fn(() => counts$.asObservable()),
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
    fixture.detectChanges();

    counts$.next({ Draft: 1, 'Pending Approval': 0, Approved: 1, Disbursed: 0 });
    fixture.detectChanges();
    const firstCardEl = fixture.debugElement.queryAll(By.directive(StatCardComponent))[0].nativeElement;

    counts$.next({ Draft: 2, 'Pending Approval': 0, Approved: 1, Disbursed: 0 });
    fixture.detectChanges();
    const secondCardEl = fixture.debugElement.queryAll(By.directive(StatCardComponent))[0].nativeElement;

    expect(secondCardEl).toBe(firstCardEl);
  });
});

describe('BranchDashboardComponent — real PaymentBatchService integration', () => {
  it('renders tile values matching the real branch-scoped batch data (BATCH-001 Approved, BATCH-002 Draft)', () => {
    TestBed.configureTestingModule({
      imports: [BranchDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    const fixture = TestBed.createComponent(BranchDashboardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const draftTile = component.batchStats.find(s => s.label === 'Draft Batches')!;
    const approvedTile = component.batchStats.find(s => s.label === 'Approved Batches')!;
    const pendingTile = component.batchStats.find(s => s.label === 'Pending Approval')!;
    const disbursedTile = component.batchStats.find(s => s.label === 'Disbursed Batches')!;

    expect(draftTile.value).toBe(1);
    expect(approvedTile.value).toBe(1);
    expect(pendingTile.value).toBe(0);
    expect(disbursedTile.value).toBe(0);
  });
});
