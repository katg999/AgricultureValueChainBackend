import {
  FarmerListItem,
  FarmerProfile,
  FarmerStatus,
} from '../../core/models/farmer.model';

export const MOCK_FARMER_LIST: FarmerListItem[] = [
  {
    id: 'UG-F-01001',
    name: 'Amina Nakato',
    branchId: 'BR-KLA',
    branch: 'Kampala Central',
    primaryCommodity: 'Coffee',
    creditLimit: '1,500,000',
    balance: '720,000',
    status: 'Pending',
    stage: 'Registered',
  },
  {
    id: 'UG-F-01002',
    name: 'Moses Okello',
    branchId: 'BR-GUL',
    branch: 'Gulu Branch',
    primaryCommodity: 'Maize',
    creditLimit: '900,000',
    balance: '450,000',
    status: 'Pending',
    stage: 'Verified',
  },
  {
    id: 'UG-F-01003',
    name: 'Sarah Namutebi',
    branchId: 'BR-JIN',
    branch: 'Jinja Branch',
    primaryCommodity: 'Vanilla',
    creditLimit: '2,100,000',
    balance: '260,000',
    status: 'Active',
    stage: 'Financed',
  },
  {
    id: 'UG-F-01004',
    name: 'Peter Mugisha',
    branchId: 'BR-MBA',
    branch: 'Mbarara Branch',
    primaryCommodity: 'Coffee',
    creditLimit: '1,200,000',
    balance: '0',
    status: 'Active',
    stage: 'Verified',
  },
  {
    id: 'UG-F-01005',
    name: 'Grace Atim',
    branchId: 'BR-MBL',
    branch: 'Mbale Branch',
    primaryCommodity: 'Beans',
    creditLimit: '800,000',
    balance: '150,000',
    status: 'Rejected',
    stage: 'Registered',
  },
  {
    id: 'UG-F-01006',
    name: 'Daniel Kato',
    branchId: 'BR-KLA',
    branch: 'Kampala Central',
    primaryCommodity: 'Maize',
    creditLimit: '1,100,000',
    balance: '210,000',
    status: 'Suspended',
    stage: 'Financed',
  },
];

export function buildMockFarmerProfile(
  farmerId: string,
  statusOverride?: FarmerStatus,
): FarmerProfile {
  const item = MOCK_FARMER_LIST.find(farmer => farmer.id === farmerId) ?? MOCK_FARMER_LIST[0];
  const firstCrop = item.primaryCommodity;

  return {
    id: item.id,
    region: item.branch,
    totalDeliveries: item.status === 'Pending' ? 0 : 12,
    primaryCrop: firstCrop,
    pendingReview: item.status === 'Pending',
    status: statusOverride ?? item.status,
    stage: item.stage,
    outstandingBalance: Number(item.balance.replace(/,/g, '')),
    fullName: item.name,
    role: 'Farmer',
    photoUrl: '',
    phoneNumber: '+256 700 000 000',
    emailAddress: `${item.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    gender: item.name.includes('Amina') || item.name.includes('Sarah') || item.name.includes('Grace')
      ? 'Female'
      : 'Male',
    farmLocation: item.branch,
    village: 'Namakwekwe',
    dateOfBirth: '1988-04-12',
    primaryLanguage: 'English',
    emergencyContact: '+256 701 111 222',
    nationalIdNumber: `CM${item.id.replace(/\D/g, '').padStart(10, '0')}`,
    farm: {
      gpsCoordinates: '0.3476, 32.5825',
      totalLandArea: 3.5,
      irrigationSource: 'Rain-fed',
      landOwnershipType: 'Customary',
      primaryCrops: [firstCrop],
      livestock: ['Goats', 'Poultry'],
    },
    registration: {
      assignedBranch: item.branch,
      collectionCentre: `${item.branch} Collection Centre`,
      dateRegistered: '2026-05-15',
      registeredBy: 'Branch Officer',
    },
    onboardingSteps: [
      { label: 'Registration', sub: 'Farmer profile captured', status: 'done' },
      { label: 'Branch verification', sub: 'Farm visit and KYC review', status: item.status === 'Pending' ? 'progress' : 'done' },
      { label: 'Cooperative approval', sub: 'Final cooperative review', status: item.status === 'Pending' ? 'pending' : 'done' },
    ],
    groupCredit: {
      cooperativeGroup: 'Kasese Growers Group',
      groupLeader: 'Mary Akello',
      creditLimit: Number(item.creditLimit.replace(/,/g, '')),
      creditScore: item.status === 'Pending' ? 68 : 82,
      scoreLabel: item.status === 'Pending' ? 'Review' : 'Healthy',
      saccoName: 'UGAAP SACCO',
    },
  };
}

