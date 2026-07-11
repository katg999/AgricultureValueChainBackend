import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PaymentService } from './payment.service';
import { FarmerRecord, PayoutTransaction } from '../models/batch.models';

// zone.js only auto-forks the "ProxyZone" fakeAsync() needs via its Jasmine/Mocha
// integration patches (zone-testing.js) — this repo's specs run under Vitest, which
// zone.js has no patch for, so nothing forks that zone for us. Fork it by hand here;
// this is exactly what the Jasmine patch would have done around each `it`.
declare const Zone: any;
function fakeAsyncTest(fn: () => void): () => void {
  return () => Zone.current.fork(new Zone['ProxyZoneSpec']()).run(() => fakeAsync(fn)());
}

const farmer: FarmerRecord = {
  farmerId: 'F-001',
  fullName: 'Okello James',
  commodity: 'Coffee',
  branch: 'Mbale West',
  branchId: 'BR-MBL',
  deliveryDate: '2024-09-15',
  paymentMethod: 'Mobile Money',
  netPayable: 450000.6,
  hasBankDetails: true,
  status: 'Active',
  bankAccount: '9876100001',
  bankCode: 'STBK',
};

describe('PaymentService (mock mode — USE_MOCK is true by default)', () => {
  let service: PaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentService);
  });

  function currentTransactions(): Map<string, PayoutTransaction> {
    let value!: Map<string, PayoutTransaction>;
    service.watchTransactions().subscribe(v => (value = v));
    return value;
  }

  it('seeds an INITIATED transaction immediately with a rounded whole-number amount', () => {
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);

    const txn = currentTransactions().get('F-001')!;
    expect(txn.status).toBe('INITIATED');
    expect(txn.amount).toBe(450001); // Math.round(450000.6)
    expect(Number.isInteger(txn.amount)).toBe(true);
  });

  it('generates a unique idempotency key per disbursement attempt', () => {
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);
    const first = currentTransactions().get('F-001')!.idempotencyKey;

    service.retryFarmer('BATCH-001', farmer, 'MTN');
    const second = currentTransactions().get('F-001')!.idempotencyKey;

    expect(first).not.toBe(second);
  });

  it('progresses a mock transaction through VALIDATING and CHANNEL_PROCESSING to a terminal state, using timers not setTimeout', fakeAsyncTest(() => {
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);

    tick(800);
    expect(currentTransactions().get('F-001')!.status).toBe('VALIDATING');

    tick(800); // 1600ms elapsed
    expect(currentTransactions().get('F-001')!.status).toBe('CHANNEL_PROCESSING');

    tick(800); // 2400ms elapsed
    const finalStatus = currentTransactions().get('F-001')!.status;
    expect(['SETTLED', 'FAILED_REVERSED']).toContain(finalStatus);
  }));

  it('does not resume any pending payouts in mock mode (in-memory state does not survive a refresh)', () => {
    let rows: PayoutTransaction[] | undefined;
    service.checkPendingPayouts('BATCH-001').subscribe(r => (rows = r));
    expect(rows).toEqual([]);
  });

  it('cancels a prior in-flight attempt\'s timers on retry, so the old attempt cannot clobber the retry with stale state', fakeAsyncTest(() => {
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);
    const firstKey = currentTransactions().get('F-001')!.idempotencyKey;

    // Retry mid-flight, before the first attempt's VALIDATING timer (800ms) fires.
    tick(500);
    service.retryFarmer('BATCH-001', farmer, 'MTN');
    const retryKey = currentTransactions().get('F-001')!.idempotencyKey;
    expect(retryKey).not.toBe(firstKey);
    expect(currentTransactions().get('F-001')!.status).toBe('INITIATED');

    // Advance to absolute t=800 — the *first* attempt's VALIDATING timer would
    // fire here if it hadn't been cancelled. If the race weren't fixed, this
    // would overwrite the retry's transaction with the first attempt's step.
    tick(300);
    const afterOldFirstStep = currentTransactions().get('F-001')!;
    expect(afterOldFirstStep.idempotencyKey).toBe(retryKey);
    expect(afterOldFirstStep.status).toBe('INITIATED');

    // Advance to absolute t=1300 — the retry's own VALIDATING timer (800ms
    // after the retry call at t=500) fires here.
    tick(500);
    const afterRetryFirstStep = currentTransactions().get('F-001')!;
    expect(afterRetryFirstStep.idempotencyKey).toBe(retryKey);
    expect(afterRetryFirstStep.status).toBe('VALIDATING');

    // Advance to absolute t=2100 — the *first* attempt's terminal timer
    // (2400ms after its own t=0 call) would fire here if not cancelled; the
    // retry's CHANNEL_PROCESSING (1600ms after t=500) fires here instead.
    tick(800);
    const afterOldTerminalWindow = currentTransactions().get('F-001')!;
    expect(afterOldTerminalWindow.idempotencyKey).toBe(retryKey);
    expect(afterOldTerminalWindow.status).toBe('CHANNEL_PROCESSING');

    // Advance to absolute t=2900 — the retry's own terminal timer fires.
    tick(800);
    const final = currentTransactions().get('F-001')!;
    expect(final.idempotencyKey).toBe(retryKey);
    expect(['SETTLED', 'FAILED_REVERSED']).toContain(final.status);
  }));
});
