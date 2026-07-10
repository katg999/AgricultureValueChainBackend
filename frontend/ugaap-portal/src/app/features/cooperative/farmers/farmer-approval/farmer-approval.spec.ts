import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { FarmerApprovalComponent } from './farmer-approval.component';
import { FarmerService, FarmerProfile } from '../../../shared-farmer-domain/farmer.service';
import { PermissionsService } from '../../../../core/services/permissions.service';

const farmer: FarmerProfile = {
  id: 'F-101',
  region: 'Eastern',
  totalDeliveries: 12,
  primaryCrop: 'Coffee',
  pendingReview: true,
  status: 'Pending',
  stage: 'Review',
  outstandingBalance: 0,
  fullName: 'Okello James',
  role: 'Farmer',
  photoUrl: '',
  phoneNumber: '0700000000',
  emailAddress: 'okello@example.com',
  gender: 'Male',
  farmLocation: 'Mbale',
  village: 'Bumbo',
  dateOfBirth: '1990-01-01',
  primaryLanguage: 'English',
  emergencyContact: '0700000001',
  nationalIdNumber: 'CM000000',
  farm: {
    gpsCoordinates: '1.0,34.0',
    totalLandArea: 2,
    irrigationSource: 'Rain-fed',
    landOwnershipType: 'Owned',
    primaryCrops: ['Coffee'],
    livestock: [],
  },
  registration: {
    assignedBranch: 'Mbale West',
    collectionCentre: 'Bumbo Centre',
    dateRegistered: '2024-09-01',
    registeredBy: 'Field Agent A',
  },
  onboardingSteps: [],
  groupCredit: {
    cooperativeGroup: 'Bugisu Coffee Farmers',
    groupLeader: 'Group Leader A',
    creditLimit: 0,
    creditScore: 0,
    scoreLabel: '',
    saccoName: '',
  },
};

function setup(options: { url: string; canApprove: boolean }) {
  const fakeFarmerService = {
    getById: vi.fn(() => of(farmer)),
    approve: vi.fn(() => of({ ...farmer, status: 'Active' as const })),
    reject: vi.fn(() => of({ ...farmer, status: 'Rejected' as const })),
    getInputAllocations: vi.fn(() => of([])),
    getProduceDeliveries: vi.fn(() => of([])),
    getBalanceLines: vi.fn(() => of([])),
    getRepayments: vi.fn(() => of([])),
    getNotifications: vi.fn(() => of([])),
  };
  const fakePermissions = { has: vi.fn(() => options.canApprove) };

  TestBed.configureTestingModule({
    imports: [FarmerApprovalComponent],
    providers: [
      provideRouter([]),
      { provide: FarmerService, useValue: fakeFarmerService },
      { provide: PermissionsService, useValue: fakePermissions },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'F-101' } } } },
    ],
  });

  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  Object.defineProperty(router, 'url', { get: () => options.url, configurable: true });

  const fixture = TestBed.createComponent(FarmerApprovalComponent);
  fixture.detectChanges();
  return { fixture, fakeFarmerService, router };
}

describe('FarmerApprovalComponent — approval gate', () => {
  it('shows Approve/Reject when the user holds farmers.approve, on the branch route', () => {
    const { fixture } = setup({ url: '/branch/farmers/profile/F-101', canApprove: true });
    const approveBtn = fixture.debugElement.query(By.css('.identity-actions app-button[variant="primary"]'));
    expect(approveBtn).toBeTruthy();
  });

  it('hides Approve/Reject when the user lacks farmers.approve, even on the branch route', () => {
    const { fixture } = setup({ url: '/branch/farmers/profile/F-101', canApprove: false });
    const approveBtn = fixture.debugElement.query(By.css('.identity-actions app-button[variant="primary"]'));
    expect(approveBtn).toBeNull();
  });

  it('redirects to /branch/farmers after approving from a branch-prefixed URL', () => {
    const { fixture, router } = setup({ url: '/branch/farmers/profile/F-101', canApprove: true });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.onApprove();
    expect(router.navigate).toHaveBeenCalledWith(['/branch/farmers']);
  });

  it('redirects to /cooperative/farmers after approving from a cooperative-prefixed URL', () => {
    const { fixture, router } = setup({ url: '/cooperative/farmers/F-101', canApprove: true });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.onApprove();
    expect(router.navigate).toHaveBeenCalledWith(['/cooperative/farmers']);
  });
});
