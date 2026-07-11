// ── Farmer-level mock data ────────────────────────────────────────────────────
//
// Covers: farmer list, farmer profiles, farmer inventory options, payment
// farmer records, farmer delivery seed data (FD-001..FD-136 restored),
// and the static tables shown in the farmer-approval detail view.
// ─────────────────────────────────────────────────────────────────────────────

import { FarmerListItem, FarmerProfile, FarmerStatus } from '../models/farmer.model';
export { MOCK_COOPERATIVES } from './mock-cooperative';

// ── Farmer list (shown in the farmer directory) ────────────────────────────────

export const MOCK_FARMER_LIST: FarmerListItem[] = [
  { id: 'UG-F-01001', name: 'Amina Nakato',   branchId: 'BR-KLA', branch: 'Kampala Central', primaryCommodity: 'Coffee', creditLimit: '1,500,000', balance: '720,000',  status: 'Pending',   stage: 'Registered' },
  { id: 'UG-F-01002', name: 'Moses Okello',   branchId: 'BR-GUL', branch: 'Gulu Branch',     primaryCommodity: 'Maize',  creditLimit: '900,000',   balance: '450,000',  status: 'Pending',   stage: 'Verified'   },
  { id: 'UG-F-01003', name: 'Sarah Namutebi', branchId: 'BR-JIN', branch: 'Jinja Branch',    primaryCommodity: 'Vanilla',creditLimit: '2,100,000', balance: '260,000',  status: 'Active',    stage: 'Financed'   },
  { id: 'UG-F-01004', name: 'Peter Mugisha',  branchId: 'BR-MBA', branch: 'Mbarara Branch',  primaryCommodity: 'Coffee', creditLimit: '1,200,000', balance: '0',        status: 'Active',    stage: 'Verified'   },
  { id: 'UG-F-01005', name: 'Grace Atim',     branchId: 'BR-MBL', branch: 'Mbale West',    primaryCommodity: 'Beans',  creditLimit: '800,000',   balance: '150,000',  status: 'Rejected',  stage: 'Registered' },
  { id: 'UG-F-01006', name: 'Daniel Kato',    branchId: 'BR-KLA', branch: 'Kampala Central', primaryCommodity: 'Maize',  creditLimit: '1,100,000', balance: '210,000',  status: 'Suspended', stage: 'Financed'   },
  // Mbale West — match dev mock session (BR-MBL)
  { id: 'UG-F-01007', name: 'Dennis Ojok',    branchId: 'BR-MBL', branch: 'Mbale West',      primaryCommodity: 'Maize',  creditLimit: '950,000',   balance: '430,000',  status: 'Active',    stage: 'Financed'   },
  { id: 'UG-F-01008', name: 'Rose Atukunda',  branchId: 'BR-MBL', branch: 'Mbale West',      primaryCommodity: 'Coffee', creditLimit: '1,100,000', balance: '0',        status: 'Pending',   stage: 'Registered' },
];

// ── Farmer profile builder (used by farmer.service.ts mock fallback) ──────────

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
      { label: 'Registration',         sub: 'Farmer profile captured',         status: 'done' },
      { label: 'Branch verification',  sub: 'Farm visit and KYC review',        status: item.status === 'Pending' ? 'progress' : 'done' },
      { label: 'Cooperative approval', sub: 'Final cooperative review',         status: item.status === 'Pending' ? 'pending'  : 'done' },
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

// ── Farmer options for inventory dropdowns ────────────────────────────────────

export const MOCK_FARMERS = [
  { id: 'UG-F-01001', name: 'Amina Nakato',   phone: '+256 701 234 567', branchId: 'BR-KLA', branchName: 'Kampala Central', availableCredit: 1500000 },
  { id: 'UG-F-01002', name: 'Moses Okello',   phone: '+256 772 456 103', branchId: 'BR-GUL', branchName: 'Gulu Branch',     availableCredit:  900000 },
  { id: 'UG-F-01003', name: 'Sarah Namutebi', phone: '+256 755 761 450', branchId: 'BR-JIN', branchName: 'Jinja Branch',    availableCredit: 2100000 },
  { id: 'UG-F-01004', name: 'Peter Mugisha',  phone: '+256 704 445 901', branchId: 'BR-MBA', branchName: 'Mbarara Branch',  availableCredit: 1200000 },
  // Mbale West — names match MOCK_FARMER_LIST for the dev mock session (BR-MBL)
  { id: 'UG-F-01005', name: 'Grace Atim',     phone: '+256 782 400 501', branchId: 'BR-MBL', branchName: 'Mbale West',      availableCredit:  750000 },
  { id: 'UG-F-01007', name: 'Dennis Ojok',    phone: '+256 772 100 502', branchId: 'BR-MBL', branchName: 'Mbale West',      availableCredit:  950000 },
  { id: 'UG-F-01008', name: 'Rose Atukunda',  phone: '+256 703 900 103', branchId: 'BR-MBL', branchName: 'Mbale West',      availableCredit: 1100000 },
];

// ── Payment farmers (used by PaymentBatchService farmer pool) ─────────────────
// Type is inferred — cast to FarmerRecord[] at the usage site in payment-batch.service.ts.

export const MOCK_PAYMENT_FARMERS = [
  { farmerId: 'F-001', fullName: 'Okello James',    commodity: 'Coffee', branch: 'Mbale West', branchId: 'BR-MBL', deliveryDate: '2024-09-15', session: 'morning',   paymentMethod: 'Mobile Money',  netPayable: 450_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100001', bankCode: 'STBK', email: 'okello.james@gmail.com',    address: 'Mbale, Eastern Uganda'  },
  { farmerId: 'F-002', fullName: 'Nakato Sarah',    commodity: 'Maize',  branch: 'Kasese',     branchId: 'BR-KAS', deliveryDate: '2024-09-18', session: 'morning',   paymentMethod: 'Bank Transfer',  netPayable: 320_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100002', bankCode: 'DFCU', email: 'nakato.sarah@gmail.com',    address: 'Kasese, Western Uganda' },
  { farmerId: 'F-003', fullName: 'Mugisha Peter',   commodity: 'Coffee', branch: 'Mbale West', branchId: 'BR-MBL', deliveryDate: '2024-09-20', session: 'morning',   paymentMethod: 'Mobile Money',  netPayable: 610_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100003', bankCode: 'CNTB', email: '',                          address: 'Mbale, Eastern Uganda'  },
  { farmerId: 'F-004', fullName: 'Atim Grace',      commodity: 'Maize',  branch: 'Mbale West', branchId: 'BR-MBL', deliveryDate: '2024-09-21', session: 'morning',   paymentMethod: 'Cash',           netPayable: 180_000, hasBankDetails: false, status: 'Active',  bankAccount: '',           bankCode: ''                                                                   },
  { farmerId: 'F-005', fullName: 'Byamugisha Joel', commodity: 'Coffee', branch: 'Kasese',     branchId: 'BR-KAS', deliveryDate: '2024-09-22', session: 'morning',   paymentMethod: 'Bank Transfer',  netPayable: 540_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100005', bankCode: 'ABSA', email: 'byamugisha.joel@gmail.com', address: 'Kasese, Western Uganda' },
  { farmerId: 'F-006', fullName: 'Nantongo Ruth',   commodity: 'Maize',  branch: 'Kasese',     branchId: 'BR-KAS', deliveryDate: '2024-09-23', session: 'morning',   paymentMethod: 'Mobile Money',  netPayable: 275_000, hasBankDetails: false, status: 'Active',  bankAccount: '',           bankCode: ''                                                                   },
  { farmerId: 'F-007', fullName: 'Namatovu Joyce',  commodity: 'Coffee', branch: 'Mbale West', branchId: 'BR-MBL', deliveryDate: '2024-09-15', session: 'midday',    paymentMethod: 'Mobile Money',  netPayable: 390_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100007', bankCode: 'STBK', email: 'namatovu.joyce@gmail.com',  address: 'Mbale, Eastern Uganda'  },
  { farmerId: 'F-008', fullName: 'Wasswa Ali',      commodity: 'Coffee', branch: 'Mbale West', branchId: 'BR-MBL', deliveryDate: '2024-09-15', session: 'afternoon', paymentMethod: 'Bank Transfer',  netPayable: 510_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100008', bankCode: 'CNTB', email: 'wasswa.ali@gmail.com',      address: 'Mbale, Eastern Uganda'  },
  { farmerId: 'F-009', fullName: 'Nabirye Patience',commodity: 'Coffee', branch: 'Mbale West', branchId: 'BR-MBL', deliveryDate: '2024-09-20', session: 'midday',    paymentMethod: 'Mobile Money',  netPayable: 430_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100009', bankCode: 'DFCU', email: 'nabirye.patience@gmail.com',address: 'Mbale, Eastern Uganda'  },
  { farmerId: 'F-010', fullName: 'Mukiibi Daniel',  commodity: 'Coffee', branch: 'Mbale West', branchId: 'BR-MBL', deliveryDate: '2024-09-20', session: 'afternoon', paymentMethod: 'Cash',           netPayable: 290_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100010', bankCode: 'ABSA', email: 'mukiibi.daniel@gmail.com',  address: 'Mbale, Eastern Uganda'  },
  { farmerId: 'F-011', fullName: 'Kirabo Esther',   commodity: 'Maize',  branch: 'Kasese',     branchId: 'BR-KAS', deliveryDate: '2024-09-18', session: 'midday',    paymentMethod: 'Bank Transfer',  netPayable: 350_000, hasBankDetails: true,  status: 'Rejected', bankAccount: '9876100011', bankCode: 'DFCU', email: 'kirabo.esther@gmail.com',   address: 'Kasese, Western Uganda' },
  { farmerId: 'F-012', fullName: 'Were Hassan',     commodity: 'Maize',  branch: 'Kasese',     branchId: 'BR-KAS', deliveryDate: '2024-09-18', session: 'afternoon', paymentMethod: 'Mobile Money',  netPayable: 410_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100012', bankCode: 'STBK', email: 'were.hassan@gmail.com',     address: 'Kasese, Western Uganda' },
  { farmerId: 'F-013', fullName: 'Nansubuga Joan',  commodity: 'Coffee', branch: 'Mbale West', branchId: 'BR-MBL', deliveryDate: '2024-09-25', session: 'morning',   paymentMethod: 'Mobile Money',  netPayable: 470_000, hasBankDetails: true,  status: 'Pending', bankAccount: '9876100013', bankCode: 'CNTB', email: 'nansubuga.joan@gmail.com',  address: 'Mbale, Eastern Uganda'  },
  { farmerId: 'F-014', fullName: 'Ssekandi Brian',  commodity: 'Coffee', branch: 'Mbale West', branchId: 'BR-MBL', deliveryDate: '2024-09-25', session: 'midday',    paymentMethod: 'Bank Transfer',  netPayable: 380_000, hasBankDetails: true,  status: 'Active',  bankAccount: '9876100014', bankCode: 'ABSA', email: 'ssekandi.brian@gmail.com',  address: 'Mbale, Eastern Uganda'  },
];

// ── Input loan deductions ─────────────────────────────────────────────────────
// Keyed by FarmerDelivery id — only farmers who received inputs have an entry.

export const INPUT_LOAN_DEDUCTIONS: Record<string, number> = {
  'FD-001':  75_000,   // Akello Grace — maize seed loan
  'FD-023':  60_000,   // Nsubuga Edward — maize fertilizer
  'FD-004': 180_000,   // Namukasa Fatuma — coffee seedlings
  'FD-026': 120_000,   // Mukisa Ronald — coffee fertilizer
  'FD-007':  50_000,   // Asiimwe Doreen — beans seed loan
  'FD-013': 200_000,   // Drani Moses — sesame seeds
  'FD-032': 100_000,   // Acaye Simon — sesame fertilizer
  'FD-015':  90_000,   // Oryem Patrick — sunflower seeds
  'FD-034':  80_000,   // Nambozo Sarah — sunflower inputs
  'FD-017': 500_000,   // Ssemakula John — vanilla cuttings
  'FD-043': 250_000,   // Namugga Sylvia — vanilla inputs
  'FD-021': 150_000,   // Wafula Emmanuel — coffee fertilizer
  'FD-050': 210_000,   // Masaba Richard — coffee seedlings
  'FD-051': 150_000,   // Nabirye Christine — coffee inputs
  'FD-053':  70_000,   // Gimbo Patrick — maize seed loan
  'FD-055':  85_000,   // Khaukha Moses — maize fertilizer
  'FD-057':  55_000,   // Mafabi Joel — beans seed loan
  'FD-060': 110_000,   // Nambafu Esther — sesame seeds
  'FD-073':  55_000,   // Sikuku Peter — millet seed loan
  'FD-076': 140_000,   // Namono Alice — coffee seedlings
  'FD-078': 100_000,   // Khamoya Susan — coffee inputs
  'FD-080':  85_000,   // Nambuya Christine — maize fertilizer
};

// ── Farmer delivery seed data (FD-001..FD-136) ───────────────────────────────
// Restored from the commented-out FarmerDeliveryService implementation.
// Type is inferred (includes branchId/branchDeliveryId/grade not in current FarmerDelivery
// interface) — cast to FarmerDelivery[] at the usage site.

export const MOCK_FARMER_DELIVERIES = [
  // ── Wet Season — BD-001 (Kampala Central, Maize) ────────────────────────
  { id: 'FD-001', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00101', farmerName: 'Akello Grace',      phone: '0772100001', commodity: 'Maize',    volume: 320,  estimatedValue:   800_000, notes: 'Grade A quality',   status: 'Approved' as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
  { id: 'FD-002', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00102', farmerName: 'Okello James',      phone: '0754200002', commodity: 'Maize',    volume: 410,  estimatedValue: 1_025_000, notes: '',                  status: 'Approved' as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
  { id: 'FD-003', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00103', farmerName: 'Achen Beatrice',    phone: '0701300103', commodity: 'Maize',    volume: 290,  estimatedValue:   725_000, notes: 'Slight moisture',   status: 'Approved' as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },

  // ── Wet Season — BD-002 (Jinja East, Coffee) ────────────────────────────
  { id: 'FD-004', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00201', farmerName: 'Namukasa Fatuma',   phone: '0782400201', commodity: 'Coffee',   volume: 180,  estimatedValue: 1_080_000, notes: 'Dried beans',       status: 'Pending'  as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },
  { id: 'FD-005', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00202', farmerName: 'Waiswa Stephen',    phone: '0772100202', commodity: 'Coffee',   volume: 220,  estimatedValue: 1_320_000, notes: '',                  status: 'Pending'  as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },

  // ── Wet Season — BD-003 (Mbarara South, Beans) ──────────────────────────
  { id: 'FD-006', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00301', farmerName: 'Tukwasibwe Robert', phone: '0754200301', commodity: 'Beans',    volume: 200,  estimatedValue:   500_000, notes: '',                  status: 'Pending'  as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },
  { id: 'FD-007', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00302', farmerName: 'Asiimwe Doreen',    phone: '0701300302', commodity: 'Beans',    volume: 155,  estimatedValue:   387_500, notes: 'Well sorted',       status: 'Pending'  as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },

  // ── Wet Season — BD-006 (Fort Portal West, Tea) ─────────────────────────
  { id: 'FD-008', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00601', farmerName: 'Birungi Harriet',   phone: '0772100601', commodity: 'Tea',      volume: 240,  estimatedValue:   600_000, notes: 'Fresh leaf',        status: 'Pending'  as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },
  { id: 'FD-009', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00602', farmerName: 'Ntegeka Paul',      phone: '0754200602', commodity: 'Tea',      volume: 310,  estimatedValue:   775_000, notes: '',                  status: 'Pending'  as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },
  { id: 'FD-010', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00603', farmerName: 'Kagaba Prossy',     phone: '0701300603', commodity: 'Tea',      volume: 195,  estimatedValue:   487_500, notes: 'Slightly wilted',   status: 'Pending'  as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },

  // ── Wet Season — BD-007 (Adjumani East, Maize) ──────────────────────────
  { id: 'FD-011', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00701', farmerName: 'Ongom Felix',       phone: '0782400701', commodity: 'Maize',    volume: 275,  estimatedValue:   687_500, notes: '',                  status: 'Approved' as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },
  { id: 'FD-012', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00702', farmerName: 'Adola Christine',   phone: '0772100702', commodity: 'Maize',    volume: 190,  estimatedValue:   475_000, notes: 'Grade B',           status: 'Approved' as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },

  // ── Dry Season — BD-004 (Gulu North, Sesame) ────────────────────────────
  { id: 'FD-013', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00401', farmerName: 'Drani Moses',       phone: '0754200401', commodity: 'Sesame',   volume: 185,  estimatedValue: 1_110_000, notes: 'Clean grain',       status: 'Approved' as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },
  { id: 'FD-014', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00402', farmerName: 'Oryema Denis',      phone: '0701300402', commodity: 'Sesame',   volume: 140,  estimatedValue:   840_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },

  // ── Dry Season — BD-005 (Mbale West, Sunflower) — dev mock user's branch ─
  { id: 'FD-015', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00501', farmerName: 'Oryem Patrick',     phone: '0782400501', commodity: 'Sunflower',volume: 260,  estimatedValue:   780_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
  { id: 'FD-016', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00502', farmerName: 'Opio Geoffrey',     phone: '0772100502', commodity: 'Sunflower',volume: 210,  estimatedValue:   630_000, notes: 'Slightly under-dry',status: 'Approved' as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },

  // ── Dry Season — BD-008 (Kiboga Central, Vanilla) ───────────────────────
  { id: 'FD-017', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00801', farmerName: 'Ssemakula John',    phone: '0754200801', commodity: 'Vanilla',  volume:  48,  estimatedValue: 4_800_000, notes: 'Export grade',      status: 'Approved' as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },
  { id: 'FD-018', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00802', farmerName: 'Katende Robert',    phone: '0701300802', commodity: 'Vanilla',  volume:  36,  estimatedValue: 3_600_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },

  // ── Dry Season — BD-009 (Lira Town, Sesame) ─────────────────────────────
  { id: 'FD-019', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00901', farmerName: 'Atim Lydia',        phone: '0782400901', commodity: 'Sesame',   volume: 170,  estimatedValue: 1_020_000, notes: '',                  status: 'Pending'  as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },
  { id: 'FD-020', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00902', farmerName: 'Okot Geoffrey',     phone: '0772100902', commodity: 'Sesame',   volume: 130,  estimatedValue:   780_000, notes: 'Re-dried',          status: 'Pending'  as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },

  // ── Dry Season — BD-010 (Mbale East, Coffee) ────────────────────────────
  { id: 'FD-021', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01001', farmerName: 'Wafula Emmanuel',   phone: '0754201001', commodity: 'Coffee',   volume: 200,  estimatedValue: 1_200_000, notes: 'Arabica AA',        status: 'Approved' as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },
  { id: 'FD-022', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01002', farmerName: 'Nakato Prossy',     phone: '0701301002', commodity: 'Coffee',   volume: 155,  estimatedValue:   930_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },

  // ── Extra farmers to fill out the farmerCount on each BranchDelivery ─────

  // BD-001 (Kampala Central, Maize) — 3 more
  { id: 'FD-023', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00104', farmerName: 'Nsubuga Edward',    phone: '0701400104', commodity: 'Maize',    volume: 350,  estimatedValue:   875_000, notes: 'Well dried',        status: 'Approved' as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
  { id: 'FD-024', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00105', farmerName: 'Mukasa Diana',      phone: '0772400105', commodity: 'Maize',    volume: 275,  estimatedValue:   687_500, notes: '',                  status: 'Approved' as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
  { id: 'FD-025', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00106', farmerName: 'Ssali Vincent',     phone: '0754400106', commodity: 'Maize',    volume: 310,  estimatedValue:   775_000, notes: 'Grade A',           status: 'Approved' as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },

  // BD-002 (Jinja East, Coffee) — 3 more
  { id: 'FD-026', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00203', farmerName: 'Mukisa Ronald',     phone: '0782400203', commodity: 'Coffee',   volume: 195,  estimatedValue: 1_170_000, notes: '',                  status: 'Pending'  as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },
  { id: 'FD-027', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00204', farmerName: 'Babirye Sarah',     phone: '0701400204', commodity: 'Coffee',   volume: 160,  estimatedValue:   960_000, notes: 'Wet parchment',     status: 'Pending'  as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },
  { id: 'FD-028', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00205', farmerName: 'Isabirye Moses',    phone: '0772400205', commodity: 'Coffee',   volume: 210,  estimatedValue: 1_260_000, notes: '',                  status: 'Pending'  as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },

  // BD-003 (Mbarara South, Beans) — 3 more
  { id: 'FD-029', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00303', farmerName: 'Kyomuhendo Esther', phone: '0754400303', commodity: 'Beans',    volume: 175,  estimatedValue:   437_500, notes: '',                  status: 'Pending'  as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },
  { id: 'FD-030', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00304', farmerName: 'Byaruhanga Patrick',phone: '0701400304', commodity: 'Beans',    volume: 140,  estimatedValue:   350_000, notes: 'Mixed grade',       status: 'Pending'  as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },
  { id: 'FD-031', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00305', farmerName: 'Nyangoma Joy',      phone: '0782400305', commodity: 'Beans',    volume: 165,  estimatedValue:   412_500, notes: '',                  status: 'Pending'  as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },

  // BD-004 (Gulu North, Sesame) — 2 more
  { id: 'FD-032', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00403', farmerName: 'Acaye Simon',       phone: '0772400403', commodity: 'Sesame',   volume: 160,  estimatedValue:   960_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },
  { id: 'FD-033', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00404', farmerName: 'Lamwaka Susan',     phone: '0754400404', commodity: 'Sesame',   volume: 130,  estimatedValue:   780_000, notes: 'Clean grain',       status: 'Approved' as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },

  // BD-005 (Mbale West, Sunflower) — dev mock user's branch — 4 more
  { id: 'FD-034', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00503', farmerName: 'Nambozo Sarah',     phone: '0701400503', commodity: 'Sunflower',volume: 230,  estimatedValue:   690_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
  { id: 'FD-035', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00504', farmerName: 'Wabwire Tom',       phone: '0782400504', commodity: 'Sunflower',volume: 195,  estimatedValue:   585_000, notes: 'Slight debris',     status: 'Approved' as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
  { id: 'FD-036', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00505', farmerName: 'Namutebi Joan',     phone: '0772400505', commodity: 'Sunflower',volume: 280,  estimatedValue:   840_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
  { id: 'FD-037', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00506', farmerName: 'Mafabi Andrew',     phone: '0754400506', commodity: 'Sunflower',volume: 150,  estimatedValue:   450_000, notes: 'Re-screened',       status: 'Approved' as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },

  // BD-006 (Fort Portal West, Tea) — 2 more
  { id: 'FD-038', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00604', farmerName: 'Kabugo Allan',      phone: '0701400604', commodity: 'Tea',      volume: 220,  estimatedValue:   550_000, notes: '',                  status: 'Pending'  as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },
  { id: 'FD-039', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00605', farmerName: 'Biira Patience',    phone: '0782400605', commodity: 'Tea',      volume: 260,  estimatedValue:   650_000, notes: 'Fresh leaf',        status: 'Pending'  as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },

  // BD-007 (Adjumani East, Maize) — 2 more
  { id: 'FD-040', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00703', farmerName: 'Lokule Peter',      phone: '0772400703', commodity: 'Maize',    volume: 230,  estimatedValue:   575_000, notes: '',                  status: 'Approved' as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },
  { id: 'FD-041', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00704', farmerName: 'Acidri Mary',       phone: '0754400704', commodity: 'Maize',    volume: 185,  estimatedValue:   462_500, notes: 'Grade A',           status: 'Approved' as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },

  // BD-008 (Kiboga Central, Vanilla) — 2 more
  { id: 'FD-042', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00803', farmerName: 'Lukwago Tom',       phone: '0701400803', commodity: 'Vanilla',  volume:  30,  estimatedValue: 3_000_000, notes: 'Cured beans',       status: 'Approved' as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },
  { id: 'FD-043', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00804', farmerName: 'Namugga Sylvia',    phone: '0782400804', commodity: 'Vanilla',  volume:  25,  estimatedValue: 2_500_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },

  // BD-009 (Lira Town, Sesame) — 3 more
  { id: 'FD-044', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00903', farmerName: 'Akena Charles',     phone: '0772400903', commodity: 'Sesame',   volume: 145,  estimatedValue:   870_000, notes: '',                  status: 'Pending'  as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },
  { id: 'FD-045', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00904', farmerName: 'Adong Susan',       phone: '0754400904', commodity: 'Sesame',   volume: 120,  estimatedValue:   720_000, notes: 'Re-dried',          status: 'Pending'  as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },
  { id: 'FD-046', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00905', farmerName: 'Okello Brian',      phone: '0701400905', commodity: 'Sesame',   volume: 165,  estimatedValue:   990_000, notes: '',                  status: 'Pending'  as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },

  // BD-010 (Mbale East, Coffee) — 3 more
  { id: 'FD-047', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01003', farmerName: 'Nabwire Grace',     phone: '0782401003', commodity: 'Coffee',   volume: 180,  estimatedValue: 1_080_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },
  { id: 'FD-048', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01004', farmerName: 'Wamala Henry',      phone: '0772401004', commodity: 'Coffee',   volume: 145,  estimatedValue:   870_000, notes: 'Arabica AA',        status: 'Approved' as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },
  { id: 'FD-049', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01005', farmerName: 'Mbabazi Irene',     phone: '0754401005', commodity: 'Coffee',   volume: 210,  estimatedValue: 1_260_000, notes: '',                  status: 'Approved' as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },

  // ── Mbale West (BR-MBL) — additional delivery history, matching BD-011..BD-020 ──

  // BD-011 (Mbale West, Coffee, Wet Season)
  { id: 'FD-050', branchDeliveryId: 'BD-011', branchId: 'BR-MBL', farmerId: 'UG-F-00507', farmerName: 'Masaba Richard',    phone: '0772500507', commodity: 'Coffee',   volume: 280, estimatedValue: 1_680_000, notes: '',              status: 'Approved' as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-06-05'), updatedAt: new Date('2025-06-05') },
  { id: 'FD-051', branchDeliveryId: 'BD-011', branchId: 'BR-MBL', farmerId: 'UG-F-00508', farmerName: 'Nabirye Christine', phone: '0754500508', commodity: 'Coffee',   volume: 210, estimatedValue: 1_260_000, notes: 'Arabica AA',    status: 'Approved' as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-06-05'), updatedAt: new Date('2025-06-05') },
  { id: 'FD-052', branchDeliveryId: 'BD-011', branchId: 'BR-MBL', farmerId: 'UG-F-00509', farmerName: 'Wanyama Joseph',    phone: '0701500509', commodity: 'Coffee',   volume: 165, estimatedValue:   990_000, notes: '',              status: 'Approved' as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-06-05'), updatedAt: new Date('2025-06-05') },

  // BD-012 (Mbale West, Maize, Dry Season)
  { id: 'FD-053', branchDeliveryId: 'BD-012', branchId: 'BR-MBL', farmerId: 'UG-F-00510', farmerName: 'Gimbo Patrick',     phone: '0782500510', commodity: 'Maize',    volume: 300, estimatedValue:   750_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-06-20'), updatedAt: new Date('2025-06-20') },
  { id: 'FD-054', branchDeliveryId: 'BD-012', branchId: 'BR-MBL', farmerId: 'UG-F-00511', farmerName: 'Nanteza Rebecca',   phone: '0772500511', commodity: 'Maize',    volume: 260, estimatedValue:   650_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-06-20'), updatedAt: new Date('2025-06-20') },
  { id: 'FD-055', branchDeliveryId: 'BD-012', branchId: 'BR-MBL', farmerId: 'UG-F-00512', farmerName: 'Khaukha Moses',     phone: '0754500512', commodity: 'Maize',    volume: 320, estimatedValue:   800_000, notes: 'Grade B',       status: 'Pending'  as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-06-20'), updatedAt: new Date('2025-06-20') },
  { id: 'FD-056', branchDeliveryId: 'BD-012', branchId: 'BR-MBL', farmerId: 'UG-F-00513', farmerName: 'Auma Sarah',        phone: '0701500513', commodity: 'Maize',    volume: 190, estimatedValue:   475_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-06-20'), updatedAt: new Date('2025-06-20') },

  // BD-013 (Mbale West, Beans, Wet Season)
  { id: 'FD-057', branchDeliveryId: 'BD-013', branchId: 'BR-MBL', farmerId: 'UG-F-00514', farmerName: 'Mafabi Joel',       phone: '0772500514', commodity: 'Beans',    volume: 175, estimatedValue:   437_500, notes: '',              status: 'Approved' as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-07-10'), updatedAt: new Date('2025-07-10') },
  { id: 'FD-058', branchDeliveryId: 'BD-013', branchId: 'BR-MBL', farmerId: 'UG-F-00515', farmerName: 'Nekesa Irene',      phone: '0754500515', commodity: 'Beans',    volume: 150, estimatedValue:   375_000, notes: 'Well sorted',   status: 'Approved' as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-07-10'), updatedAt: new Date('2025-07-10') },
  { id: 'FD-059', branchDeliveryId: 'BD-013', branchId: 'BR-MBL', farmerId: 'UG-F-00516', farmerName: 'Wabwire Daniel',    phone: '0701500516', commodity: 'Beans',    volume: 200, estimatedValue:   500_000, notes: '',              status: 'Approved' as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-07-10'), updatedAt: new Date('2025-07-10') },

  // BD-014 (Mbale West, Sesame, Dry Season)
  { id: 'FD-060', branchDeliveryId: 'BD-014', branchId: 'BR-MBL', farmerId: 'UG-F-00517', farmerName: 'Nambafu Esther',    phone: '0782500517', commodity: 'Sesame',   volume: 140, estimatedValue:   840_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-07-25'), updatedAt: new Date('2025-07-25') },
  { id: 'FD-061', branchDeliveryId: 'BD-014', branchId: 'BR-MBL', farmerId: 'UG-F-00518', farmerName: 'Wamimbi George',    phone: '0772500518', commodity: 'Sesame',   volume: 160, estimatedValue:   960_000, notes: 'Clean grain',   status: 'Pending'  as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-07-25'), updatedAt: new Date('2025-07-25') },
  { id: 'FD-062', branchDeliveryId: 'BD-014', branchId: 'BR-MBL', farmerId: 'UG-F-00519', farmerName: 'Khaoya Patricia',   phone: '0754500519', commodity: 'Sesame',   volume: 125, estimatedValue:   750_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-07-25'), updatedAt: new Date('2025-07-25') },

  // BD-015 (Mbale West, Sunflower, Wet Season)
  { id: 'FD-063', branchDeliveryId: 'BD-015', branchId: 'BR-MBL', farmerId: 'UG-F-00520', farmerName: 'Mukhwana Stephen',  phone: '0701500520', commodity: 'Sunflower',volume: 240, estimatedValue:   720_000, notes: '',              status: 'Approved' as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-08-08'), updatedAt: new Date('2025-08-08') },
  { id: 'FD-064', branchDeliveryId: 'BD-015', branchId: 'BR-MBL', farmerId: 'UG-F-00521', farmerName: 'Naula Florence',    phone: '0782500521', commodity: 'Sunflower',volume: 200, estimatedValue:   600_000, notes: '',              status: 'Approved' as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-08-08'), updatedAt: new Date('2025-08-08') },
  { id: 'FD-065', branchDeliveryId: 'BD-015', branchId: 'BR-MBL', farmerId: 'UG-F-00522', farmerName: 'Wafula Brian',      phone: '0772500522', commodity: 'Sunflower',volume: 175, estimatedValue:   525_000, notes: 'Slight debris', status: 'Approved' as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-08-08'), updatedAt: new Date('2025-08-08') },
  { id: 'FD-066', branchDeliveryId: 'BD-015', branchId: 'BR-MBL', farmerId: 'UG-F-00523', farmerName: 'Nasiche Grace',     phone: '0754500523', commodity: 'Sunflower',volume: 220, estimatedValue:   660_000, notes: '',              status: 'Approved' as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-08-08'), updatedAt: new Date('2025-08-08') },

  // BD-016 (Mbale West, Rice, Dry Season)
  { id: 'FD-067', branchDeliveryId: 'BD-016', branchId: 'BR-MBL', farmerId: 'UG-F-00524', farmerName: 'Otieno Calvin',     phone: '0701500524', commodity: 'Rice',     volume: 300, estimatedValue: 1_050_000, notes: '',              status: 'Rejected' as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-08-22'), updatedAt: new Date('2025-08-22') },
  { id: 'FD-068', branchDeliveryId: 'BD-016', branchId: 'BR-MBL', farmerId: 'UG-F-00525', farmerName: 'Nabwami Faith',     phone: '0782500525', commodity: 'Rice',     volume: 260, estimatedValue:   910_000, notes: 'Too much moisture', status: 'Rejected' as const, season: 'Dry Season', session: 'midday', createdAt: new Date('2025-08-22'), updatedAt: new Date('2025-08-22') },
  { id: 'FD-069', branchDeliveryId: 'BD-016', branchId: 'BR-MBL', farmerId: 'UG-F-00526', farmerName: 'Mwambu Allan',      phone: '0772500526', commodity: 'Rice',     volume: 280, estimatedValue:   980_000, notes: '',              status: 'Rejected' as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-08-22'), updatedAt: new Date('2025-08-22') },

  // BD-017 (Mbale West, Sorghum, Wet Season)
  { id: 'FD-070', branchDeliveryId: 'BD-017', branchId: 'BR-MBL', farmerId: 'UG-F-00527', farmerName: 'Nanjala Ruth',      phone: '0754500527', commodity: 'Sorghum',  volume: 350, estimatedValue:   630_000, notes: '',              status: 'Pending'  as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-09-05'), updatedAt: new Date('2025-09-05') },
  { id: 'FD-071', branchDeliveryId: 'BD-017', branchId: 'BR-MBL', farmerId: 'UG-F-00528', farmerName: 'Wekesa Tom',        phone: '0701500528', commodity: 'Sorghum',  volume: 300, estimatedValue:   540_000, notes: '',              status: 'Pending'  as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-09-05'), updatedAt: new Date('2025-09-05') },
  { id: 'FD-072', branchDeliveryId: 'BD-017', branchId: 'BR-MBL', farmerId: 'UG-F-00529', farmerName: 'Namisango Joy',     phone: '0782500529', commodity: 'Sorghum',  volume: 275, estimatedValue:   495_000, notes: '',              status: 'Pending'  as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-09-05'), updatedAt: new Date('2025-09-05') },

  // BD-018 (Mbale West, Millet, Dry Season)
  { id: 'FD-073', branchDeliveryId: 'BD-018', branchId: 'BR-MBL', farmerId: 'UG-F-00530', farmerName: 'Sikuku Peter',      phone: '0772500530', commodity: 'Millet',   volume: 230, estimatedValue:   506_000, notes: '',              status: 'Approved' as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-09-19'), updatedAt: new Date('2025-09-19') },
  { id: 'FD-074', branchDeliveryId: 'BD-018', branchId: 'BR-MBL', farmerId: 'UG-F-00531', farmerName: 'Nabaale Susan',     phone: '0754500531', commodity: 'Millet',   volume: 195, estimatedValue:   429_000, notes: '',              status: 'Approved' as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-09-19'), updatedAt: new Date('2025-09-19') },
  { id: 'FD-075', branchDeliveryId: 'BD-018', branchId: 'BR-MBL', farmerId: 'UG-F-00532', farmerName: 'Wandera Eric',      phone: '0701500532', commodity: 'Millet',   volume: 210, estimatedValue:   462_000, notes: '',              status: 'Approved' as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-09-19'), updatedAt: new Date('2025-09-19') },

  // BD-019 (Mbale West, Coffee, Wet Season) — grade-based pricing
  { id: 'FD-076', branchDeliveryId: 'BD-019', branchId: 'BR-MBL', farmerId: 'UG-F-00533', farmerName: 'Namono Alice',      phone: '0782500533', commodity: 'Coffee',   volume: 220, unitPrice: 7_800, estimatedValue: 1_716_000, grade: 'A', gradeName: 'Premium',   notes: '',          status: 'Approved' as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-10-03'), updatedAt: new Date('2025-10-03') },
  { id: 'FD-077', branchDeliveryId: 'BD-019', branchId: 'BR-MBL', farmerId: 'UG-F-00534', farmerName: 'Mugeni Robert',     phone: '0772500534', commodity: 'Coffee',   volume: 190, unitPrice: 6_000, estimatedValue: 1_140_000, grade: 'B', gradeName: 'Standard',  notes: '',          status: 'Approved' as const, season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-10-03'), updatedAt: new Date('2025-10-03') },
  { id: 'FD-078', branchDeliveryId: 'BD-019', branchId: 'BR-MBL', farmerId: 'UG-F-00535', farmerName: 'Khamoya Susan',     phone: '0754500535', commodity: 'Coffee',   volume: 165, unitPrice: 7_800, estimatedValue: 1_287_000, grade: 'A', gradeName: 'Premium',   notes: 'Arabica AA', status: 'Approved' as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-10-03'), updatedAt: new Date('2025-10-03') },
  { id: 'FD-079', branchDeliveryId: 'BD-019', branchId: 'BR-MBL', farmerId: 'UG-F-00536', farmerName: 'Wanyenze Daniel',   phone: '0701500536', commodity: 'Coffee',   volume: 200, unitPrice: 4_200, estimatedValue:   840_000, grade: 'C', gradeName: 'Low Grade', notes: '',          status: 'Approved' as const, season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-10-03'), updatedAt: new Date('2025-10-03') },

  // BD-020 (Mbale West, Maize, Dry Season) — grade-based pricing
  { id: 'FD-080', branchDeliveryId: 'BD-020', branchId: 'BR-MBL', farmerId: 'UG-F-00537', farmerName: 'Nambuya Christine', phone: '0782500537', commodity: 'Maize',    volume: 280, unitPrice: 2_500, estimatedValue:   700_000, grade: 'B', gradeName: 'Standard',  notes: '',          status: 'Pending'  as const, season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-10-17'), updatedAt: new Date('2025-10-17') },
  { id: 'FD-081', branchDeliveryId: 'BD-020', branchId: 'BR-MBL', farmerId: 'UG-F-00538', farmerName: 'Wabwire Henry',     phone: '0772500538', commodity: 'Maize',    volume: 245, unitPrice: 3_250, estimatedValue:   796_250, grade: 'A', gradeName: 'Premium',   notes: '',          status: 'Pending'  as const, season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-10-17'), updatedAt: new Date('2025-10-17') },
  { id: 'FD-082', branchDeliveryId: 'BD-020', branchId: 'BR-MBL', farmerId: 'UG-F-00539', farmerName: 'Nakirya Patricia',  phone: '0754500539', commodity: 'Maize',    volume: 300, unitPrice: 1_750, estimatedValue:   525_000, grade: 'C', gradeName: 'Low Grade', notes: '',          status: 'Pending'  as const, season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-10-17'), updatedAt: new Date('2025-10-17') },

  // ── Farmer records for cross-branch batches (BD-021..BD-038) ─────────────

  // BD-021 (Kampala Central, Beans, Dry Season)
  { id: 'FD-083', branchDeliveryId: 'BD-021', branchId: 'BR-KLA',  farmerId: 'UG-F-00107', farmerName: 'Nakamanya Rose',     phone: '0772500107', commodity: 'Beans',    volume: 380, estimatedValue:   950_000, notes: 'Well sorted',   status: 'Approved' as const, season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-06-04'), updatedAt: new Date('2025-06-04') },
  { id: 'FD-084', branchDeliveryId: 'BD-021', branchId: 'BR-KLA',  farmerId: 'UG-F-00108', farmerName: 'Kigozi Samuel',      phone: '0754500108', commodity: 'Beans',    volume: 290, estimatedValue:   725_000, notes: '',              status: 'Approved' as const, season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-06-04'), updatedAt: new Date('2025-06-04') },
  { id: 'FD-085', branchDeliveryId: 'BD-021', branchId: 'BR-KLA',  farmerId: 'UG-F-00109', farmerName: 'Nankya Aisha',       phone: '0701500109', commodity: 'Beans',    volume: 310, estimatedValue:   775_000, notes: 'Grade A',       status: 'Approved' as const, season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-06-04'), updatedAt: new Date('2025-06-04') },

  // BD-022 (Kampala Central, Coffee, Dry Season)
  { id: 'FD-086', branchDeliveryId: 'BD-022', branchId: 'BR-KLA',  farmerId: 'UG-F-00110', farmerName: 'Ssebuggwawo Dan',    phone: '0782500110', commodity: 'Coffee',   volume: 160, estimatedValue:   960_000, notes: 'Dried beans',   status: 'Pending'  as const, season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-07-14'), updatedAt: new Date('2025-07-14') },
  { id: 'FD-087', branchDeliveryId: 'BD-022', branchId: 'BR-KLA',  farmerId: 'UG-F-00111', farmerName: 'Nakitto Grace',      phone: '0772500111', commodity: 'Coffee',   volume: 190, estimatedValue: 1_140_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-07-14'), updatedAt: new Date('2025-07-14') },
  { id: 'FD-088', branchDeliveryId: 'BD-022', branchId: 'BR-KLA',  farmerId: 'UG-F-00112', farmerName: 'Kizito Peter',       phone: '0754500112', commodity: 'Coffee',   volume: 140, estimatedValue:   840_000, notes: 'Arabica AA',    status: 'Pending'  as const, season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-07-14'), updatedAt: new Date('2025-07-14') },

  // BD-023 (Jinja East, Maize, Dry Season)
  { id: 'FD-089', branchDeliveryId: 'BD-023', branchId: 'BR-JIN',  farmerId: 'UG-F-00206', farmerName: 'Mugisha Tom',        phone: '0701500206', commodity: 'Maize',    volume: 320, estimatedValue:   800_000, notes: '',              status: 'Approved' as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-06-11'), updatedAt: new Date('2025-06-11') },
  { id: 'FD-090', branchDeliveryId: 'BD-023', branchId: 'BR-JIN',  farmerId: 'UG-F-00207', farmerName: 'Nakirija Sarah',     phone: '0782500207', commodity: 'Maize',    volume: 280, estimatedValue:   700_000, notes: 'Well dried',    status: 'Approved' as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-06-11'), updatedAt: new Date('2025-06-11') },
  { id: 'FD-091', branchDeliveryId: 'BD-023', branchId: 'BR-JIN',  farmerId: 'UG-F-00208', farmerName: 'Kato Henry',         phone: '0772500208', commodity: 'Maize',    volume: 350, estimatedValue:   875_000, notes: '',              status: 'Approved' as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-06-11'), updatedAt: new Date('2025-06-11') },

  // BD-024 (Jinja East, Tea, Wet Season)
  { id: 'FD-092', branchDeliveryId: 'BD-024', branchId: 'BR-JIN',  farmerId: 'UG-F-00209', farmerName: 'Nalubega Christine', phone: '0754500209', commodity: 'Tea',      volume: 200, estimatedValue:   500_000, notes: 'Fresh leaf',    status: 'Pending'  as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-01'), updatedAt: new Date('2025-08-01') },
  { id: 'FD-093', branchDeliveryId: 'BD-024', branchId: 'BR-JIN',  farmerId: 'UG-F-00210', farmerName: 'Ssenyonga Mark',     phone: '0701500210', commodity: 'Tea',      volume: 250, estimatedValue:   625_000, notes: '',              status: 'Pending'  as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-01'), updatedAt: new Date('2025-08-01') },
  { id: 'FD-094', branchDeliveryId: 'BD-024', branchId: 'BR-JIN',  farmerId: 'UG-F-00211', farmerName: 'Namirembe Ruth',     phone: '0782500211', commodity: 'Tea',      volume: 180, estimatedValue:   450_000, notes: 'Slightly wilted', status: 'Pending' as const, season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-08-01'), updatedAt: new Date('2025-08-01') },

  // BD-025 (Mbarara South, Maize, Dry Season)
  { id: 'FD-095', branchDeliveryId: 'BD-025', branchId: 'BR-MBA',  farmerId: 'UG-F-00306', farmerName: 'Tumwebaze Annet',    phone: '0772500306', commodity: 'Maize',    volume: 390, estimatedValue:   975_000, notes: '',              status: 'Approved' as const, season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-06-18'), updatedAt: new Date('2025-06-18') },
  { id: 'FD-096', branchDeliveryId: 'BD-025', branchId: 'BR-MBA',  farmerId: 'UG-F-00307', farmerName: 'Kanyeihamba David',  phone: '0754500307', commodity: 'Maize',    volume: 420, estimatedValue: 1_050_000, notes: 'Grade A',       status: 'Approved' as const, season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-06-18'), updatedAt: new Date('2025-06-18') },
  { id: 'FD-097', branchDeliveryId: 'BD-025', branchId: 'BR-MBA',  farmerId: 'UG-F-00308', farmerName: 'Birungi Margaret',   phone: '0701500308', commodity: 'Maize',    volume: 360, estimatedValue:   900_000, notes: '',              status: 'Approved' as const, season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-06-18'), updatedAt: new Date('2025-06-18') },

  // BD-026 (Mbarara South, Coffee, Wet Season)
  { id: 'FD-098', branchDeliveryId: 'BD-026', branchId: 'BR-MBA',  farmerId: 'UG-F-00309', farmerName: 'Rwabutungi Sam',     phone: '0782500309', commodity: 'Coffee',   volume: 140, estimatedValue:   840_000, notes: 'Too wet',       status: 'Rejected' as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-12'), updatedAt: new Date('2025-08-12') },
  { id: 'FD-099', branchDeliveryId: 'BD-026', branchId: 'BR-MBA',  farmerId: 'UG-F-00310', farmerName: 'Katungye Alice',     phone: '0772500310', commodity: 'Coffee',   volume: 110, estimatedValue:   660_000, notes: 'Re-dry needed', status: 'Rejected' as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-12'), updatedAt: new Date('2025-08-12') },
  { id: 'FD-100', branchDeliveryId: 'BD-026', branchId: 'BR-MBA',  farmerId: 'UG-F-00311', farmerName: 'Turyamureeba James', phone: '0754500311', commodity: 'Coffee',   volume: 120, estimatedValue:   720_000, notes: '',              status: 'Rejected' as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-12'), updatedAt: new Date('2025-08-12') },

  // BD-027 (Gulu North, Maize, Wet Season)
  { id: 'FD-101', branchDeliveryId: 'BD-027', branchId: 'BR-GUL',  farmerId: 'UG-F-00405', farmerName: 'Olara Simon',        phone: '0701500405', commodity: 'Maize',    volume: 310, estimatedValue:   775_000, notes: '',              status: 'Approved' as const, season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-06-25'), updatedAt: new Date('2025-06-25') },
  { id: 'FD-102', branchDeliveryId: 'BD-027', branchId: 'BR-GUL',  farmerId: 'UG-F-00406', farmerName: 'Arach Betty',        phone: '0782500406', commodity: 'Maize',    volume: 290, estimatedValue:   725_000, notes: '',              status: 'Approved' as const, season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-06-25'), updatedAt: new Date('2025-06-25') },
  { id: 'FD-103', branchDeliveryId: 'BD-027', branchId: 'BR-GUL',  farmerId: 'UG-F-00407', farmerName: 'Oryem Joseph',       phone: '0772500407', commodity: 'Maize',    volume: 340, estimatedValue:   850_000, notes: 'Well dried',    status: 'Approved' as const, season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-06-25'), updatedAt: new Date('2025-06-25') },

  // BD-028 (Gulu North, Sunflower, Dry Season)
  { id: 'FD-104', branchDeliveryId: 'BD-028', branchId: 'BR-GUL',  farmerId: 'UG-F-00408', farmerName: 'Aber Christine',     phone: '0754500408', commodity: 'Sunflower',volume: 130, estimatedValue:   260_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-08'), updatedAt: new Date('2025-09-08') },
  { id: 'FD-105', branchDeliveryId: 'BD-028', branchId: 'BR-GUL',  farmerId: 'UG-F-00409', farmerName: 'Okello David',       phone: '0701500409', commodity: 'Sunflower',volume: 150, estimatedValue:   300_000, notes: 'Slight debris', status: 'Pending'  as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-08'), updatedAt: new Date('2025-09-08') },
  { id: 'FD-106', branchDeliveryId: 'BD-028', branchId: 'BR-GUL',  farmerId: 'UG-F-00410', farmerName: 'Lalam Grace',        phone: '0782500410', commodity: 'Sunflower',volume: 120, estimatedValue:   240_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-08'), updatedAt: new Date('2025-09-08') },

  // BD-029 (Fort Portal West, Maize, Dry Season)
  { id: 'FD-107', branchDeliveryId: 'BD-029', branchId: 'BR-FTP',  farmerId: 'UG-F-00606', farmerName: 'Kabasomi Prossy',    phone: '0772500606', commodity: 'Maize',    volume: 400, estimatedValue: 1_000_000, notes: '',              status: 'Approved' as const, season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-07-02'), updatedAt: new Date('2025-07-02') },
  { id: 'FD-108', branchDeliveryId: 'BD-029', branchId: 'BR-FTP',  farmerId: 'UG-F-00607', farmerName: 'Bwambale John',      phone: '0754500607', commodity: 'Maize',    volume: 350, estimatedValue:   875_000, notes: 'Grade A',       status: 'Approved' as const, season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-07-02'), updatedAt: new Date('2025-07-02') },
  { id: 'FD-109', branchDeliveryId: 'BD-029', branchId: 'BR-FTP',  farmerId: 'UG-F-00608', farmerName: 'Muhindo Agnes',      phone: '0701500608', commodity: 'Maize',    volume: 380, estimatedValue:   950_000, notes: '',              status: 'Approved' as const, season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-07-02'), updatedAt: new Date('2025-07-02') },

  // BD-030 (Fort Portal West, Coffee, Wet Season)
  { id: 'FD-110', branchDeliveryId: 'BD-030', branchId: 'BR-FTP',  farmerId: 'UG-F-00609', farmerName: 'Nyakato Margret',    phone: '0782500609', commodity: 'Coffee',   volume: 190, estimatedValue: 1_140_000, notes: '',              status: 'Pending'  as const, season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-09-15'), updatedAt: new Date('2025-09-15') },
  { id: 'FD-111', branchDeliveryId: 'BD-030', branchId: 'BR-FTP',  farmerId: 'UG-F-00610', farmerName: 'Tibihika Patrick',   phone: '0772500610', commodity: 'Coffee',   volume: 210, estimatedValue: 1_260_000, notes: 'Arabica AA',    status: 'Pending'  as const, season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-09-15'), updatedAt: new Date('2025-09-15') },
  { id: 'FD-112', branchDeliveryId: 'BD-030', branchId: 'BR-FTP',  farmerId: 'UG-F-00611', farmerName: 'Kabugho Lydia',      phone: '0754500611', commodity: 'Coffee',   volume: 170, estimatedValue: 1_020_000, notes: '',              status: 'Pending'  as const, season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-09-15'), updatedAt: new Date('2025-09-15') },

  // BD-031 (Adjumani East, Sesame, Dry Season)
  { id: 'FD-113', branchDeliveryId: 'BD-031', branchId: 'BR-ADJ',  farmerId: 'UG-F-00705', farmerName: 'Otema Richard',      phone: '0701500705', commodity: 'Sesame',   volume: 180, estimatedValue: 1_080_000, notes: 'Clean grain',   status: 'Approved' as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-07-09'), updatedAt: new Date('2025-07-09') },
  { id: 'FD-114', branchDeliveryId: 'BD-031', branchId: 'BR-ADJ',  farmerId: 'UG-F-00706', farmerName: 'Akello Rebecca',     phone: '0782500706', commodity: 'Sesame',   volume: 160, estimatedValue:   960_000, notes: '',              status: 'Approved' as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-07-09'), updatedAt: new Date('2025-07-09') },
  { id: 'FD-115', branchDeliveryId: 'BD-031', branchId: 'BR-ADJ',  farmerId: 'UG-F-00707', farmerName: 'Ochen Samuel',       phone: '0772500707', commodity: 'Sesame',   volume: 200, estimatedValue: 1_200_000, notes: '',              status: 'Approved' as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-07-09'), updatedAt: new Date('2025-07-09') },

  // BD-032 (Adjumani East, Beans, Wet Season)
  { id: 'FD-116', branchDeliveryId: 'BD-032', branchId: 'BR-ADJ',  farmerId: 'UG-F-00708', farmerName: 'Adong Harriet',      phone: '0754500708', commodity: 'Beans',    volume: 210, estimatedValue:   525_000, notes: '',              status: 'Pending'  as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-10-02'), updatedAt: new Date('2025-10-02') },
  { id: 'FD-117', branchDeliveryId: 'BD-032', branchId: 'BR-ADJ',  farmerId: 'UG-F-00709', farmerName: 'Omara Godfrey',      phone: '0701500709', commodity: 'Beans',    volume: 190, estimatedValue:   475_000, notes: 'Mixed grade',   status: 'Pending'  as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-10-02'), updatedAt: new Date('2025-10-02') },
  { id: 'FD-118', branchDeliveryId: 'BD-032', branchId: 'BR-ADJ',  farmerId: 'UG-F-00710', farmerName: 'Atto Susan',         phone: '0782500710', commodity: 'Beans',    volume: 175, estimatedValue:   437_500, notes: '',              status: 'Pending'  as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-10-02'), updatedAt: new Date('2025-10-02') },

  // BD-033 (Kiboga Central, Maize, Wet Season)
  { id: 'FD-119', branchDeliveryId: 'BD-033', branchId: 'BR-KIB',  farmerId: 'UG-F-00805', farmerName: 'Kizito Florence',    phone: '0772500805', commodity: 'Maize',    volume: 450, estimatedValue: 1_125_000, notes: '',              status: 'Approved' as const, season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-07-16'), updatedAt: new Date('2025-07-16') },
  { id: 'FD-120', branchDeliveryId: 'BD-033', branchId: 'BR-KIB',  farmerId: 'UG-F-00806', farmerName: 'Ssegawa Dan',        phone: '0754500806', commodity: 'Maize',    volume: 410, estimatedValue: 1_025_000, notes: 'Grade A',       status: 'Approved' as const, season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-07-16'), updatedAt: new Date('2025-07-16') },
  { id: 'FD-121', branchDeliveryId: 'BD-033', branchId: 'BR-KIB',  farmerId: 'UG-F-00807', farmerName: 'Nalule Joan',        phone: '0701500807', commodity: 'Maize',    volume: 430, estimatedValue: 1_075_000, notes: '',              status: 'Approved' as const, season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-07-16'), updatedAt: new Date('2025-07-16') },

  // BD-034 (Kiboga Central, Beans, Dry Season)
  { id: 'FD-122', branchDeliveryId: 'BD-034', branchId: 'BR-KIB',  farmerId: 'UG-F-00808', farmerName: 'Bukenya Charles',    phone: '0782500808', commodity: 'Beans',    volume: 260, estimatedValue:   650_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-22'), updatedAt: new Date('2025-09-22') },
  { id: 'FD-123', branchDeliveryId: 'BD-034', branchId: 'BR-KIB',  farmerId: 'UG-F-00809', farmerName: 'Namaswa Rose',       phone: '0772500809', commodity: 'Beans',    volume: 240, estimatedValue:   600_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-22'), updatedAt: new Date('2025-09-22') },
  { id: 'FD-124', branchDeliveryId: 'BD-034', branchId: 'BR-KIB',  farmerId: 'UG-F-00810', farmerName: 'Ssali Emmanuel',     phone: '0754500810', commodity: 'Beans',    volume: 220, estimatedValue:   550_000, notes: 'Well sorted',   status: 'Pending'  as const, season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-22'), updatedAt: new Date('2025-09-22') },

  // BD-035 (Lira Town, Millet, Wet Season)
  { id: 'FD-125', branchDeliveryId: 'BD-035', branchId: 'BR-LIR',  farmerId: 'UG-F-00906', farmerName: 'Alal Monica',        phone: '0701500906', commodity: 'Millet',   volume: 290, estimatedValue:   638_000, notes: '',              status: 'Approved' as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-07-23'), updatedAt: new Date('2025-07-23') },
  { id: 'FD-126', branchDeliveryId: 'BD-035', branchId: 'BR-LIR',  farmerId: 'UG-F-00907', farmerName: 'Omara William',      phone: '0782500907', commodity: 'Millet',   volume: 270, estimatedValue:   594_000, notes: '',              status: 'Approved' as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-07-23'), updatedAt: new Date('2025-07-23') },
  { id: 'FD-127', branchDeliveryId: 'BD-035', branchId: 'BR-LIR',  farmerId: 'UG-F-00908', farmerName: 'Akello Agnes',       phone: '0772500908', commodity: 'Millet',   volume: 310, estimatedValue:   682_000, notes: 'Clean grain',   status: 'Approved' as const, season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-07-23'), updatedAt: new Date('2025-07-23') },

  // BD-036 (Lira Town, Maize, Dry Season)
  { id: 'FD-128', branchDeliveryId: 'BD-036', branchId: 'BR-LIR',  farmerId: 'UG-F-00909', farmerName: 'Opio Kenneth',       phone: '0754500909', commodity: 'Maize',    volume: 340, estimatedValue:   850_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-10-09'), updatedAt: new Date('2025-10-09') },
  { id: 'FD-129', branchDeliveryId: 'BD-036', branchId: 'BR-LIR',  farmerId: 'UG-F-00910', farmerName: 'Adongo Irene',       phone: '0701500910', commodity: 'Maize',    volume: 310, estimatedValue:   775_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-10-09'), updatedAt: new Date('2025-10-09') },
  { id: 'FD-130', branchDeliveryId: 'BD-036', branchId: 'BR-LIR',  farmerId: 'UG-F-00911', farmerName: 'Olweny Patrick',     phone: '0782500911', commodity: 'Maize',    volume: 290, estimatedValue:   725_000, notes: 'Grade B',       status: 'Pending'  as const, season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-10-09'), updatedAt: new Date('2025-10-09') },

  // BD-037 (Mbale East, Maize, Wet Season)
  { id: 'FD-131', branchDeliveryId: 'BD-037', branchId: 'BR-MBA2', farmerId: 'UG-F-01006', farmerName: 'Nabirye Grace',      phone: '0772501006', commodity: 'Maize',    volume: 390, estimatedValue:   975_000, notes: '',              status: 'Approved' as const, season: 'Wet Season',  session: 'midday',    createdAt: new Date('2025-07-30'), updatedAt: new Date('2025-07-30') },
  { id: 'FD-132', branchDeliveryId: 'BD-037', branchId: 'BR-MBA2', farmerId: 'UG-F-01007', farmerName: 'Wafula George',      phone: '0754501007', commodity: 'Maize',    volume: 360, estimatedValue:   900_000, notes: 'Grade A',       status: 'Approved' as const, season: 'Wet Season',  session: 'midday',    createdAt: new Date('2025-07-30'), updatedAt: new Date('2025-07-30') },
  { id: 'FD-133', branchDeliveryId: 'BD-037', branchId: 'BR-MBA2', farmerId: 'UG-F-01008', farmerName: 'Nakibuuka Aisha',    phone: '0701501008', commodity: 'Maize',    volume: 370, estimatedValue:   925_000, notes: '',              status: 'Approved' as const, season: 'Wet Season',  session: 'midday',    createdAt: new Date('2025-07-30'), updatedAt: new Date('2025-07-30') },

  // BD-038 (Mbale East, Beans, Dry Season)
  { id: 'FD-134', branchDeliveryId: 'BD-038', branchId: 'BR-MBA2', farmerId: 'UG-F-01009', farmerName: 'Mudiba Tom',          phone: '0782501009', commodity: 'Beans',    volume: 310, estimatedValue:   775_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-10-24'), updatedAt: new Date('2025-10-24') },
  { id: 'FD-135', branchDeliveryId: 'BD-038', branchId: 'BR-MBA2', farmerId: 'UG-F-01010', farmerName: 'Namukhula Christine', phone: '0772501010', commodity: 'Beans',    volume: 280, estimatedValue:   700_000, notes: '',              status: 'Pending'  as const, season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-10-24'), updatedAt: new Date('2025-10-24') },
  { id: 'FD-136', branchDeliveryId: 'BD-038', branchId: 'BR-MBA2', farmerId: 'UG-F-01011', farmerName: 'Wekesa Joseph',       phone: '0754501011', commodity: 'Beans',    volume: 290, estimatedValue:   725_000, notes: 'Well sorted',   status: 'Pending'  as const, season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-10-24'), updatedAt: new Date('2025-10-24') },
];

// ── Farmer approval detail tables ─────────────────────────────────────────────

export const MOCK_INPUT_ALLOCATIONS = [
  { item: 'NPK Fertilizer',   quantity: '8 Bags',        value: 640000, issueDate: '18 Jan 2024', recoveryStatus: 'partial'  as const },
  { item: 'Coffee Seedlings', quantity: '250 Seedlings',  value: 375000, issueDate: '22 Jan 2024', recoveryStatus: 'settled'  as const },
  { item: 'Pesticide Kit',    quantity: '3 Kits',         value: 210000, issueDate: '04 Feb 2024', recoveryStatus: 'overdue'  as const },
];

export const MOCK_PRODUCE_DELIVERIES = [
  { crop: 'Coffee', weight: '420 Kg', collectionCentre: 'Kasese Coffee Growers Union', date: '16 Mar 2024', grade: 'A', value: 2520000 },
  { crop: 'Maize',  weight: '180 Kg', collectionCentre: 'Kasese Coffee Growers Union', date: '28 Mar 2024', grade: 'B', value:  324000 },
  { crop: 'Vanilla',weight: '32 Kg',  collectionCentre: 'Kasese Coffee Growers Union', date: '09 Apr 2024', grade: 'A', value:  960000 },
];

export const MOCK_BALANCE_LINES = [
  { description: 'NPK Fertilizer allocation',   principal: 640000, recovered: 360000, outstanding: 280000, dueDate: '30 Apr 2024', status: 'partial'  as const },
  { description: 'Coffee seedlings allocation', principal: 375000, recovered: 375000, outstanding:      0, dueDate: '15 Apr 2024', status: 'settled'  as const },
  { description: 'Pesticide kit allocation',    principal: 210000, recovered:      0, outstanding: 210000, dueDate: '20 Apr 2024', status: 'overdue'  as const },
];

export const MOCK_REPAYMENTS = [
  { date: '20 Mar 2024', method: 'Produce deduction', amount: 240000, reference: 'RCPT-2041', status: 'settled' as const },
  { date: '05 Apr 2024', method: 'Mobile money',      amount: 120000, reference: 'MM-88921',  status: 'settled' as const },
  { date: '18 Apr 2024', method: 'Branch cash desk',  amount:  75000, reference: 'BR-1209',   status: 'pending' as const },
];

export const MOCK_FARMER_NOTIFICATIONS = [
  { title: 'Farm verification visit scheduled',           channel: 'SMS',          date: '18 Apr 2024', status: 'open'   as const, readState: 'Unread' as const },
  { title: 'Outstanding pesticide kit balance reminder',  channel: 'SMS',          date: '15 Apr 2024', status: 'open'   as const, readState: 'Unread' as const },
  { title: 'Coffee seedlings allocation recovered',       channel: 'Branch notice', date: '12 Apr 2024', status: 'closed' as const, readState: 'Read'   as const },
];
