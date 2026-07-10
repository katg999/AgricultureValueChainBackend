import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PaymentBatchService } from './payment-batch.service';
import { BatchFilterCriteria } from '../models/batch.models';

describe('PaymentBatchService — farmer onboarding-status eligibility', () => {
  let service: PaymentBatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(PaymentBatchService);
  });

  const coffeeCriteria: BatchFilterCriteria = {
    batchName: 'Test Batch',
    season: 'Season A 2024',
    openingDate: '2024-09-01',
    closingDate: '2024-09-30',
    commodityFilter: 'Coffee',
  };

  it('matchFarmers excludes a Pending farmer even though bank details are on file', () => {
    const { eligible, excluded } = service.matchFarmers(coffeeCriteria);
    expect(eligible.find(f => f.farmerId === 'F-013')).toBeUndefined();
    expect(excluded.find(f => f.farmerId === 'F-013')).toBeDefined();
  });

  it('matchFarmers still includes an Active farmer with bank details on file', () => {
    const { eligible } = service.matchFarmers(coffeeCriteria);
    expect(eligible.find(f => f.farmerId === 'F-001')).toBeDefined();
  });

  it('getFarmersForBatch excludes a Pending farmer from an existing batch (BATCH-001, BR-MBL)', () => {
    const farmers = service.getFarmersForBatch('BATCH-001');
    expect(farmers.find(f => f.farmerId === 'F-013')).toBeUndefined();
  });

  it('getFarmersForBatchAcrossBranches excludes a Rejected farmer from another branch (BATCH-003, BR-KAS)', () => {
    const farmers = service.getFarmersForBatchAcrossBranches('BATCH-003');
    expect(farmers.find(f => f.farmerId === 'F-011')).toBeUndefined();
  });
});

describe('PaymentBatchService — getBatchStatusCounts', () => {
  let service: PaymentBatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(PaymentBatchService);
  });

  it('counts BR-MBL batches correctly by status (BATCH-001 Approved, BATCH-002 Draft, BATCH-005 Disbursed)', () => {
    let counts!: Record<string, number>;
    service.getBatchStatusCounts().subscribe(c => (counts = c));

    expect(counts['Draft']).toBe(1);
    expect(counts['Approved']).toBe(1);
    expect(counts['Disbursed']).toBe(1);
  });

  it('returns 0, not undefined, for statuses with no matching batches in this branch', () => {
    let counts!: Record<string, number>;
    service.getBatchStatusCounts().subscribe(c => (counts = c));

    expect(counts['Pending Approval']).toBe(0);
  });

  it('never includes a Rejected key in the result', () => {
    let counts!: Record<string, number>;
    service.getBatchStatusCounts().subscribe(c => (counts = c));

    expect(Object.keys(counts).sort()).toEqual(['Approved', 'Disbursed', 'Draft', 'Pending Approval']);
  });
});
