import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';

import { BatchFarmersComponent } from './batch-farmers.component';
import { PaymentBatchService } from '../services/payment-batch.service';
import { PaymentService } from '../services/payment.service';
import { FarmerRecord, PaymentBatch, PayoutTransaction } from '../models/batch.models';

const batch: PaymentBatch = {
  id: 'BATCH-001',
  batchName: 'Season A Batch',
  season: 'Season A 2024',
  openingDate: '2024-09-01',
  closingDate: '2024-09-30',
  commodityFilter: 'All Commodities',
  branch: 'Mbale West',
  branchId: 'BR-MBL',
  status: 'Approved',
  totalAmount: 450000,
  farmerCount: 1,
  createdAt: new Date(),
};

const mobileMoneyFarmer: FarmerRecord = {
  farmerId: 'F-001',
  fullName: 'Okello James',
  commodity: 'Coffee',
  branch: 'Mbale West',
  branchId: 'BR-MBL',
  deliveryDate: '2024-09-15',
  session: 'morning',
  paymentMethod: 'Mobile Money',
  netPayable: 450000,
  hasBankDetails: true,
  status: 'Active',
  bankAccount: '9876100001',
  bankCode: 'STBK',
};

describe('BatchFarmersComponent', () => {
  let fixture: ComponentFixture<BatchFarmersComponent>;
  let component: BatchFarmersComponent;
  let fakePaymentService: {
    watchTransactions: ReturnType<typeof vi.fn>;
    disburseBatch: ReturnType<typeof vi.fn>;
    retryFarmer: ReturnType<typeof vi.fn>;
    checkPendingPayouts: ReturnType<typeof vi.fn>;
  };
  let fakePaymentBatchService: {
    getAllFarmers: ReturnType<typeof vi.fn>;
    getBatchById: ReturnType<typeof vi.fn>;
    getFarmersForBatch: ReturnType<typeof vi.fn>;
    groupFarmersByDayAndSession: ReturnType<typeof vi.fn>;
    updateBatchStatus: ReturnType<typeof vi.fn>;
  };
  let transactionsSubject: Subject<Map<string, PayoutTransaction>>;

  beforeEach(async () => {
    transactionsSubject = new Subject();
    fakePaymentService = {
      watchTransactions: vi.fn(() => transactionsSubject.asObservable()),
      disburseBatch: vi.fn(),
      retryFarmer: vi.fn(),
      checkPendingPayouts: vi.fn(() => of([])),
    };

    fakePaymentBatchService = {
      getAllFarmers: vi.fn(() => of([mobileMoneyFarmer])),
      getBatchById: vi.fn(() => batch),
      getFarmersForBatch: vi.fn(() => [mobileMoneyFarmer]),
      groupFarmersByDayAndSession: vi.fn(() => []),
      updateBatchStatus: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BatchFarmersComponent],
      providers: [
        { provide: PaymentService, useValue: fakePaymentService },
        { provide: PaymentBatchService, useValue: fakePaymentBatchService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'BATCH-001' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchFarmersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults a Mobile Money farmer to the MTN channel', () => {
    expect(component.channelFor('F-001')).toBe('MTN');
  });

  it('calls checkPendingPayouts on init to resume any in-flight disbursement', () => {
    expect(fakePaymentService.checkPendingPayouts).toHaveBeenCalledWith('BATCH-001');
  });

  it('disables the disburse action immediately on click, before any transaction exists', () => {
    expect(component.isSubmitting).toBe(false);

    component.disburseBatch();

    expect(component.isSubmitting).toBe(true);
    expect(fakePaymentService.disburseBatch).toHaveBeenCalledWith('BATCH-001', [
      { ...mobileMoneyFarmer, payoutChannel: 'MTN' },
    ]);
  });

  it('does not re-disburse a farmer that already has a transaction', () => {
    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN',
      amount: 450000,
      status: 'INITIATED',
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    component.disburseBatch();

    expect(fakePaymentService.disburseBatch).toHaveBeenCalledWith('BATCH-001', []);
  });

  it('marks the batch Disbursed once every eligible farmer settles', () => {
    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN',
      amount: 450000,
      status: 'SETTLED',
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    expect(fakePaymentBatchService.updateBatchStatus).toHaveBeenCalledWith('BATCH-001', 'Disbursed');
  });

  it('does not mark the batch Disbursed while a farmer has failed and not yet retried', () => {
    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN',
      amount: 450000,
      status: 'FAILED_REVERSED',
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    expect(fakePaymentBatchService.updateBatchStatus).not.toHaveBeenCalled();
    expect(component.hasFailures).toBe(true);
  });

  it('only allows retry when a farmer is FAILED_REVERSED or TIER_LIMIT_EXCEEDED', () => {
    expect(component.canRetry('F-001')).toBe(false); // no transaction yet

    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN',
      amount: 450000,
      status: 'TIER_LIMIT_EXCEEDED',
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    expect(component.canRetry('F-001')).toBe(true);

    component.retry(mobileMoneyFarmer);
    expect(fakePaymentService.retryFarmer).toHaveBeenCalledWith('BATCH-001', mobileMoneyFarmer, 'MTN');
  });

  it('ignores a SETTLED transaction that belongs to a different batch (same farmer)', () => {
    // Simulates the singleton PaymentService still holding a farmer's
    // transaction from an earlier, different batch (e.g. F-001 was already
    // paid out under BATCH-999 in this session). BATCH-001 must treat this
    // farmer as having no transaction yet, and must NOT auto-complete itself.
    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-999',
      farmerId: 'F-001',
      batchId: 'BATCH-999',
      channel: 'MTN',
      amount: 450000,
      status: 'SETTLED',
      idempotencyKey: 'idem-999',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    expect(component.transactionFor('F-001')).toBeUndefined();
    expect(fakePaymentBatchService.updateBatchStatus).not.toHaveBeenCalledWith('BATCH-001', 'Disbursed');
  });

  it('keeps the channel dropdown editable on retry-eligible failures (TIER_LIMIT_EXCEEDED)', () => {
    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN',
      amount: 450000,
      status: 'TIER_LIMIT_EXCEEDED',
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    // dayGroups (and therefore the channel <select> in the template) is
    // driven entirely by groupFarmersByDayAndSession, which this spec file's
    // fake service always stubs to return [] — so the DOM-level assertion
    // lives at the template-binding source: isChannelLocked() is exactly
    // what [disabled] is bound to (see batch-farmers.component.html).
    expect(component.isChannelLocked('F-001')).toBe(false);
  });

  it('keeps the channel dropdown editable on retry-eligible failures (FAILED_REVERSED)', () => {
    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN',
      amount: 450000,
      status: 'FAILED_REVERSED',
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    expect(component.isChannelLocked('F-001')).toBe(false);
  });

  it('locks the channel dropdown while a transaction is genuinely in flight or settled', () => {
    const base = {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN' as const,
      amount: 450000,
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    };

    for (const status of ['INITIATED', 'VALIDATING', 'FUNDS_LOCKED', 'CHANNEL_PROCESSING', 'SETTLED'] as const) {
      transactionsSubject.next(new Map([['F-001', { ...base, status }]]));
      fixture.detectChanges();
      expect(component.isChannelLocked('F-001')).toBe(true);
    }
  });

  it('resets isSubmitting back to false once every disbursed farmer has a tracked transaction', () => {
    expect(component.isSubmitting).toBe(false);

    component.disburseBatch();
    expect(component.isSubmitting).toBe(true);

    // Simulates the transaction PaymentService seeds synchronously (INITIATED)
    // reaching the component via watchTransactions().
    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN',
      amount: 450000,
      status: 'INITIATED',
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    expect(component.isSubmitting).toBe(false);
  });

  it('resets isSubmitting immediately when there is nothing left to disburse', () => {
    // Every eligible farmer already has a transaction — disburseBatch() has
    // nothing new to send, so there is no transactions$ emission to react to.
    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN',
      amount: 450000,
      status: 'SETTLED',
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    component.disburseBatch();

    expect(component.isSubmitting).toBe(false);
  });

  it('renders the partial-failure banner in the DOM when a farmer has failed', () => {
    transactionsSubject.next(new Map([['F-001', {
      transactionId: 'TXN-001',
      farmerId: 'F-001',
      batchId: 'BATCH-001',
      channel: 'MTN',
      amount: 450000,
      status: 'FAILED_REVERSED',
      idempotencyKey: 'idem-1',
      createdAt: new Date(),
    }]]));
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('app-alert'))).toBeTruthy();
  });
});

describe('BatchFarmersComponent — session filtering', () => {
  let fixture: ComponentFixture<BatchFarmersComponent>;
  let component: BatchFarmersComponent;

  const morningFarmer: FarmerRecord = { ...mobileMoneyFarmer, farmerId: 'F-001', session: 'morning' };
  const middayFarmer: FarmerRecord = { ...mobileMoneyFarmer, farmerId: 'F-002', session: 'midday' };
  const unassignedFarmer: FarmerRecord = { ...mobileMoneyFarmer, farmerId: 'F-003', session: undefined };

  beforeEach(async () => {
    const fakePaymentService = {
      watchTransactions: vi.fn(() => new Subject().asObservable()),
      disburseBatch: vi.fn(),
      retryFarmer: vi.fn(),
      checkPendingPayouts: vi.fn(() => of([])),
    };
    const fakePaymentBatchService = {
      getAllFarmers: vi.fn(() => of([morningFarmer, middayFarmer, unassignedFarmer])),
      getBatchById: vi.fn(() => batch),
      getFarmersForBatch: vi.fn(() => [morningFarmer, middayFarmer, unassignedFarmer]),
      groupFarmersByDayAndSession: vi.fn(() => []),
      updateBatchStatus: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BatchFarmersComponent],
      providers: [
        { provide: PaymentService, useValue: fakePaymentService },
        { provide: PaymentBatchService, useValue: fakePaymentBatchService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'BATCH-001' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchFarmersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to showing every farmer regardless of session', () => {
    expect(component.filteredFarmers.map(f => f.farmerId).sort()).toEqual(['F-001', 'F-002', 'F-003']);
  });

  it('narrows to only the selected session', () => {
    component.setSessionFilter('midday');
    expect(component.filteredFarmers.map(f => f.farmerId)).toEqual(['F-002']);
  });

  it('filters to farmers with no recorded session via the "unassigned" bucket', () => {
    component.setSessionFilter('unassigned');
    expect(component.filteredFarmers.map(f => f.farmerId)).toEqual(['F-003']);
  });

  it('returns to showing everyone when switching back to All', () => {
    component.setSessionFilter('midday');
    component.setSessionFilter('');
    expect(component.filteredFarmers.length).toBe(3);
  });
});
