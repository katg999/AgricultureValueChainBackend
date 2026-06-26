// ── Branch-level mock data ────────────────────────────────────────────────────
//
// Covers: branch options, stock inventory, branch disbursements, stock requests,
// farmer input allocations, branch-level delivery batches, and payment batches.
// ─────────────────────────────────────────────────────────────────────────────

import { BranchDelivery } from '../../features/branch/collections/branch.delivery.model';
import { PaymentBatch } from '../../features/branch/finance/models/batch.models';

// ── Branches ──────────────────────────────────────────────────────────────────

export const MOCK_BRANCHES = [
  { id: 'BR-KLA', name: 'Kampala Central' },
  { id: 'BR-JIN', name: 'Jinja Branch'    },
  { id: 'BR-MBA', name: 'Mbarara Branch'  },
  { id: 'BR-GUL', name: 'Gulu Branch'     },
  { id: 'BR-MBL', name: 'Mbale West'      },
];

// ── Stock inventory ───────────────────────────────────────────────────────────

export const MOCK_INITIAL_STOCK = [
  {
    id: 'STK-001', name: 'NPK Fertilizer', category: 'FERTILIZER', categoryClass: 'fertilizer',
    quantity: 1250, unit: 'Bags', unitPrice: 180000, minThreshold: 200, stockStatus: 'healthy' as const,
    branchIds: ['BR-KLA', 'BR-JIN', 'BR-MBA', 'BR-MBL'],
    branchNames: ['Kampala Central', 'Jinja Branch', 'Mbarara Branch', 'Mbale Branch'],
    season: '2026A', updatedAt: '2026-05-12', supplierName: 'Agro Inputs Uganda', batchReference: 'BTC-2026-NPK-001',
  },
  {
    id: 'STK-002', name: 'Maize Seeds (Longe 5)', category: 'SEEDS', categoryClass: 'seeds',
    quantity: 2400, unit: 'Kgs', unitPrice: 15000, minThreshold: 500, stockStatus: 'healthy' as const,
    branchIds: MOCK_BRANCHES.map(b => b.id),
    branchNames: MOCK_BRANCHES.map(b => b.name),
    season: '2026A', updatedAt: '2026-05-11', supplierName: 'NARO Seed Centre', batchReference: 'BTC-2026-MAZ-004',
  },
  {
    id: 'STK-003', name: 'Spray Pumps (20L)', category: 'EQUIPMENT', categoryClass: 'equipment',
    quantity: 12, unit: 'Units', unitPrice: 130000, minThreshold: 15, stockStatus: 'low' as const,
    branchIds: ['BR-MBA', 'BR-GUL'],
    branchNames: ['Mbarara Branch', 'Gulu Branch'],
    season: '2026A', updatedAt: '2026-05-09', supplierName: 'Farm Tools Ltd', batchReference: 'BTC-2026-SPR-002',
  },
  {
    id: 'STK-004', name: 'Jute Sacks (100kg)', category: 'PACKAGING', categoryClass: 'packaging',
    quantity: 0, unit: 'Units', unitPrice: 2500, minThreshold: 500, stockStatus: 'out' as const,
    branchIds: MOCK_BRANCHES.map(b => b.id),
    branchNames: MOCK_BRANCHES.map(b => b.name),
    season: '2026A', updatedAt: '2026-05-08', supplierName: 'Harvest Packaging Co.', batchReference: 'BTC-2026-JUT-001',
  },
];

// ── Branch disbursements ──────────────────────────────────────────────────────

export const MOCK_INITIAL_BRANCH_DISBURSEMENTS = [
  { id: 'BD-1001', stockItemId: 'STK-001', branchId: 'BR-KLA', branchName: 'Kampala Central', itemName: 'NPK Fertilizer',        itemType: 'FERTILIZER', quantity:  80, unit: 'Bags',  totalValue: 14400000, issueDate: '2026-05-18', status: 'received' as const },
  { id: 'BD-1002', stockItemId: 'STK-002', branchId: 'BR-GUL', branchName: 'Gulu Branch',     itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 300, unit: 'Kgs',   totalValue:  4500000, issueDate: '2026-05-19', status: 'issued'   as const },
  { id: 'BD-1003', stockItemId: 'STK-003', branchId: 'BR-MBA', branchName: 'Mbarara Branch',  itemName: 'Spray Pumps (20L)',     itemType: 'EQUIPMENT',  quantity:   4, unit: 'Units', totalValue:   520000, issueDate: '2026-05-20', status: 'received' as const },
  // Mbale West — visible to dev mock branch user (BR-MBL)
  { id: 'BD-1004', stockItemId: 'STK-002', branchId: 'BR-MBL', branchName: 'Mbale West',      itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 200, unit: 'Kgs',   totalValue:  3000000, issueDate: '2026-05-21', status: 'issued'   as const },
];

// ── Stock requests ────────────────────────────────────────────────────────────

export const MOCK_INITIAL_STOCK_REQUESTS = [
  { id: 'REQ-1001', itemName: 'NPK Fertilizer',        category: 'FERTILIZER', unit: 'Bags',  quantity:  50, urgency: 'high'   as const, preferredDeliveryDate: '2026-06-20', reason: 'Seasonal demand increase from registered farmers',       submittedAt: '2026-06-08', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'approved'  as const, reviewedAt: '2026-06-09', reviewedBy: 'Coop Admin' },
  { id: 'REQ-1002', itemName: 'Jute Sacks (100kg)',    category: 'PACKAGING',  unit: 'Units', quantity: 200, urgency: 'medium' as const, preferredDeliveryDate: '2026-06-25', reason: 'Branch stock depleted after harvest collection',          submittedAt: '2026-06-09', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'pending'   as const },
  { id: 'REQ-1003', itemName: 'Maize Seeds (Longe 5)', category: 'SEEDS',      unit: 'Kgs',   quantity: 100, urgency: 'low'    as const, preferredDeliveryDate: '2026-07-01', reason: 'Next planting season preparation',                        submittedAt: '2026-06-10', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'rejected'  as const, reviewedAt: '2026-06-11', reviewedBy: 'Coop Admin', rejectionReason: 'Insufficient cooperative stock — resubmit in July' },
  { id: 'REQ-1004', itemName: 'Spray Pumps (20L)',     category: 'EQUIPMENT',  unit: 'Units', quantity:   5, urgency: 'high'   as const, preferredDeliveryDate: '2026-06-18', reason: 'Three existing pumps broken; field spraying blocked',      submittedAt: '2026-06-05', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'fulfilled' as const, reviewedAt: '2026-06-06', reviewedBy: 'Coop Admin', fulfilledAt: '2026-06-07' },
  { id: 'REQ-1005', itemName: 'Protective Gloves',     category: 'TOOLS',      unit: 'Pieces',quantity:  40, urgency: 'low'    as const, preferredDeliveryDate: '2026-06-30', reason: 'Safety equipment for input distribution staff',            submittedAt: '2026-06-11', submittedBy: 'Branch Staff', branchId: 'BR-MBL', branchName: 'Mbale West', status: 'pending'   as const },
];

// ── Farmer input allocations ──────────────────────────────────────────────────

export const MOCK_INITIAL_FARMER_ALLOCATIONS = [
  { id: 'AL-1001', stockItemId: 'STK-001', farmerId: 'UG-F-01001', farmerName: 'Amina Nakato',   branchId: 'BR-KLA', branchName: 'Kampala Central', itemName: 'NPK Fertilizer',        itemType: 'FERTILIZER', quantity:  4, unit: 'Bags',  totalValue:  720000, issueDate: '2026-05-21', outstanding:       0, status: 'settled' as const },
  { id: 'AL-1002', stockItemId: 'STK-002', farmerId: 'UG-F-01002', farmerName: 'Moses Okello',   branchId: 'BR-GUL', branchName: 'Gulu Branch',     itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 30, unit: 'Kgs',   totalValue:  450000, issueDate: '2026-05-22', outstanding:  150000, status: 'partial' as const },
  { id: 'AL-1003', stockItemId: 'STK-003', farmerId: 'UG-F-01003', farmerName: 'Sarah Namutebi', branchId: 'BR-JIN', branchName: 'Jinja Branch',    itemName: 'Spray Pumps (20L)',     itemType: 'EQUIPMENT',  quantity:  1, unit: 'Units', totalValue:  130000, issueDate: '2026-05-23', outstanding:  130000, status: 'overdue' as const },
  // Mbale West — names match MOCK_FARMER_LIST; visible to dev mock branch user (BR-MBL)
  { id: 'AL-1004', stockItemId: 'STK-002', farmerId: 'UG-F-01005', farmerName: 'Grace Atim',     branchId: 'BR-MBL', branchName: 'Mbale West',      itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 25, unit: 'Kgs',   totalValue:  375000, issueDate: '2026-05-22', outstanding:  375000, status: 'partial' as const },
  { id: 'AL-1005', stockItemId: 'STK-001', farmerId: 'UG-F-01007', farmerName: 'Dennis Ojok',    branchId: 'BR-MBL', branchName: 'Mbale West',      itemName: 'NPK Fertilizer',        itemType: 'FERTILIZER', quantity:  5, unit: 'Bags',  totalValue:  900000, issueDate: '2026-05-24', outstanding:  450000, status: 'partial' as const },
  { id: 'AL-1006', stockItemId: 'STK-002', farmerId: 'UG-F-01008', farmerName: 'Rose Atukunda',  branchId: 'BR-MBL', branchName: 'Mbale West',      itemName: 'Maize Seeds (Longe 5)', itemType: 'SEEDS',      quantity: 20, unit: 'Kgs',   totalValue:  300000, issueDate: '2026-05-25', outstanding:  300000, status: 'overdue' as const },
];

// ── Branch delivery batches ───────────────────────────────────────────────────

export const MOCK_BRANCH_DELIVERIES: BranchDelivery[] = [
  // ── Wet Season ──────────────────────────────────────────────────────────────
  { id: 'BD-001', branchId: 'BR-KLA', branchName: 'Kampala Central',   farmerCount: 6, commodity: 'Maize',    volume: 12400, estimatedValue: 31000000, status: 'Approved', season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-12') },
  { id: 'BD-002', branchId: 'BR-JIN', branchName: 'Jinja East',        farmerCount: 5, commodity: 'Coffee',   volume:  3200, estimatedValue: 19200000, status: 'Pending',  season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },
  { id: 'BD-003', branchId: 'BR-MBA', branchName: 'Mbarara South',     farmerCount: 5, commodity: 'Beans',    volume:  8750, estimatedValue: 21875000, status: 'Pending',  season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },
  { id: 'BD-006', branchId: 'BR-FTP', branchName: 'Fort Portal West',  farmerCount: 5, commodity: 'Tea',      volume:  6800, estimatedValue: 17000000, status: 'Pending',  season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },
  { id: 'BD-007', branchId: 'BR-ADJ', branchName: 'Adjumani East',     farmerCount: 4, commodity: 'Maize',    volume:  5100, estimatedValue: 12750000, status: 'Approved', season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-26') },
  // ── Dry Season ──────────────────────────────────────────────────────────────
  { id: 'BD-004', branchId: 'BR-GUL', branchName: 'Gulu North',        farmerCount: 4, commodity: 'Sesame',   volume:  4100, estimatedValue: 12300000, status: 'Rejected', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-09') },
  { id: 'BD-005', branchId: 'BR-MBL', branchName: 'Mbale West',        farmerCount: 6, commodity: 'Sunflower',volume:  9300, estimatedValue: 18600000, status: 'Approved', season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-21') },
  { id: 'BD-008', branchId: 'BR-KIB', branchName: 'Kiboga Central',    farmerCount: 4, commodity: 'Vanilla',  volume:   820, estimatedValue: 24600000, status: 'Approved', season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-13') },
  { id: 'BD-009', branchId: 'BR-LIR', branchName: 'Lira Town',         farmerCount: 5, commodity: 'Sesame',   volume:  6200, estimatedValue: 15500000, status: 'Pending',  season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },
  { id: 'BD-010', branchId: 'BR-MBA2',branchName: 'Mbale East',        farmerCount: 5, commodity: 'Coffee',   volume:  2800, estimatedValue: 16800000, status: 'Approved', season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-20') },
  // ── Mbale West (BR-MBL) — additional delivery history ───────────────────────
  { id: 'BD-011', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 3, commodity: 'Coffee',    volume:  655, estimatedValue:  3930000, status: 'Approved', season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-06-05'), updatedAt: new Date('2025-06-06') },
  { id: 'BD-012', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 4, commodity: 'Maize',     volume: 1070, estimatedValue:  2675000, status: 'Pending',  season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-06-20'), updatedAt: new Date('2025-06-20') },
  { id: 'BD-013', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 3, commodity: 'Beans',     volume:  525, estimatedValue:  1312500, status: 'Approved', season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-07-10'), updatedAt: new Date('2025-07-11') },
  { id: 'BD-014', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 3, commodity: 'Sesame',    volume:  425, estimatedValue:  2550000, status: 'Pending',  season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-07-25'), updatedAt: new Date('2025-07-25') },
  { id: 'BD-015', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 4, commodity: 'Sunflower', volume:  835, estimatedValue:  2505000, status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-08-08'), updatedAt: new Date('2025-08-09') },
  { id: 'BD-016', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 3, commodity: 'Rice',      volume:  840, estimatedValue:  2940000, status: 'Rejected', season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-08-22'), updatedAt: new Date('2025-08-23') },
  { id: 'BD-017', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 3, commodity: 'Sorghum',   volume:  925, estimatedValue:  1665000, status: 'Pending',  season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-09-05'), updatedAt: new Date('2025-09-05') },
  { id: 'BD-018', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 3, commodity: 'Millet',    volume:  635, estimatedValue:  1397000, status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-09-19'), updatedAt: new Date('2025-09-20') },
  { id: 'BD-019', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 4, commodity: 'Coffee',    volume:  775, estimatedValue:  4650000, status: 'Approved', season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-10-03'), updatedAt: new Date('2025-10-04') },
  { id: 'BD-020', branchId: 'BR-MBL', branchName: 'Mbale West', farmerCount: 3, commodity: 'Maize',     volume:  825, estimatedValue:  2062500, status: 'Pending',  season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-10-17'), updatedAt: new Date('2025-10-17') },
  // ── Cross-branch batches (cooperative view) ──────────────────────────────────
  { id: 'BD-021', branchId: 'BR-KLA',  branchName: 'Kampala Central', farmerCount: 7, commodity: 'Beans',    volume: 11000, estimatedValue: 24200000, status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-06-04'), updatedAt: new Date('2025-06-05') },
  { id: 'BD-022', branchId: 'BR-KLA',  branchName: 'Kampala Central', farmerCount: 5, commodity: 'Coffee',   volume:  2100, estimatedValue: 12600000, status: 'Pending',  season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-07-14'), updatedAt: new Date('2025-07-14') },
  { id: 'BD-023', branchId: 'BR-JIN',  branchName: 'Jinja East',      farmerCount: 6, commodity: 'Maize',    volume:  9800, estimatedValue: 24500000, status: 'Approved', season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-06-11'), updatedAt: new Date('2025-06-12') },
  { id: 'BD-024', branchId: 'BR-JIN',  branchName: 'Jinja East',      farmerCount: 4, commodity: 'Tea',      volume:  5200, estimatedValue: 13000000, status: 'Pending',  season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-08-01'), updatedAt: new Date('2025-08-01') },
  { id: 'BD-025', branchId: 'BR-MBA',  branchName: 'Mbarara South',   farmerCount: 7, commodity: 'Maize',    volume: 13500, estimatedValue: 33750000, status: 'Approved', season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-06-18'), updatedAt: new Date('2025-06-19') },
  { id: 'BD-026', branchId: 'BR-MBA',  branchName: 'Mbarara South',   farmerCount: 3, commodity: 'Coffee',   volume:  1800, estimatedValue: 10800000, status: 'Rejected', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-08-12'), updatedAt: new Date('2025-08-13') },
  { id: 'BD-027', branchId: 'BR-GUL',  branchName: 'Gulu North',      farmerCount: 5, commodity: 'Maize',    volume:  8200, estimatedValue: 20500000, status: 'Approved', season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-06-25'), updatedAt: new Date('2025-06-26') },
  { id: 'BD-028', branchId: 'BR-GUL',  branchName: 'Gulu North',      farmerCount: 4, commodity: 'Sunflower',volume:  3900, estimatedValue:  7800000, status: 'Pending',  season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-09-08'), updatedAt: new Date('2025-09-08') },
  { id: 'BD-029', branchId: 'BR-FTP',  branchName: 'Fort Portal West',farmerCount: 6, commodity: 'Maize',    volume: 10200, estimatedValue: 25500000, status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-07-02'), updatedAt: new Date('2025-07-03') },
  { id: 'BD-030', branchId: 'BR-FTP',  branchName: 'Fort Portal West',farmerCount: 5, commodity: 'Coffee',   volume:  2600, estimatedValue: 15600000, status: 'Pending',  season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-09-15'), updatedAt: new Date('2025-09-15') },
  { id: 'BD-031', branchId: 'BR-ADJ',  branchName: 'Adjumani East',   farmerCount: 5, commodity: 'Sesame',   volume:  4400, estimatedValue: 13200000, status: 'Approved', season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-07-09'), updatedAt: new Date('2025-07-10') },
  { id: 'BD-032', branchId: 'BR-ADJ',  branchName: 'Adjumani East',   farmerCount: 3, commodity: 'Beans',    volume:  5800, estimatedValue: 14500000, status: 'Pending',  season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-10-02'), updatedAt: new Date('2025-10-02') },
  { id: 'BD-033', branchId: 'BR-KIB',  branchName: 'Kiboga Central',  farmerCount: 7, commodity: 'Maize',    volume: 14000, estimatedValue: 35000000, status: 'Approved', season: 'Wet Season', session: 'morning',   createdAt: new Date('2025-07-16'), updatedAt: new Date('2025-07-17') },
  { id: 'BD-034', branchId: 'BR-KIB',  branchName: 'Kiboga Central',  farmerCount: 4, commodity: 'Beans',    volume:  7200, estimatedValue: 18000000, status: 'Pending',  season: 'Dry Season', session: 'midday',    createdAt: new Date('2025-09-22'), updatedAt: new Date('2025-09-22') },
  { id: 'BD-035', branchId: 'BR-LIR',  branchName: 'Lira Town',       farmerCount: 5, commodity: 'Millet',   volume:  7800, estimatedValue: 11700000, status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-07-23'), updatedAt: new Date('2025-07-24') },
  { id: 'BD-036', branchId: 'BR-LIR',  branchName: 'Lira Town',       farmerCount: 6, commodity: 'Maize',    volume:  9400, estimatedValue: 23500000, status: 'Pending',  season: 'Dry Season', session: 'morning',   createdAt: new Date('2025-10-09'), updatedAt: new Date('2025-10-09') },
  { id: 'BD-037', branchId: 'BR-MBA2', branchName: 'Mbale East',      farmerCount: 6, commodity: 'Maize',    volume: 11200, estimatedValue: 28000000, status: 'Approved', season: 'Wet Season', session: 'midday',    createdAt: new Date('2025-07-30'), updatedAt: new Date('2025-07-31') },
  { id: 'BD-038', branchId: 'BR-MBA2', branchName: 'Mbale East',      farmerCount: 5, commodity: 'Beans',    volume:  8600, estimatedValue: 21500000, status: 'Pending',  season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-10-24'), updatedAt: new Date('2025-10-24') },
];

// ── Branch-level payment batches ──────────────────────────────────────────────

export const MOCK_PAYMENT_BATCHES: PaymentBatch[] = [
  {
    id: 'BATCH-001',
    batchName: 'August 2024 Coffee Run',
    season: 'Season A 2024',
    openingDate: '2024-08-01',
    closingDate: '2024-08-31',
    commodityFilter: 'Coffee',
    branch: 'Mbale West',
    branchId: 'BR-MBL',
    status: 'Approved',
    totalAmount: 4_800_000,
    farmerCount: 12,
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'BATCH-002',
    batchName: 'September 2024 Payment Run',
    season: 'Season B 2024',
    openingDate: '2024-09-01',
    closingDate: '2024-09-30',
    commodityFilter: 'All Commodities',
    branch: 'Mbale West',
    branchId: 'BR-MBL',
    status: 'Draft',
    totalAmount: 1_920_000,
    farmerCount: 5,
    createdAt: new Date('2024-10-02'),
  },
  {
    id: 'BATCH-003',
    batchName: 'Kasese Maize October',
    season: 'Season B 2024',
    openingDate: '2024-10-01',
    closingDate: '2024-10-15',
    commodityFilter: 'Maize',
    branch: 'Kasese',
    branchId: 'BR-KAS',
    status: 'Pending Approval',
    totalAmount: 595_000,
    farmerCount: 2,
    createdAt: new Date('2024-10-16'),
  },
];
