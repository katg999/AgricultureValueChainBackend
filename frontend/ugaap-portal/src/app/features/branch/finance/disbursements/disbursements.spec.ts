import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';

import { DisbursementsComponent } from './disbursements';
import { PaymentBatchService } from '../services/payment-batch.service';
import { PaymentBatch, ActiveBatchStatus } from '../models/batch.models';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

describe('DisbursementsComponent', () => {
  let fixture: ComponentFixture<DisbursementsComponent>;
  let component: DisbursementsComponent;
  let router: Router;

  const BATCHES: PaymentBatch[] = [
    {
      id: 'BATCH-001', batchName: 'Draft Run', season: 'Season A 2024',
      openingDate: '2024-08-01', closingDate: '2024-08-31', commodityFilter: 'Coffee',
      branch: 'Mbale West', branchId: 'BR-MBL', status: 'Draft',
      totalAmount: 1_000_000, farmerCount: 3, createdAt: new Date('2024-09-01'),
    },
    {
      id: 'BATCH-002', batchName: 'Ready Run', season: 'Season A 2024',
      openingDate: '2024-08-01', closingDate: '2024-08-31', commodityFilter: 'Maize',
      branch: 'Mbale West', branchId: 'BR-MBL', status: 'Approved',
      totalAmount: 2_500_000, farmerCount: 5, createdAt: new Date('2024-09-01'),
    },
    {
      id: 'BATCH-003', batchName: 'Already Paid', season: 'Season A 2024',
      openingDate: '2024-08-01', closingDate: '2024-08-31', commodityFilter: 'Coffee',
      branch: 'Mbale West', branchId: 'BR-MBL', status: 'Disbursed',
      totalAmount: 800_000, farmerCount: 2, createdAt: new Date('2024-09-01'),
    },
  ];

  function countsFor(batches: PaymentBatch[]): Record<ActiveBatchStatus, number> {
    const counts = { Draft: 0, 'Pending Approval': 0, Approved: 0, Disbursed: 0 } as Record<ActiveBatchStatus, number>;
    for (const b of batches) {
      if (b.status in counts) counts[b.status as ActiveBatchStatus]++;
    }
    return counts;
  }

  function setup(batches: PaymentBatch[]) {
    const fakePaymentBatchService = {
      getBatches: vi.fn(() => of(batches)),
      getBatchStatusCounts: vi.fn(() => of(countsFor(batches))),
    };

    TestBed.configureTestingModule({
      imports: [DisbursementsComponent],
      providers: [
        provideRouter([]),
        { provide: PaymentBatchService, useValue: fakePaymentBatchService },
      ],
    });

    fixture = TestBed.createComponent(DisbursementsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  it('shows only Approved batches', () => {
    setup(BATCHES);

    let rows: PaymentBatch[] = [];
    component.readyBatches$.subscribe(r => (rows = r));

    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe('BATCH-002');
  });

  it('navigates to the batch farmers/disburse page when Disburse is clicked', () => {
    setup(BATCHES);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.disburse(BATCHES[1]);

    expect(navigateSpy).toHaveBeenCalledWith(['/branch/finance/batch', 'BATCH-002', 'farmers']);
  });

  it('shows nothing when no batch is Approved', () => {
    setup(BATCHES.filter(b => b.status !== 'Approved'));

    let rows: PaymentBatch[] = [];
    component.readyBatches$.subscribe(r => (rows = r));

    expect(rows.length).toBe(0);
  });

  it('renders 4 batch-status tiles with counts matching the batch data, each linking back to Batch Processing', () => {
    setup(BATCHES); // 1 Draft, 1 Approved, 1 Disbursed, 0 Pending Approval

    expect(component.batchStats.length).toBe(4);
    expect(component.batchStats.every(s => s.route === '/branch/finance/batch-processing')).toBe(true);

    const values = component.batchStats.map(s => s.value);
    expect(values).toEqual([1, 0, 1, 1]);

    const cards = fixture.debugElement.queryAll(By.directive(StatCardComponent));
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('flags Pending Approval as warning when its count is above 0', () => {
    setup([
      { ...BATCHES[0], status: 'Pending Approval' },
    ]);

    const pendingTile = component.batchStats.find(s => s.label === 'Pending Approval')!;
    expect(pendingTile.status).toBe('warning');
  });

  it('flags Pending Approval as active when its count is 0', () => {
    setup(BATCHES);

    const pendingTile = component.batchStats.find(s => s.label === 'Pending Approval')!;
    expect(pendingTile.status).toBe('active');
  });

  it('preserves stat-card DOM elements across batchStats updates (trackBy — avoids re-animating on refresh)', () => {
    const counts$ = new Subject<Record<ActiveBatchStatus, number>>();
    const fakePaymentBatchService = {
      getBatches: vi.fn(() => of([])),
      getBatchStatusCounts: vi.fn(() => counts$.asObservable()),
    };

    TestBed.configureTestingModule({
      imports: [DisbursementsComponent],
      providers: [
        provideRouter([]),
        { provide: PaymentBatchService, useValue: fakePaymentBatchService },
      ],
    });

    fixture = TestBed.createComponent(DisbursementsComponent);
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
