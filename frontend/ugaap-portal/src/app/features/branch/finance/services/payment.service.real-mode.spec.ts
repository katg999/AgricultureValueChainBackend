// NOTE: this whole suite is describe.skip()-ed — see the block comment below
// the imports for why. Left in place (not deleted) so the exact scenario is
// documented and ready to re-enable the moment either workaround lands.
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe } from 'vitest'; // explicit import — ambient `describe` resolves to the
// jasmine typings (no .skip) because tsconfig.spec.json's "types" lists jasmine
// alongside vitest/globals; importing directly from 'vitest' gets the real one.

// zone.js only auto-forks the "ProxyZone" fakeAsync() needs via its Jasmine/Mocha
// integration patches (zone-testing.js) — this repo's specs run under Vitest, which
// zone.js has no patch for, so nothing forks that zone for us. Fork it by hand here;
// this is exactly what the Jasmine patch would have done around each `it`. Applied
// here even though the suite is skipped, so un-skipping later isn't blocked by this
// too — see payment.service.mock-mode.spec.ts for the same pattern.
declare const Zone: any;
function fakeAsyncTest(fn: () => void): () => void {
  return () => Zone.current.fork(new Zone['ProxyZoneSpec']()).run(() => fakeAsync(fn)());
}

// vi.mock('../../../../core/mock/mock-config', () => ({ USE_MOCK: false }));
//
// BLOCKED: Angular's @angular/build:unit-test Vitest runner (v21.2.8, installed
// here) hard-blocks vi.mock()/vi.doMock() for any relative-path specifier —
// see node_modules/@angular/build/.../vitest/build-options.js, "mockPatchContents":
// it throws "The 'vi.mock' and related methods are not supported for relative
// imports with the Angular unit-test system. Please use Angular TestBed for
// mocking dependencies." synchronously, at module-evaluation time, for *any*
// path starting with '.' or '/' — before a single test in the file runs, so
// the whole suite fails to load, not just one test.
//
// Tried and ruled out (see task-2-report.md for detail):
//  - Absolute filesystem path (bypasses the '.'/'/' check on Windows, but not
//    portable — breaks on Linux/Mac CI where absolute paths start with '/').
//  - file:// URL via `new URL(spec, import.meta.url).href` (bypasses the
//    check, but silently mocks a module Vite never resolves the same way —
//    USE_MOCK stayed true, no error, no effect).
//  - Decoded pathname without protocol/leading slash — same silent no-op.
//  - A tsconfig.spec.json "paths" alias so the specifier isn't relative —
//    would very likely need to touch tsconfig.spec.json, which the task
//    brief for this file explicitly said not to touch (shared test-scoping
//    config, off limits without a separate decision).
// USE_MOCK is a plain exported const (not a DI token) in production code by
// design — introducing an InjectionToken seam so TestBed could override it
// would be a production-code change the task brief said shouldn't be needed,
// and would diverge from PaymentBatchService's identical USE_MOCK pattern.
//
// Net result: exercising the real-mode (USE_MOCK=false) HTTP/polling behavior
// needs either a decision to touch tsconfig.spec.json, a DI-token refactor of
// USE_MOCK, or a different mocking strategy — flagged for the task owner
// rather than guessed at further.

import { PaymentService } from './payment.service';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { FarmerRecord, PayoutTransaction } from '../models/batch.models';

const farmer: FarmerRecord = {
  farmerId: 'F-001',
  fullName: 'Okello James',
  commodity: 'Coffee',
  branch: 'Mbale West',
  branchId: 'BR-MBL',
  deliveryDate: '2024-09-15',
  paymentMethod: 'Mobile Money',
  netPayable: 450000,
  hasBankDetails: true,
  bankAccount: '9876100001',
  bankCode: 'STBK',
};

function makeTransaction(overrides: Partial<PayoutTransaction>): PayoutTransaction {
  return {
    transactionId: 'TXN-001',
    farmerId: 'F-001',
    batchId: 'BATCH-001',
    channel: 'MTN',
    amount: 450000,
    status: 'INITIATED',
    idempotencyKey: 'idem-001',
    createdAt: new Date(),
    ...overrides,
  };
}

describe.skip('PaymentService (real mode — USE_MOCK forced false)', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POSTs the idempotency key and channel, then starts polling on success', fakeAsyncTest(() => {
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);

    const postReq = httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUTS);
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body.farmerId).toBe('F-001');
    expect(postReq.request.body.channel).toBe('MTN');
    expect(postReq.request.body.amount).toBe(450000);
    expect(typeof postReq.request.body.idempotencyKey).toBe('string');
    postReq.flush(makeTransaction({ status: 'VALIDATING' }));

    tick(2000); // first poll tick
    const pollReq = httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUT_BY_ID('TXN-001'));
    expect(pollReq.request.method).toBe('GET');
    pollReq.flush(makeTransaction({ status: 'SETTLED' }));

    let latest: PayoutTransaction | undefined;
    service.watchTransactions().subscribe(m => (latest = m.get('F-001')));
    expect(latest!.status).toBe('SETTLED');

    tick(2000); // confirm polling stopped — no further request pending
    httpMock.expectNone(API_ENDPOINTS.BRANCH.PAYOUT_BY_ID('TXN-001'));
  }));

  it('stops polling once TIER_LIMIT_EXCEEDED is returned', fakeAsyncTest(() => {
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);
    httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUTS).flush(makeTransaction({ status: 'VALIDATING' }));

    tick(2000);
    httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUT_BY_ID('TXN-001'))
      .flush(makeTransaction({ status: 'TIER_LIMIT_EXCEEDED' }));

    tick(2000);
    httpMock.expectNone(API_ENDPOINTS.BRANCH.PAYOUT_BY_ID('TXN-001'));
  }));

  it('resumes polling for pending payouts returned by checkPendingPayouts', fakeAsyncTest(() => {
    service.checkPendingPayouts('BATCH-001').subscribe();

    httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUTS_PENDING('BATCH-001'))
      .flush([makeTransaction({ status: 'CHANNEL_PROCESSING' })]);

    tick(2000);
    httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUT_BY_ID('TXN-001')).flush(makeTransaction({ status: 'SETTLED' }));

    let latest: PayoutTransaction | undefined;
    service.watchTransactions().subscribe(m => (latest = m.get('F-001')));
    expect(latest!.status).toBe('SETTLED');
  }));

  it('cancels the prior attempt\'s in-flight POST on retry, so its stale response cannot clobber the retry or start an orphaned poll', fakeAsyncTest(() => {
    // First attempt — its POST is issued but deliberately left unflushed, to
    // simulate it still being in flight (up to 5s via timeout(5000)) when the
    // retry below fires.
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);
    const firstPostReq = httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUTS);
    const firstKey = firstPostReq.request.body.idempotencyKey;

    // Retry before the first POST resolves — cancelInFlightTracking should
    // unsubscribe from firstPostReq's still-pending subscription so its
    // eventual response is discarded rather than acted on.
    service.retryFarmer('BATCH-001', farmer, 'MTN');
    const retryPostReq = httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUTS);
    const retryKey = retryPostReq.request.body.idempotencyKey;
    expect(retryKey).not.toBe(firstKey);

    // Proof the retry actually unsubscribed from the first attempt's POST:
    // Angular's HttpTestingController flips a request to `cancelled` the
    // moment its underlying subscription is torn down, and — deliberately —
    // refuses to flush a cancelled request at all (it models a genuinely
    // aborted XHR, which can never deliver a response). Were the bug still
    // present (no postSubscriptions tracking), this request would still be
    // live: `.cancelled` would be false and `.flush()` below would succeed,
    // letting the stale response reach the old subscribe callback.
    expect(firstPostReq.cancelled).toBe(true);
    expect(() => firstPostReq.flush(makeTransaction({
      transactionId: 'TXN-STALE',
      idempotencyKey: firstKey,
      status: 'VALIDATING',
    }))).toThrow();

    let latest: PayoutTransaction | undefined;
    service.watchTransactions().subscribe(m => (latest = m.get('F-001')));
    // Still the retry's own placeholder transaction (transactionId defaults
    // to its idempotencyKey until the backend responds) — not the stale one.
    expect(latest!.idempotencyKey).toBe(retryKey);
    expect(latest!.transactionId).not.toBe('TXN-STALE');

    tick(2000); // if the stale POST had somehow started polling, this is when it'd fire
    httpMock.expectNone(API_ENDPOINTS.BRANCH.PAYOUT_BY_ID('TXN-STALE'));

    // Resolve the retry's own POST (terminal status, so no periodic poll
    // timer is left running when the fakeAsync zone tears down) so
    // afterEach's httpMock.verify() has nothing left open.
    retryPostReq.flush(makeTransaction({ idempotencyKey: retryKey, status: 'SETTLED' }));
  }));

  it('removes the local INITIATED placeholder when the initial POST never returns, instead of leaving the farmer stuck', fakeAsyncTest(() => {
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);

    // Sanity check on the documented "seeded before the POST is even sent"
    // behavior — the placeholder exists synchronously, before the request
    // below is ever flushed.
    let beforeFailure: PayoutTransaction | undefined;
    service.watchTransactions().subscribe(m => (beforeFailure = m.get('F-001')));
    expect(beforeFailure!.status).toBe('INITIATED');

    const postReq = httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUTS);
    postReq.error(new ProgressEvent('network error')); // simulates the POST never resolving successfully

    let afterFailure: PayoutTransaction | undefined;
    service.watchTransactions().subscribe(m => (afterFailure = m.get('F-001')));
    expect(afterFailure).toBeUndefined();

    // No poll should ever have started for a transaction that never got a
    // real transactionId back.
    tick(2000);
    httpMock.expectNone(API_ENDPOINTS.BRANCH.PAYOUT_BY_ID('TXN-001'));
  }));

  it('lets the next disburseBatch call retry a farmer whose prior POST never returned', fakeAsyncTest(() => {
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);
    httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUTS).error(new ProgressEvent('network error'));

    // Component-side filtering (transactionFor() undefined) would now include
    // this farmer again on the next Disburse Batch click — simulate that here
    // directly against the service.
    service.disburseBatch('BATCH-001', [{ ...farmer, payoutChannel: 'MTN' }]);

    let latest: PayoutTransaction | undefined;
    service.watchTransactions().subscribe(m => (latest = m.get('F-001')));
    expect(latest!.status).toBe('INITIATED');

    httpMock.expectOne(API_ENDPOINTS.BRANCH.PAYOUTS).flush(makeTransaction({ status: 'SETTLED' }));
  }));
});
