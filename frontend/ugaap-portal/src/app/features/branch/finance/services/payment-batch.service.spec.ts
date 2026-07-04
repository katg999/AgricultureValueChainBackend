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
