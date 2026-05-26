import { Injectable } from '@angular/core';

export type FarmerStatus = 'Active' | 'Pending' | 'Rejected' | 'Suspended';
export type OnboardingStepStatus = 'done' | 'progress' | 'pending';
export type RecoveryStatus = 'settled' | 'partial' | 'overdue';
export type BadgeVariant =
  | 'active'
  | 'pending'
  | 'inactive'
  | 'suspended'
  | 'overdue'
  | 'settled'
  | 'partial'
  | 'verified'
  | 'failed'
  | 'draft'
  | 'open'
  | 'closed'
  | 'healthy'
  | 'low'
  | 'info';

export interface ProductionDetails {
  coffee: boolean;
  maize: boolean;
  cocoa: boolean;
  vanilla: boolean;
  cattle: number;
  goats: number;
  poultry: number;
}

export interface FarmerRegistrationForm {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationalIdNumber: string;
  gender: string;
  photoPreviewUrl: string;
  farmLocation: string;
  village: string;
  gpsCoordinates: string;
  totalLandArea: number | null;
  irrigationSource: string;
  landOwnershipType: string;
  production: ProductionDetails;
  cooperativeGroup: string;
  assignedBranch: string;
}

export interface OnboardingStep {
  label: string;
  sub: string;
  status: OnboardingStepStatus;
}

export interface FarmerProfile {
  id: string;
  region: string;
  totalDeliveries: number;
  primaryCrop: string;
  pendingReview: boolean;
  status: FarmerStatus;
  stage: string;
  outstandingBalance: number;
  fullName: string;
  role: string;
  photoUrl: string;
  phoneNumber: string;
  emailAddress: string;
  gender: string;
  farmLocation: string;
  village: string;
  dateOfBirth: string;
  primaryLanguage: string;
  emergencyContact: string;
  nationalIdNumber: string;
  farm: {
    gpsCoordinates: string;
    totalLandArea: number;
    irrigationSource: string;
    landOwnershipType: string;
    primaryCrops: string[];
    livestock: string[];
  };
  registration: {
    assignedBranch: string;
    collectionCentre: string;
    dateRegistered: string;
    registeredBy: string;
  };
  onboardingSteps: OnboardingStep[];
  groupCredit: {
    cooperativeGroup: string;
    groupLeader: string;
    creditLimit: number;
    creditScore: number;
    scoreLabel: string;
    saccoName: string;
  };
}

export interface FarmerListItem {
  id: string;
  name: string;
  branch: string;
  primaryCommodity: string;
  creditLimit: string;
  balance: string;
  status: FarmerStatus;
  stage: string;
}

@Injectable({
  providedIn: 'root',
})
export class FarmerService {
  private farmers: FarmerProfile[] = [
    this.createSeedProfile({
      id: 'FRM-001',
      fullName: 'Amina Nakato',
      branch: 'Kampala Central',
      region: 'Central Region',
      village: 'Kawaala',
      primaryCrop: 'Maize',
      status: 'Active',
      stage: 'Financed',
      creditLimit: 2500000,
      balance: 450000,
    }),
    this.createSeedProfile({
      id: 'FRM-002',
      fullName: 'Peter Okello',
      branch: 'Gulu North',
      region: 'Northern Region',
      village: 'Laroo',
      primaryCrop: 'Coffee',
      status: 'Active',
      stage: 'Verified',
      creditLimit: 1800000,
      balance: 0,
    }),
    this.createSeedProfile({
      id: 'FRM-003',
      fullName: 'Sarah Namubiru',
      branch: 'Kasese Central',
      region: 'Western Region',
      village: 'Kiwanga',
      primaryCrop: 'Coffee',
      status: 'Pending',
      stage: 'Registered',
      creditLimit: 0,
      balance: 490000,
    }),
    this.createSeedProfile({
      id: 'FRM-004',
      fullName: 'Joseph Kato',
      branch: 'Masaka East',
      region: 'Central Region',
      village: 'Nyendo',
      primaryCrop: 'Rice',
      status: 'Suspended',
      stage: 'Verified',
      creditLimit: 1250000,
      balance: 120000,
    }),
  ];

  list(): FarmerListItem[] {
    return this.farmers.map(farmer => this.toListItem(farmer));
  }

  getById(id: string): FarmerProfile | undefined {
    const farmer = this.farmers.find(item => item.id === id);
    return farmer ? this.cloneProfile(farmer) : undefined;
  }

  create(form: FarmerRegistrationForm): FarmerProfile {
    const id = `FRM-${String(this.farmers.length + 1).padStart(3, '0')}`;
    const profile: FarmerProfile = {
      id,
      region: form.farmLocation,
      totalDeliveries: 0,
      primaryCrop: this.primaryCropFromProduction(form.production),
      pendingReview: true,
      status: 'Pending',
      stage: 'Registered',
      outstandingBalance: 0,
      fullName: form.fullName,
      role: `Registered Farmer - ${form.cooperativeGroup}`,
      photoUrl: form.photoPreviewUrl || 'assets/images/farmer-kato.jpg',
      phoneNumber: form.phoneNumber,
      emailAddress: form.emailAddress,
      gender: form.gender,
      farmLocation: form.farmLocation,
      village: form.village,
      dateOfBirth: form.dateOfBirth,
      primaryLanguage: 'English',
      emergencyContact: 'Not captured',
      nationalIdNumber: form.nationalIdNumber,
      farm: {
        gpsCoordinates: form.gpsCoordinates || '0.3476 N, 32.5825 E',
        totalLandArea: form.totalLandArea ?? 0,
        irrigationSource: form.irrigationSource,
        landOwnershipType: form.landOwnershipType,
        primaryCrops: this.cropsFromProduction(form.production),
        livestock: this.livestockFromProduction(form.production),
      },
      registration: {
        assignedBranch: form.assignedBranch,
        collectionCentre: form.cooperativeGroup,
        dateRegistered: this.todayLabel(),
        registeredBy: 'Portal User',
      },
      onboardingSteps: [
        { label: 'Pre-registration', sub: 'Completed today', status: 'done' },
        { label: 'KYC verification', sub: 'National ID and photo captured', status: 'done' },
        { label: 'Full profile setup', sub: 'Personal and farm details completed', status: 'done' },
        { label: 'Farm verification', sub: 'Site visit pending', status: 'progress' },
        { label: 'Group assignment', sub: 'Cooperative selected', status: 'done' },
        { label: 'Credit eligibility', sub: 'Initial score pending', status: 'pending' },
        { label: 'Final activation', sub: 'Awaiting approval', status: 'pending' },
      ],
      groupCredit: {
        cooperativeGroup: form.cooperativeGroup,
        groupLeader: 'Not assigned',
        creditLimit: 0,
        creditScore: 720,
        scoreLabel: 'ESTIMATED INITIAL SCORE',
        saccoName: `${form.assignedBranch} Farmers SACCO`,
      },
    };

    this.farmers = [...this.farmers, profile];
    return this.cloneProfile(profile);
  }

  approve(id: string): FarmerProfile | undefined {
    return this.updateStatus(id, 'Active', false, 'Verified');
  }

  reject(id: string): FarmerProfile | undefined {
    return this.updateStatus(id, 'Rejected', false, 'Registered');
  }

  private updateStatus(
    id: string,
    status: FarmerStatus,
    pendingReview: boolean,
    stage: string,
  ): FarmerProfile | undefined {
    const farmer = this.farmers.find(item => item.id === id);
    if (!farmer) return undefined;

    farmer.status = status;
    farmer.pendingReview = pendingReview;
    farmer.stage = stage;
    return this.cloneProfile(farmer);
  }

  private createSeedProfile(seed: {
    id: string;
    fullName: string;
    branch: string;
    region: string;
    village: string;
    primaryCrop: string;
    status: FarmerStatus;
    stage: string;
    creditLimit: number;
    balance: number;
  }): FarmerProfile {
    const isCanonical = seed.id === 'FRM-003';

    return {
      id: seed.id,
      region: seed.region,
      totalDeliveries: isCanonical ? 0 : 48.25,
      primaryCrop: seed.primaryCrop,
      pendingReview: seed.status === 'Pending',
      status: seed.status,
      stage: seed.stage,
      outstandingBalance: seed.balance,
      fullName: seed.fullName,
      role: `Registered Farmer - ${isCanonical ? 'Kasese Coffee Growers Union' : seed.branch}`,
      photoUrl: 'assets/images/farmer-kato.jpg',
      phoneNumber: isCanonical ? '+256 700 000000' : '+256 772 000000',
      emailAddress: isCanonical ? 'sarah.n@emtech.co.ug' : 'farmer@emtech.co.ug',
      gender: isCanonical ? 'Female' : 'Male',
      farmLocation: seed.region,
      village: seed.village,
      dateOfBirth: isCanonical ? '1990-08-14' : '1988-03-10',
      primaryLanguage: 'English, Luganda',
      emergencyContact: 'Kiza Katushabe (Brother) - +256 772 111111',
      nationalIdNumber: isCanonical ? 'CF90081412345' : 'CM88031012345',
      farm: {
        gpsCoordinates: '0.3476 N, 32.5825 E',
        totalLandArea: isCanonical ? 5.5 : 3.2,
        irrigationSource: 'Rain-fed',
        landOwnershipType: 'Owned',
        primaryCrops: isCanonical ? ['Coffee', 'Maize', 'Vanilla'] : [seed.primaryCrop],
        livestock: isCanonical ? ['Cattle (4)', 'Goats (12)', 'Poultry (45)'] : ['Goats (6)'],
      },
      registration: {
        assignedBranch: seed.branch,
        collectionCentre: isCanonical ? 'Kasese Coffee Growers Union' : `${seed.branch} Collection Centre`,
        dateRegistered: '12 Jan 2024',
        registeredBy: 'Agatha Mukasa',
      },
      onboardingSteps: [
        { label: 'Pre-registration', sub: 'Completed on Jan 12', status: 'done' },
        { label: 'KYC verification', sub: 'National ID and photo captured', status: 'done' },
        { label: 'Full profile setup', sub: 'Personal and farm details completed', status: 'done' },
        { label: 'Farm verification', sub: 'Site visit pending', status: 'progress' },
        { label: 'Group assignment', sub: 'Cooperative selected', status: 'done' },
        { label: 'Credit eligibility', sub: 'Initial score estimated', status: 'progress' },
        { label: 'Final activation', sub: 'Awaiting approval', status: seed.status === 'Pending' ? 'pending' : 'done' },
      ],
      groupCredit: {
        cooperativeGroup: isCanonical ? 'Kasese Coffee Growers Union' : `${seed.branch} Farmers Group`,
        groupLeader: 'Steven Okelio',
        creditLimit: seed.creditLimit,
        creditScore: 720,
        scoreLabel: 'ESTIMATED INITIAL SCORE',
        saccoName: `${seed.branch} Farmers SACCO`,
      },
    };
  }

  private toListItem(farmer: FarmerProfile): FarmerListItem {
    return {
      id: farmer.id,
      name: farmer.fullName,
      branch: farmer.registration.assignedBranch,
      primaryCommodity: farmer.primaryCrop,
      creditLimit: `UGX ${farmer.groupCredit.creditLimit.toLocaleString('en-US')}`,
      balance: farmer.outstandingBalance > 0 ? farmer.outstandingBalance.toLocaleString('en-US') : '0.00',
      status: farmer.status,
      stage: farmer.stage,
    };
  }

  private cloneProfile(profile: FarmerProfile): FarmerProfile {
    return {
      ...profile,
      farm: {
        ...profile.farm,
        primaryCrops: [...profile.farm.primaryCrops],
        livestock: [...profile.farm.livestock],
      },
      registration: { ...profile.registration },
      onboardingSteps: profile.onboardingSteps.map(step => ({ ...step })),
      groupCredit: { ...profile.groupCredit },
    };
  }

  private primaryCropFromProduction(production: ProductionDetails): string {
    return this.cropsFromProduction(production)[0] ?? 'Unassigned';
  }

  private cropsFromProduction(production: ProductionDetails): string[] {
    const crops = [
      production.coffee ? 'Coffee' : '',
      production.maize ? 'Maize' : '',
      production.cocoa ? 'Cocoa' : '',
      production.vanilla ? 'Vanilla' : '',
    ].filter(Boolean);

    return crops.length ? crops : ['Unassigned'];
  }

  private livestockFromProduction(production: ProductionDetails): string[] {
    return [
      production.cattle ? `Cattle (${production.cattle})` : '',
      production.goats ? `Goats (${production.goats})` : '',
      production.poultry ? `Poultry (${production.poultry})` : '',
    ].filter(Boolean);
  }

  private todayLabel(): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }
}
