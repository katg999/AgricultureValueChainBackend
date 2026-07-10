import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { BranchFarmerListComponent } from './branch.farmer-list.component';
import { FarmerService, FarmerListItem } from '../../../shared-farmer-domain/farmer.service';
import { BranchDashboardService } from '../../../../core/services/branch-dashboard.service';

const farmers: FarmerListItem[] = [
  { id: 'F-101', name: 'Okello James', branch: 'Mbale West', primaryCommodity: 'Coffee', creditLimit: '0', balance: '0.00', status: 'Pending', stage: 'Review' },
  { id: 'F-102', name: 'Namatovu Joyce', branch: 'Mbale West', primaryCommodity: 'Coffee', creditLimit: '0', balance: '0.00', status: 'Active', stage: 'Active' },
  { id: 'F-103', name: 'Okot David', branch: 'Mbale West', primaryCommodity: 'Maize', creditLimit: '0', balance: '0.00', status: 'Rejected', stage: 'Closed' },
];

describe('BranchFarmerListComponent — status tabs', () => {
  let fixture: ComponentFixture<BranchFarmerListComponent>;
  let component: BranchFarmerListComponent;

  beforeEach(() => {
    const fakeFarmerService = {
      watchForBranch: vi.fn(() => of(farmers)),
      listForBranch: vi.fn(() => of(farmers)),
    };
    const fakeBranchDash = { getFarmersStats: vi.fn(() => of({ collectionProgress: 0 })) };

    TestBed.configureTestingModule({
      imports: [BranchFarmerListComponent],
      providers: [
        provideRouter([]),
        { provide: FarmerService, useValue: fakeFarmerService },
        { provide: BranchDashboardService, useValue: fakeBranchDash },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    });

    fixture = TestBed.createComponent(BranchFarmerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows every farmer when the "All" tab (empty value) is selected', () => {
    component.setStatusFilter('');
    let rows: FarmerListItem[] = [];
    component.filteredFarmers$.subscribe(r => (rows = r));
    expect(rows.length).toBe(3);
  });

  it('filters to only Pending farmers when the Pending tab is selected', () => {
    component.setStatusFilter('Pending');
    let rows: FarmerListItem[] = [];
    component.filteredFarmers$.subscribe(r => (rows = r));
    expect(rows.map(r => r.id)).toEqual(['F-101']);
  });

  it('filters to only Rejected farmers when the Rejected tab is selected', () => {
    component.setStatusFilter('Rejected');
    let rows: FarmerListItem[] = [];
    component.filteredFarmers$.subscribe(r => (rows = r));
    expect(rows.map(r => r.id)).toEqual(['F-103']);
  });

  it('combines the status tab with the existing search term', () => {
    component.setStatusFilter('Active');
    component.searchQuery = 'joyce';
    component.applyFilter();
    let rows: FarmerListItem[] = [];
    component.filteredFarmers$.subscribe(r => (rows = r));
    expect(rows.map(r => r.id)).toEqual(['F-102']);
  });
});
