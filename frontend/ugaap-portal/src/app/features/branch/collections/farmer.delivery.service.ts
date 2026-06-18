import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { catchError, startWith, tap, timeout } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { FarmerDelivery, FarmerDeliveryFormData } from './farmer.delivery.model';
import { BranchDeliveryService } from './branch.delivery.service';
// Replaced CommodityPricingService with the new unified pricing service that
// supports both flat and grade-based pricing modes.
import { CooperativePricingService } from '../../../core/services/cooperative-pricing.service';

// Input loan recovery amounts for specific farmers (populated via Issue Input).
// Keyed by delivery ID — only farmers who received inputs have an entry.
const INPUT_LOAN_DEDUCTIONS: Record<string, number> = {
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

@Injectable({ providedIn: 'root' })
export class FarmerDeliveryService {

  private readonly seed: FarmerDelivery[] = [
    // ── Wet Season — BD-001 (Kampala Central, Maize) ────────────────────────
    { id: 'FD-001', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00101', farmerName: 'Akello Grace',      phone: '0772100001', commodity: 'Maize',    volume: 320,  estimatedValue:   800_000, notes: 'Grade A quality',   status: 'Approved', season: 'Wet Season', session: 'morning', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
    { id: 'FD-002', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00102', farmerName: 'Okello James',      phone: '0754200002', commodity: 'Maize',    volume: 410,  estimatedValue: 1_025_000, notes: '',                  status: 'Approved', season: 'Wet Season', session: 'midday', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
    { id: 'FD-003', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00103', farmerName: 'Achen Beatrice',    phone: '0701300103', commodity: 'Maize',    volume: 290,  estimatedValue:   725_000, notes: 'Slight moisture',   status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },

    // ── Wet Season — BD-002 (Jinja East, Coffee) ────────────────────────────
    { id: 'FD-004', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00201', farmerName: 'Namukasa Fatuma',   phone: '0782400201', commodity: 'Coffee',   volume: 180,  estimatedValue: 1_080_000, notes: 'Dried beans',       status: 'Pending',  season: 'Wet Season', session: 'morning', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },
    { id: 'FD-005', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00202', farmerName: 'Waiswa Stephen',    phone: '0772100202', commodity: 'Coffee',   volume: 220,  estimatedValue: 1_320_000, notes: '',                  status: 'Pending',  season: 'Wet Season', session: 'midday', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },

    // ── Wet Season — BD-003 (Mbarara South, Beans) ──────────────────────────
    { id: 'FD-006', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00301', farmerName: 'Tukwasibwe Robert', phone: '0754200301', commodity: 'Beans',    volume: 200,  estimatedValue:   500_000, notes: '',                  status: 'Pending',  season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },
    { id: 'FD-007', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00302', farmerName: 'Asiimwe Doreen',    phone: '0701300302', commodity: 'Beans',    volume: 155,  estimatedValue:   387_500, notes: 'Well sorted',       status: 'Pending',  season: 'Wet Season', session: 'morning', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },

    // ── Wet Season — BD-006 (Fort Portal West, Tea) ─────────────────────────
    { id: 'FD-008', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00601', farmerName: 'Birungi Harriet',   phone: '0772100601', commodity: 'Tea',      volume: 240,  estimatedValue:   600_000, notes: 'Fresh leaf',        status: 'Pending',  season: 'Wet Season', session: 'midday', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },
    { id: 'FD-009', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00602', farmerName: 'Ntegeka Paul',      phone: '0754200602', commodity: 'Tea',      volume: 310,  estimatedValue:   775_000, notes: '',                  status: 'Pending',  season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },
    { id: 'FD-010', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00603', farmerName: 'Kagaba Prossy',     phone: '0701300603', commodity: 'Tea',      volume: 195,  estimatedValue:   487_500, notes: 'Slightly wilted',   status: 'Pending',  season: 'Wet Season', session: 'morning', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },

    // ── Wet Season — BD-007 (Adjumani East, Maize) ──────────────────────────
    { id: 'FD-011', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00701', farmerName: 'Ongom Felix',       phone: '0782400701', commodity: 'Maize',    volume: 275,  estimatedValue:   687_500, notes: '',                  status: 'Approved', season: 'Wet Season', session: 'midday', createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },
    { id: 'FD-012', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00702', farmerName: 'Adola Christine',   phone: '0772100702', commodity: 'Maize',    volume: 190,  estimatedValue:   475_000, notes: 'Grade B',           status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },

    // ── Dry Season — BD-004 (Gulu North, Sesame) ────────────────────────────
    { id: 'FD-013', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00401', farmerName: 'Drani Moses',       phone: '0754200401', commodity: 'Sesame',   volume: 185,  estimatedValue: 1_110_000, notes: 'Clean grain',       status: 'Approved', season: 'Dry Season', session: 'morning', createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },
    { id: 'FD-014', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00402', farmerName: 'Oryema Denis',      phone: '0701300402', commodity: 'Sesame',   volume: 140,  estimatedValue:   840_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'midday', createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },

    // ── Dry Season — BD-005 (Mbale West, Sunflower) — dev mock user's branch ─
    { id: 'FD-015', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00501', farmerName: 'Oryem Patrick',     phone: '0782400501', commodity: 'Sunflower', volume: 260, estimatedValue:   780_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
    { id: 'FD-016', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00502', farmerName: 'Opio Geoffrey',     phone: '0772100502', commodity: 'Sunflower', volume: 210, estimatedValue:   630_000, notes: 'Slightly under-dry', status: 'Approved', season: 'Dry Season', session: 'morning', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },

    // ── Dry Season — BD-008 (Kiboga Central, Vanilla) ───────────────────────
    { id: 'FD-017', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00801', farmerName: 'Ssemakula John',    phone: '0754200801', commodity: 'Vanilla',  volume:  48,  estimatedValue: 4_800_000, notes: 'Export grade',      status: 'Approved', season: 'Dry Season', session: 'midday', createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },
    { id: 'FD-018', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00802', farmerName: 'Katende Robert',    phone: '0701300802', commodity: 'Vanilla',  volume:  36,  estimatedValue: 3_600_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },

    // ── Dry Season — BD-009 (Lira Town, Sesame) ─────────────────────────────
    { id: 'FD-019', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00901', farmerName: 'Atim Lydia',        phone: '0782400901', commodity: 'Sesame',   volume: 170,  estimatedValue: 1_020_000, notes: '',                  status: 'Pending',  season: 'Dry Season', session: 'morning', createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },
    { id: 'FD-020', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00902', farmerName: 'Okot Geoffrey',     phone: '0772100902', commodity: 'Sesame',   volume: 130,  estimatedValue:   780_000, notes: 'Re-dried',          status: 'Pending',  season: 'Dry Season', session: 'midday', createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },

    // ── Dry Season — BD-010 (Mbale East, Coffee) ────────────────────────────
    { id: 'FD-021', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01001', farmerName: 'Wafula Emmanuel',   phone: '0754201001', commodity: 'Coffee',   volume: 200,  estimatedValue: 1_200_000, notes: 'Arabica AA',        status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },
    { id: 'FD-022', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01002', farmerName: 'Nakato Prossy',     phone: '0701301002', commodity: 'Coffee',   volume: 155,  estimatedValue:   930_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'morning', createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },

    // ── Extra farmers added to existing batches — keeps farmerCount on each
    // BranchDelivery in branch.delivery.service.ts in sync with these rows. ──

    // BD-001 (Kampala Central, Maize) — 3 more
    { id: 'FD-023', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00104', farmerName: 'Nsubuga Edward',    phone: '0701400104', commodity: 'Maize',    volume: 350,  estimatedValue:   875_000, notes: 'Well dried',        status: 'Approved', season: 'Wet Season', session: 'midday', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
    { id: 'FD-024', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00105', farmerName: 'Mukasa Diana',      phone: '0772400105', commodity: 'Maize',    volume: 275,  estimatedValue:   687_500, notes: '',                  status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },
    { id: 'FD-025', branchDeliveryId: 'BD-001', branchId: 'BR-KLA',  farmerId: 'UG-F-00106', farmerName: 'Ssali Vincent',     phone: '0754400106', commodity: 'Maize',    volume: 310,  estimatedValue:   775_000, notes: 'Grade A',           status: 'Approved', season: 'Wet Season', session: 'morning', createdAt: new Date('2025-05-10'), updatedAt: new Date('2025-05-10') },

    // BD-002 (Jinja East, Coffee) — 3 more
    { id: 'FD-026', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00203', farmerName: 'Mukisa Ronald',     phone: '0782400203', commodity: 'Coffee',   volume: 195,  estimatedValue: 1_170_000, notes: '',                  status: 'Pending',  season: 'Wet Season', session: 'midday', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },
    { id: 'FD-027', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00204', farmerName: 'Babirye Sarah',     phone: '0701400204', commodity: 'Coffee',   volume: 160,  estimatedValue:   960_000, notes: 'Wet parchment',     status: 'Pending',  season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },
    { id: 'FD-028', branchDeliveryId: 'BD-002', branchId: 'BR-JIN',  farmerId: 'UG-F-00205', farmerName: 'Isabirye Moses',    phone: '0772400205', commodity: 'Coffee',   volume: 210,  estimatedValue: 1_260_000, notes: '',                  status: 'Pending',  season: 'Wet Season', session: 'morning', createdAt: new Date('2025-05-15'), updatedAt: new Date('2025-05-15') },

    // BD-003 (Mbarara South, Beans) — 3 more
    { id: 'FD-029', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00303', farmerName: 'Kyomuhendo Esther', phone: '0754400303', commodity: 'Beans',    volume: 175,  estimatedValue:   437_500, notes: '',                  status: 'Pending',  season: 'Wet Season', session: 'midday', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },
    { id: 'FD-030', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00304', farmerName: 'Byaruhanga Patrick', phone: '0701400304', commodity: 'Beans',   volume: 140,  estimatedValue:   350_000, notes: 'Mixed grade',       status: 'Pending',  season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },
    { id: 'FD-031', branchDeliveryId: 'BD-003', branchId: 'BR-MBA',  farmerId: 'UG-F-00305', farmerName: 'Nyangoma Joy',      phone: '0782400305', commodity: 'Beans',    volume: 165,  estimatedValue:   412_500, notes: '',                  status: 'Pending',  season: 'Wet Season', session: 'morning', createdAt: new Date('2025-05-18'), updatedAt: new Date('2025-05-18') },

    // BD-004 (Gulu North, Sesame) — 2 more
    { id: 'FD-032', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00403', farmerName: 'Acaye Simon',       phone: '0772400403', commodity: 'Sesame',   volume: 160,  estimatedValue:   960_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'midday', createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },
    { id: 'FD-033', branchDeliveryId: 'BD-004', branchId: 'BR-GUL',  farmerId: 'UG-F-00404', farmerName: 'Lamwaka Susan',     phone: '0754400404', commodity: 'Sesame',   volume: 130,  estimatedValue:   780_000, notes: 'Clean grain',       status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-08'), updatedAt: new Date('2025-05-08') },

    // BD-005 (Mbale West, Sunflower) — dev mock user's branch — 4 more
    { id: 'FD-034', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00503', farmerName: 'Nambozo Sarah',     phone: '0701400503', commodity: 'Sunflower', volume: 230, estimatedValue:   690_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'morning', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
    { id: 'FD-035', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00504', farmerName: 'Wabwire Tom',       phone: '0782400504', commodity: 'Sunflower', volume: 195, estimatedValue:   585_000, notes: 'Slight debris',     status: 'Approved', season: 'Dry Season', session: 'midday', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
    { id: 'FD-036', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00505', farmerName: 'Namutebi Joan',     phone: '0772400505', commodity: 'Sunflower', volume: 280, estimatedValue:   840_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },
    { id: 'FD-037', branchDeliveryId: 'BD-005', branchId: 'BR-MBL',  farmerId: 'UG-F-00506', farmerName: 'Mafabi Andrew',     phone: '0754400506', commodity: 'Sunflower', volume: 150, estimatedValue:   450_000, notes: 'Re-screened',       status: 'Approved', season: 'Dry Season', session: 'morning', createdAt: new Date('2025-05-20'), updatedAt: new Date('2025-05-20') },

    // BD-006 (Fort Portal West, Tea) — 2 more
    { id: 'FD-038', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00604', farmerName: 'Kabugo Allan',      phone: '0701400604', commodity: 'Tea',      volume: 220,  estimatedValue:   550_000, notes: '',                  status: 'Pending',  season: 'Wet Season', session: 'midday', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },
    { id: 'FD-039', branchDeliveryId: 'BD-006', branchId: 'BR-FTP',  farmerId: 'UG-F-00605', farmerName: 'Biira Patience',    phone: '0782400605', commodity: 'Tea',      volume: 260,  estimatedValue:   650_000, notes: 'Fresh leaf',        status: 'Pending',  season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-05-22'), updatedAt: new Date('2025-05-22') },

    // BD-007 (Adjumani East, Maize) — 2 more
    { id: 'FD-040', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00703', farmerName: 'Lokule Peter',      phone: '0772400703', commodity: 'Maize',    volume: 230,  estimatedValue:   575_000, notes: '',                  status: 'Approved', season: 'Wet Season', session: 'morning', createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },
    { id: 'FD-041', branchDeliveryId: 'BD-007', branchId: 'BR-ADJ',  farmerId: 'UG-F-00704', farmerName: 'Acidri Mary',       phone: '0754400704', commodity: 'Maize',    volume: 185,  estimatedValue:   462_500, notes: 'Grade A',           status: 'Approved', season: 'Wet Season', session: 'midday', createdAt: new Date('2025-05-25'), updatedAt: new Date('2025-05-25') },

    // BD-008 (Kiboga Central, Vanilla) — 2 more
    { id: 'FD-042', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00803', farmerName: 'Lukwago Tom',       phone: '0701400803', commodity: 'Vanilla',  volume:  30,  estimatedValue: 3_000_000, notes: 'Cured beans',       status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },
    { id: 'FD-043', branchDeliveryId: 'BD-008', branchId: 'BR-KIB',  farmerId: 'UG-F-00804', farmerName: 'Namugga Sylvia',    phone: '0782400804', commodity: 'Vanilla',  volume:  25,  estimatedValue: 2_500_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'morning', createdAt: new Date('2025-05-12'), updatedAt: new Date('2025-05-12') },

    // BD-009 (Lira Town, Sesame) — 3 more
    { id: 'FD-044', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00903', farmerName: 'Akena Charles',     phone: '0772400903', commodity: 'Sesame',   volume: 145,  estimatedValue:   870_000, notes: '',                  status: 'Pending',  season: 'Dry Season', session: 'midday', createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },
    { id: 'FD-045', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00904', farmerName: 'Adong Susan',       phone: '0754400904', commodity: 'Sesame',   volume: 120,  estimatedValue:   720_000, notes: 'Re-dried',          status: 'Pending',  season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },
    { id: 'FD-046', branchDeliveryId: 'BD-009', branchId: 'BR-LIR',  farmerId: 'UG-F-00905', farmerName: 'Okello Brian',      phone: '0701400905', commodity: 'Sesame',   volume: 165,  estimatedValue:   990_000, notes: '',                  status: 'Pending',  season: 'Dry Season', session: 'morning', createdAt: new Date('2025-05-16'), updatedAt: new Date('2025-05-16') },

    // BD-010 (Mbale East, Coffee) — 3 more
    { id: 'FD-047', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01003', farmerName: 'Nabwire Grace',     phone: '0782401003', commodity: 'Coffee',   volume: 180,  estimatedValue: 1_080_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'midday', createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },
    { id: 'FD-048', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01004', farmerName: 'Wamala Henry',      phone: '0772401004', commodity: 'Coffee',   volume: 145,  estimatedValue:   870_000, notes: 'Arabica AA',        status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },
    { id: 'FD-049', branchDeliveryId: 'BD-010', branchId: 'BR-MBA2', farmerId: 'UG-F-01005', farmerName: 'Mbabazi Irene',     phone: '0754401005', commodity: 'Coffee',   volume: 210,  estimatedValue: 1_260_000, notes: '',                  status: 'Approved', season: 'Dry Season', session: 'morning', createdAt: new Date('2025-05-19'), updatedAt: new Date('2025-05-19') },

    // ── Mbale West (BR-MBL) — additional delivery history, matching BD-011..BD-020 ──

    // BD-011 (Mbale West, Coffee, Wet Season)
    { id: 'FD-050', branchDeliveryId: 'BD-011', branchId: 'BR-MBL', farmerId: 'UG-F-00507', farmerName: 'Masaba Richard',    phone: '0772500507', commodity: 'Coffee',   volume: 280, estimatedValue: 1_680_000, notes: '',              status: 'Approved', season: 'Wet Season', session: 'midday', createdAt: new Date('2025-06-05'), updatedAt: new Date('2025-06-05') },
    { id: 'FD-051', branchDeliveryId: 'BD-011', branchId: 'BR-MBL', farmerId: 'UG-F-00508', farmerName: 'Nabirye Christine', phone: '0754500508', commodity: 'Coffee',   volume: 210, estimatedValue: 1_260_000, notes: 'Arabica AA',    status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-06-05'), updatedAt: new Date('2025-06-05') },
    { id: 'FD-052', branchDeliveryId: 'BD-011', branchId: 'BR-MBL', farmerId: 'UG-F-00509', farmerName: 'Wanyama Joseph',    phone: '0701500509', commodity: 'Coffee',   volume: 165, estimatedValue:   990_000, notes: '',              status: 'Approved', season: 'Wet Season', session: 'morning', createdAt: new Date('2025-06-05'), updatedAt: new Date('2025-06-05') },

    // BD-012 (Mbale West, Maize, Dry Season)
    { id: 'FD-053', branchDeliveryId: 'BD-012', branchId: 'BR-MBL', farmerId: 'UG-F-00510', farmerName: 'Gimbo Patrick',     phone: '0782500510', commodity: 'Maize',    volume: 300, estimatedValue:   750_000, notes: '',              status: 'Pending',  season: 'Dry Season', session: 'midday', createdAt: new Date('2025-06-20'), updatedAt: new Date('2025-06-20') },
    { id: 'FD-054', branchDeliveryId: 'BD-012', branchId: 'BR-MBL', farmerId: 'UG-F-00511', farmerName: 'Nanteza Rebecca',   phone: '0772500511', commodity: 'Maize',    volume: 260, estimatedValue:   650_000, notes: '',              status: 'Pending',  season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-06-20'), updatedAt: new Date('2025-06-20') },
    { id: 'FD-055', branchDeliveryId: 'BD-012', branchId: 'BR-MBL', farmerId: 'UG-F-00512', farmerName: 'Khaukha Moses',     phone: '0754500512', commodity: 'Maize',    volume: 320, estimatedValue:   800_000, notes: 'Grade B',       status: 'Pending',  season: 'Dry Season', session: 'morning', createdAt: new Date('2025-06-20'), updatedAt: new Date('2025-06-20') },
    { id: 'FD-056', branchDeliveryId: 'BD-012', branchId: 'BR-MBL', farmerId: 'UG-F-00513', farmerName: 'Auma Sarah',        phone: '0701500513', commodity: 'Maize',    volume: 190, estimatedValue:   475_000, notes: '',              status: 'Pending',  season: 'Dry Season', session: 'midday', createdAt: new Date('2025-06-20'), updatedAt: new Date('2025-06-20') },

    // BD-013 (Mbale West, Beans, Wet Season)
    { id: 'FD-057', branchDeliveryId: 'BD-013', branchId: 'BR-MBL', farmerId: 'UG-F-00514', farmerName: 'Mafabi Joel',       phone: '0772500514', commodity: 'Beans',    volume: 175, estimatedValue:   437_500, notes: '',              status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-07-10'), updatedAt: new Date('2025-07-10') },
    { id: 'FD-058', branchDeliveryId: 'BD-013', branchId: 'BR-MBL', farmerId: 'UG-F-00515', farmerName: 'Nekesa Irene',      phone: '0754500515', commodity: 'Beans',    volume: 150, estimatedValue:   375_000, notes: 'Well sorted',   status: 'Approved', season: 'Wet Season', session: 'morning', createdAt: new Date('2025-07-10'), updatedAt: new Date('2025-07-10') },
    { id: 'FD-059', branchDeliveryId: 'BD-013', branchId: 'BR-MBL', farmerId: 'UG-F-00516', farmerName: 'Wabwire Daniel',    phone: '0701500516', commodity: 'Beans',    volume: 200, estimatedValue:   500_000, notes: '',              status: 'Approved', season: 'Wet Season', session: 'midday', createdAt: new Date('2025-07-10'), updatedAt: new Date('2025-07-10') },

    // BD-014 (Mbale West, Sesame, Dry Season)
    { id: 'FD-060', branchDeliveryId: 'BD-014', branchId: 'BR-MBL', farmerId: 'UG-F-00517', farmerName: 'Nambafu Esther',    phone: '0782500517', commodity: 'Sesame',   volume: 140, estimatedValue:   840_000, notes: '',              status: 'Pending',  season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-07-25'), updatedAt: new Date('2025-07-25') },
    { id: 'FD-061', branchDeliveryId: 'BD-014', branchId: 'BR-MBL', farmerId: 'UG-F-00518', farmerName: 'Wamimbi George',    phone: '0772500518', commodity: 'Sesame',   volume: 160, estimatedValue:   960_000, notes: 'Clean grain',   status: 'Pending',  season: 'Dry Season', session: 'morning', createdAt: new Date('2025-07-25'), updatedAt: new Date('2025-07-25') },
    { id: 'FD-062', branchDeliveryId: 'BD-014', branchId: 'BR-MBL', farmerId: 'UG-F-00519', farmerName: 'Khaoya Patricia',   phone: '0754500519', commodity: 'Sesame',   volume: 125, estimatedValue:   750_000, notes: '',              status: 'Pending',  season: 'Dry Season', session: 'midday', createdAt: new Date('2025-07-25'), updatedAt: new Date('2025-07-25') },

    // BD-015 (Mbale West, Sunflower, Wet Season)
    { id: 'FD-063', branchDeliveryId: 'BD-015', branchId: 'BR-MBL', farmerId: 'UG-F-00520', farmerName: 'Mukhwana Stephen',  phone: '0701500520', commodity: 'Sunflower', volume: 240, estimatedValue:   720_000, notes: '',             status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-08-08'), updatedAt: new Date('2025-08-08') },
    { id: 'FD-064', branchDeliveryId: 'BD-015', branchId: 'BR-MBL', farmerId: 'UG-F-00521', farmerName: 'Naula Florence',    phone: '0782500521', commodity: 'Sunflower', volume: 200, estimatedValue:   600_000, notes: '',             status: 'Approved', season: 'Wet Season', session: 'morning', createdAt: new Date('2025-08-08'), updatedAt: new Date('2025-08-08') },
    { id: 'FD-065', branchDeliveryId: 'BD-015', branchId: 'BR-MBL', farmerId: 'UG-F-00522', farmerName: 'Wafula Brian',      phone: '0772500522', commodity: 'Sunflower', volume: 175, estimatedValue:   525_000, notes: 'Slight debris', status: 'Approved', season: 'Wet Season', session: 'midday', createdAt: new Date('2025-08-08'), updatedAt: new Date('2025-08-08') },
    { id: 'FD-066', branchDeliveryId: 'BD-015', branchId: 'BR-MBL', farmerId: 'UG-F-00523', farmerName: 'Nasiche Grace',     phone: '0754500523', commodity: 'Sunflower', volume: 220, estimatedValue:   660_000, notes: '',             status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-08-08'), updatedAt: new Date('2025-08-08') },

    // BD-016 (Mbale West, Rice, Dry Season)
    { id: 'FD-067', branchDeliveryId: 'BD-016', branchId: 'BR-MBL', farmerId: 'UG-F-00524', farmerName: 'Otieno Calvin',     phone: '0701500524', commodity: 'Rice',     volume: 300, estimatedValue: 1_050_000, notes: '',             status: 'Rejected', season: 'Dry Season', session: 'morning', createdAt: new Date('2025-08-22'), updatedAt: new Date('2025-08-22') },
    { id: 'FD-068', branchDeliveryId: 'BD-016', branchId: 'BR-MBL', farmerId: 'UG-F-00525', farmerName: 'Nabwami Faith',     phone: '0782500525', commodity: 'Rice',     volume: 260, estimatedValue:   910_000, notes: 'Too much moisture', status: 'Rejected', season: 'Dry Season', session: 'midday', createdAt: new Date('2025-08-22'), updatedAt: new Date('2025-08-22') },
    { id: 'FD-069', branchDeliveryId: 'BD-016', branchId: 'BR-MBL', farmerId: 'UG-F-00526', farmerName: 'Mwambu Allan',      phone: '0772500526', commodity: 'Rice',     volume: 280, estimatedValue:   980_000, notes: '',             status: 'Rejected', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-08-22'), updatedAt: new Date('2025-08-22') },

    // BD-017 (Mbale West, Sorghum, Wet Season)
    { id: 'FD-070', branchDeliveryId: 'BD-017', branchId: 'BR-MBL', farmerId: 'UG-F-00527', farmerName: 'Nanjala Ruth',      phone: '0754500527', commodity: 'Sorghum',  volume: 350, estimatedValue:   630_000, notes: '',             status: 'Pending',  season: 'Wet Season', session: 'morning', createdAt: new Date('2025-09-05'), updatedAt: new Date('2025-09-05') },
    { id: 'FD-071', branchDeliveryId: 'BD-017', branchId: 'BR-MBL', farmerId: 'UG-F-00528', farmerName: 'Wekesa Tom',        phone: '0701500528', commodity: 'Sorghum',  volume: 300, estimatedValue:   540_000, notes: '',             status: 'Pending',  season: 'Wet Season', session: 'midday', createdAt: new Date('2025-09-05'), updatedAt: new Date('2025-09-05') },
    { id: 'FD-072', branchDeliveryId: 'BD-017', branchId: 'BR-MBL', farmerId: 'UG-F-00529', farmerName: 'Namisango Joy',     phone: '0782500529', commodity: 'Sorghum',  volume: 275, estimatedValue:   495_000, notes: '',             status: 'Pending',  season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-09-05'), updatedAt: new Date('2025-09-05') },

    // BD-018 (Mbale West, Millet, Dry Season)
    { id: 'FD-073', branchDeliveryId: 'BD-018', branchId: 'BR-MBL', farmerId: 'UG-F-00530', farmerName: 'Sikuku Peter',      phone: '0772500530', commodity: 'Millet',   volume: 230, estimatedValue:   506_000, notes: '',             status: 'Approved', season: 'Dry Season', session: 'morning', createdAt: new Date('2025-09-19'), updatedAt: new Date('2025-09-19') },
    { id: 'FD-074', branchDeliveryId: 'BD-018', branchId: 'BR-MBL', farmerId: 'UG-F-00531', farmerName: 'Nabaale Susan',     phone: '0754500531', commodity: 'Millet',   volume: 195, estimatedValue:   429_000, notes: '',             status: 'Approved', season: 'Dry Season', session: 'midday', createdAt: new Date('2025-09-19'), updatedAt: new Date('2025-09-19') },
    { id: 'FD-075', branchDeliveryId: 'BD-018', branchId: 'BR-MBL', farmerId: 'UG-F-00532', farmerName: 'Wandera Eric',      phone: '0701500532', commodity: 'Millet',   volume: 210, estimatedValue:   462_000, notes: '',             status: 'Approved', season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-09-19'), updatedAt: new Date('2025-09-19') },

    // BD-019 (Mbale West, Coffee, Wet Season)
    // These newer records carry a grade — demonstrates what happens when the cooperative
    // enables grade mode. unitPrice is the Coffee × Grade A/B/C price at BR-MBL.
    { id: 'FD-076', branchDeliveryId: 'BD-019', branchId: 'BR-MBL', farmerId: 'UG-F-00533', farmerName: 'Namono Alice',      phone: '0782500533', commodity: 'Coffee',   volume: 220, unitPrice: 7_800, estimatedValue: 1_716_000, grade: 'A', gradeName: 'Premium',   notes: '',          status: 'Approved', season: 'Wet Season', session: 'morning', createdAt: new Date('2025-10-03'), updatedAt: new Date('2025-10-03') },
    { id: 'FD-077', branchDeliveryId: 'BD-019', branchId: 'BR-MBL', farmerId: 'UG-F-00534', farmerName: 'Mugeni Robert',     phone: '0772500534', commodity: 'Coffee',   volume: 190, unitPrice: 6_000, estimatedValue: 1_140_000, grade: 'B', gradeName: 'Standard',  notes: '',          status: 'Approved', season: 'Wet Season', session: 'midday', createdAt: new Date('2025-10-03'), updatedAt: new Date('2025-10-03') },
    { id: 'FD-078', branchDeliveryId: 'BD-019', branchId: 'BR-MBL', farmerId: 'UG-F-00535', farmerName: 'Khamoya Susan',     phone: '0754500535', commodity: 'Coffee',   volume: 165, unitPrice: 7_800, estimatedValue: 1_287_000, grade: 'A', gradeName: 'Premium',   notes: 'Arabica AA', status: 'Approved', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-10-03'), updatedAt: new Date('2025-10-03') },
    { id: 'FD-079', branchDeliveryId: 'BD-019', branchId: 'BR-MBL', farmerId: 'UG-F-00536', farmerName: 'Wanyenze Daniel',   phone: '0701500536', commodity: 'Coffee',   volume: 200, unitPrice: 4_200, estimatedValue:   840_000, grade: 'C', gradeName: 'Low Grade', notes: '',          status: 'Approved', season: 'Wet Season', session: 'morning', createdAt: new Date('2025-10-03'), updatedAt: new Date('2025-10-03') },

    // BD-020 (Mbale West, Maize, Dry Season)
    { id: 'FD-080', branchDeliveryId: 'BD-020', branchId: 'BR-MBL', farmerId: 'UG-F-00537', farmerName: 'Nambuya Christine', phone: '0782500537', commodity: 'Maize',    volume: 280, unitPrice: 2_500, estimatedValue:   700_000, grade: 'B', gradeName: 'Standard',  notes: '',          status: 'Pending',  season: 'Dry Season', session: 'midday', createdAt: new Date('2025-10-17'), updatedAt: new Date('2025-10-17') },
    { id: 'FD-081', branchDeliveryId: 'BD-020', branchId: 'BR-MBL', farmerId: 'UG-F-00538', farmerName: 'Wabwire Henry',     phone: '0772500538', commodity: 'Maize',    volume: 245, unitPrice: 3_250, estimatedValue:   796_250, grade: 'A', gradeName: 'Premium',   notes: '',          status: 'Pending',  season: 'Dry Season', session: 'afternoon', createdAt: new Date('2025-10-17'), updatedAt: new Date('2025-10-17') },
    { id: 'FD-082', branchDeliveryId: 'BD-020', branchId: 'BR-MBL', farmerId: 'UG-F-00539', farmerName: 'Nakirya Patricia',  phone: '0754500539', commodity: 'Maize',    volume: 300, unitPrice: 1_750, estimatedValue:   525_000, grade: 'C', gradeName: 'Low Grade', notes: '',          status: 'Pending',  season: 'Dry Season', session: 'morning', createdAt: new Date('2025-10-17'), updatedAt: new Date('2025-10-17') },

    // ── Farmer records for the new cross-branch batches (BD-021..BD-038) ────────
    // These allow "View Farmers" to show real data when the cooperative admin
    // drills into any of the newly added batches.  3 farmers per batch.

    // BD-021 (Kampala Central, Beans, Dry Season, Approved)
    { id: 'FD-083', branchDeliveryId: 'BD-021', branchId: 'BR-KLA',  farmerId: 'UG-F-00107', farmerName: 'Nakamanya Rose',     phone: '0772500107', commodity: 'Beans',    volume: 380, estimatedValue:   950_000, notes: 'Well sorted',   status: 'Approved', season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-06-04'), updatedAt: new Date('2025-06-04') },
    { id: 'FD-084', branchDeliveryId: 'BD-021', branchId: 'BR-KLA',  farmerId: 'UG-F-00108', farmerName: 'Kigozi Samuel',      phone: '0754500108', commodity: 'Beans',    volume: 290, estimatedValue:   725_000, notes: '',              status: 'Approved', season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-06-04'), updatedAt: new Date('2025-06-04') },
    { id: 'FD-085', branchDeliveryId: 'BD-021', branchId: 'BR-KLA',  farmerId: 'UG-F-00109', farmerName: 'Nankya Aisha',       phone: '0701500109', commodity: 'Beans',    volume: 310, estimatedValue:   775_000, notes: 'Grade A',       status: 'Approved', season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-06-04'), updatedAt: new Date('2025-06-04') },

    // BD-022 (Kampala Central, Coffee, Dry Season, Pending)
    { id: 'FD-086', branchDeliveryId: 'BD-022', branchId: 'BR-KLA',  farmerId: 'UG-F-00110', farmerName: 'Ssebuggwawo Dan',    phone: '0782500110', commodity: 'Coffee',   volume: 160, estimatedValue:   960_000, notes: 'Dried beans',   status: 'Pending',  season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-07-14'), updatedAt: new Date('2025-07-14') },
    { id: 'FD-087', branchDeliveryId: 'BD-022', branchId: 'BR-KLA',  farmerId: 'UG-F-00111', farmerName: 'Nakitto Grace',      phone: '0772500111', commodity: 'Coffee',   volume: 190, estimatedValue: 1_140_000, notes: '',              status: 'Pending',  season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-07-14'), updatedAt: new Date('2025-07-14') },
    { id: 'FD-088', branchDeliveryId: 'BD-022', branchId: 'BR-KLA',  farmerId: 'UG-F-00112', farmerName: 'Kizito Peter',       phone: '0754500112', commodity: 'Coffee',   volume: 140, estimatedValue:   840_000, notes: 'Arabica AA',    status: 'Pending',  season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-07-14'), updatedAt: new Date('2025-07-14') },

    // BD-023 (Jinja East, Maize, Dry Season, Approved)
    { id: 'FD-089', branchDeliveryId: 'BD-023', branchId: 'BR-JIN',  farmerId: 'UG-F-00206', farmerName: 'Mugisha Tom',        phone: '0701500206', commodity: 'Maize',    volume: 320, estimatedValue:   800_000, notes: '',              status: 'Approved', season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-06-11'), updatedAt: new Date('2025-06-11') },
    { id: 'FD-090', branchDeliveryId: 'BD-023', branchId: 'BR-JIN',  farmerId: 'UG-F-00207', farmerName: 'Nakirija Sarah',     phone: '0782500207', commodity: 'Maize',    volume: 280, estimatedValue:   700_000, notes: 'Well dried',    status: 'Approved', season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-06-11'), updatedAt: new Date('2025-06-11') },
    { id: 'FD-091', branchDeliveryId: 'BD-023', branchId: 'BR-JIN',  farmerId: 'UG-F-00208', farmerName: 'Kato Henry',         phone: '0772500208', commodity: 'Maize',    volume: 350, estimatedValue:   875_000, notes: '',              status: 'Approved', season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-06-11'), updatedAt: new Date('2025-06-11') },

    // BD-024 (Jinja East, Tea, Wet Season, Pending)
    { id: 'FD-092', branchDeliveryId: 'BD-024', branchId: 'BR-JIN',  farmerId: 'UG-F-00209', farmerName: 'Nalubega Christine', phone: '0754500209', commodity: 'Tea',      volume: 200, estimatedValue:   500_000, notes: 'Fresh leaf',    status: 'Pending',  season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-01'), updatedAt: new Date('2025-08-01') },
    { id: 'FD-093', branchDeliveryId: 'BD-024', branchId: 'BR-JIN',  farmerId: 'UG-F-00210', farmerName: 'Ssenyonga Mark',     phone: '0701500210', commodity: 'Tea',      volume: 250, estimatedValue:   625_000, notes: '',              status: 'Pending',  season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-01'), updatedAt: new Date('2025-08-01') },
    { id: 'FD-094', branchDeliveryId: 'BD-024', branchId: 'BR-JIN',  farmerId: 'UG-F-00211', farmerName: 'Namirembe Ruth',     phone: '0782500211', commodity: 'Tea',      volume: 180, estimatedValue:   450_000, notes: 'Slightly wilted', status: 'Pending', season: 'Wet Season', session: 'afternoon', createdAt: new Date('2025-08-01'), updatedAt: new Date('2025-08-01') },

    // BD-025 (Mbarara South, Maize, Dry Season, Approved)
    { id: 'FD-095', branchDeliveryId: 'BD-025', branchId: 'BR-MBA',  farmerId: 'UG-F-00306', farmerName: 'Tumwebaze Annet',    phone: '0772500306', commodity: 'Maize',    volume: 390, estimatedValue:   975_000, notes: '',              status: 'Approved', season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-06-18'), updatedAt: new Date('2025-06-18') },
    { id: 'FD-096', branchDeliveryId: 'BD-025', branchId: 'BR-MBA',  farmerId: 'UG-F-00307', farmerName: 'Kanyeihamba David',  phone: '0754500307', commodity: 'Maize',    volume: 420, estimatedValue: 1_050_000, notes: 'Grade A',       status: 'Approved', season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-06-18'), updatedAt: new Date('2025-06-18') },
    { id: 'FD-097', branchDeliveryId: 'BD-025', branchId: 'BR-MBA',  farmerId: 'UG-F-00308', farmerName: 'Birungi Margaret',   phone: '0701500308', commodity: 'Maize',    volume: 360, estimatedValue:   900_000, notes: '',              status: 'Approved', season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-06-18'), updatedAt: new Date('2025-06-18') },

    // BD-026 (Mbarara South, Coffee, Wet Season, Rejected)
    { id: 'FD-098', branchDeliveryId: 'BD-026', branchId: 'BR-MBA',  farmerId: 'UG-F-00309', farmerName: 'Rwabutungi Sam',     phone: '0782500309', commodity: 'Coffee',   volume: 140, estimatedValue:   840_000, notes: 'Too wet',       status: 'Rejected', season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-12'), updatedAt: new Date('2025-08-12') },
    { id: 'FD-099', branchDeliveryId: 'BD-026', branchId: 'BR-MBA',  farmerId: 'UG-F-00310', farmerName: 'Katungye Alice',     phone: '0772500310', commodity: 'Coffee',   volume: 110, estimatedValue:   660_000, notes: 'Re-dry needed', status: 'Rejected', season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-12'), updatedAt: new Date('2025-08-12') },
    { id: 'FD-100', branchDeliveryId: 'BD-026', branchId: 'BR-MBA',  farmerId: 'UG-F-00311', farmerName: 'Turyamureeba James', phone: '0754500311', commodity: 'Coffee',   volume: 120, estimatedValue:   720_000, notes: '',              status: 'Rejected', season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-08-12'), updatedAt: new Date('2025-08-12') },

    // BD-027 (Gulu North, Maize, Wet Season, Approved)
    { id: 'FD-101', branchDeliveryId: 'BD-027', branchId: 'BR-GUL',  farmerId: 'UG-F-00405', farmerName: 'Olara Simon',        phone: '0701500405', commodity: 'Maize',    volume: 310, estimatedValue:   775_000, notes: '',              status: 'Approved', season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-06-25'), updatedAt: new Date('2025-06-25') },
    { id: 'FD-102', branchDeliveryId: 'BD-027', branchId: 'BR-GUL',  farmerId: 'UG-F-00406', farmerName: 'Arach Betty',        phone: '0782500406', commodity: 'Maize',    volume: 290, estimatedValue:   725_000, notes: '',              status: 'Approved', season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-06-25'), updatedAt: new Date('2025-06-25') },
    { id: 'FD-103', branchDeliveryId: 'BD-027', branchId: 'BR-GUL',  farmerId: 'UG-F-00407', farmerName: 'Oryem Joseph',       phone: '0772500407', commodity: 'Maize',    volume: 340, estimatedValue:   850_000, notes: 'Well dried',    status: 'Approved', season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-06-25'), updatedAt: new Date('2025-06-25') },

    // BD-028 (Gulu North, Sunflower, Dry Season, Pending)
    { id: 'FD-104', branchDeliveryId: 'BD-028', branchId: 'BR-GUL',  farmerId: 'UG-F-00408', farmerName: 'Aber Christine',     phone: '0754500408', commodity: 'Sunflower', volume: 130, estimatedValue:   260_000, notes: '',             status: 'Pending',  season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-08'), updatedAt: new Date('2025-09-08') },
    { id: 'FD-105', branchDeliveryId: 'BD-028', branchId: 'BR-GUL',  farmerId: 'UG-F-00409', farmerName: 'Okello David',       phone: '0701500409', commodity: 'Sunflower', volume: 150, estimatedValue:   300_000, notes: 'Slight debris', status: 'Pending',  season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-08'), updatedAt: new Date('2025-09-08') },
    { id: 'FD-106', branchDeliveryId: 'BD-028', branchId: 'BR-GUL',  farmerId: 'UG-F-00410', farmerName: 'Lalam Grace',        phone: '0782500410', commodity: 'Sunflower', volume: 120, estimatedValue:   240_000, notes: '',             status: 'Pending',  season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-08'), updatedAt: new Date('2025-09-08') },

    // BD-029 (Fort Portal West, Maize, Dry Season, Approved)
    { id: 'FD-107', branchDeliveryId: 'BD-029', branchId: 'BR-FTP',  farmerId: 'UG-F-00606', farmerName: 'Kabasomi Prossy',    phone: '0772500606', commodity: 'Maize',    volume: 400, estimatedValue: 1_000_000, notes: '',              status: 'Approved', season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-07-02'), updatedAt: new Date('2025-07-02') },
    { id: 'FD-108', branchDeliveryId: 'BD-029', branchId: 'BR-FTP',  farmerId: 'UG-F-00607', farmerName: 'Bwambale John',      phone: '0754500607', commodity: 'Maize',    volume: 350, estimatedValue:   875_000, notes: 'Grade A',       status: 'Approved', season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-07-02'), updatedAt: new Date('2025-07-02') },
    { id: 'FD-109', branchDeliveryId: 'BD-029', branchId: 'BR-FTP',  farmerId: 'UG-F-00608', farmerName: 'Muhindo Agnes',      phone: '0701500608', commodity: 'Maize',    volume: 380, estimatedValue:   950_000, notes: '',              status: 'Approved', season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-07-02'), updatedAt: new Date('2025-07-02') },

    // BD-030 (Fort Portal West, Coffee, Wet Season, Pending)
    { id: 'FD-110', branchDeliveryId: 'BD-030', branchId: 'BR-FTP',  farmerId: 'UG-F-00609', farmerName: 'Nyakato Margret',    phone: '0782500609', commodity: 'Coffee',   volume: 190, estimatedValue: 1_140_000, notes: '',              status: 'Pending',  season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-09-15'), updatedAt: new Date('2025-09-15') },
    { id: 'FD-111', branchDeliveryId: 'BD-030', branchId: 'BR-FTP',  farmerId: 'UG-F-00610', farmerName: 'Tibihika Patrick',   phone: '0772500610', commodity: 'Coffee',   volume: 210, estimatedValue: 1_260_000, notes: 'Arabica AA',    status: 'Pending',  season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-09-15'), updatedAt: new Date('2025-09-15') },
    { id: 'FD-112', branchDeliveryId: 'BD-030', branchId: 'BR-FTP',  farmerId: 'UG-F-00611', farmerName: 'Kabugho Lydia',      phone: '0754500611', commodity: 'Coffee',   volume: 170, estimatedValue: 1_020_000, notes: '',              status: 'Pending',  season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-09-15'), updatedAt: new Date('2025-09-15') },

    // BD-031 (Adjumani East, Sesame, Dry Season, Approved)
    { id: 'FD-113', branchDeliveryId: 'BD-031', branchId: 'BR-ADJ',  farmerId: 'UG-F-00705', farmerName: 'Otema Richard',      phone: '0701500705', commodity: 'Sesame',   volume: 180, estimatedValue: 1_080_000, notes: 'Clean grain',   status: 'Approved', season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-07-09'), updatedAt: new Date('2025-07-09') },
    { id: 'FD-114', branchDeliveryId: 'BD-031', branchId: 'BR-ADJ',  farmerId: 'UG-F-00706', farmerName: 'Akello Rebecca',     phone: '0782500706', commodity: 'Sesame',   volume: 160, estimatedValue:   960_000, notes: '',              status: 'Approved', season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-07-09'), updatedAt: new Date('2025-07-09') },
    { id: 'FD-115', branchDeliveryId: 'BD-031', branchId: 'BR-ADJ',  farmerId: 'UG-F-00707', farmerName: 'Ochen Samuel',       phone: '0772500707', commodity: 'Sesame',   volume: 200, estimatedValue: 1_200_000, notes: '',              status: 'Approved', season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-07-09'), updatedAt: new Date('2025-07-09') },

    // BD-032 (Adjumani East, Beans, Wet Season, Pending)
    { id: 'FD-116', branchDeliveryId: 'BD-032', branchId: 'BR-ADJ',  farmerId: 'UG-F-00708', farmerName: 'Adong Harriet',      phone: '0754500708', commodity: 'Beans',    volume: 210, estimatedValue:   525_000, notes: '',              status: 'Pending',  season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-10-02'), updatedAt: new Date('2025-10-02') },
    { id: 'FD-117', branchDeliveryId: 'BD-032', branchId: 'BR-ADJ',  farmerId: 'UG-F-00709', farmerName: 'Omara Godfrey',      phone: '0701500709', commodity: 'Beans',    volume: 190, estimatedValue:   475_000, notes: 'Mixed grade',   status: 'Pending',  season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-10-02'), updatedAt: new Date('2025-10-02') },
    { id: 'FD-118', branchDeliveryId: 'BD-032', branchId: 'BR-ADJ',  farmerId: 'UG-F-00710', farmerName: 'Atto Susan',         phone: '0782500710', commodity: 'Beans',    volume: 175, estimatedValue:   437_500, notes: '',              status: 'Pending',  season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-10-02'), updatedAt: new Date('2025-10-02') },

    // BD-033 (Kiboga Central, Maize, Wet Season, Approved)
    { id: 'FD-119', branchDeliveryId: 'BD-033', branchId: 'BR-KIB',  farmerId: 'UG-F-00805', farmerName: 'Kizito Florence',    phone: '0772500805', commodity: 'Maize',    volume: 450, estimatedValue: 1_125_000, notes: '',              status: 'Approved', season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-07-16'), updatedAt: new Date('2025-07-16') },
    { id: 'FD-120', branchDeliveryId: 'BD-033', branchId: 'BR-KIB',  farmerId: 'UG-F-00806', farmerName: 'Ssegawa Dan',        phone: '0754500806', commodity: 'Maize',    volume: 410, estimatedValue: 1_025_000, notes: 'Grade A',       status: 'Approved', season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-07-16'), updatedAt: new Date('2025-07-16') },
    { id: 'FD-121', branchDeliveryId: 'BD-033', branchId: 'BR-KIB',  farmerId: 'UG-F-00807', farmerName: 'Nalule Joan',        phone: '0701500807', commodity: 'Maize',    volume: 430, estimatedValue: 1_075_000, notes: '',              status: 'Approved', season: 'Wet Season',  session: 'morning',   createdAt: new Date('2025-07-16'), updatedAt: new Date('2025-07-16') },

    // BD-034 (Kiboga Central, Beans, Dry Season, Pending)
    { id: 'FD-122', branchDeliveryId: 'BD-034', branchId: 'BR-KIB',  farmerId: 'UG-F-00808', farmerName: 'Bukenya Charles',    phone: '0782500808', commodity: 'Beans',    volume: 260, estimatedValue:   650_000, notes: '',              status: 'Pending',  season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-22'), updatedAt: new Date('2025-09-22') },
    { id: 'FD-123', branchDeliveryId: 'BD-034', branchId: 'BR-KIB',  farmerId: 'UG-F-00809', farmerName: 'Namaswa Rose',       phone: '0772500809', commodity: 'Beans',    volume: 240, estimatedValue:   600_000, notes: '',              status: 'Pending',  season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-22'), updatedAt: new Date('2025-09-22') },
    { id: 'FD-124', branchDeliveryId: 'BD-034', branchId: 'BR-KIB',  farmerId: 'UG-F-00810', farmerName: 'Ssali Emmanuel',     phone: '0754500810', commodity: 'Beans',    volume: 220, estimatedValue:   550_000, notes: 'Well sorted',   status: 'Pending',  season: 'Dry Season',  session: 'midday',    createdAt: new Date('2025-09-22'), updatedAt: new Date('2025-09-22') },

    // BD-035 (Lira Town, Millet, Wet Season, Approved)
    { id: 'FD-125', branchDeliveryId: 'BD-035', branchId: 'BR-LIR',  farmerId: 'UG-F-00906', farmerName: 'Alal Monica',        phone: '0701500906', commodity: 'Millet',   volume: 290, estimatedValue:   638_000, notes: '',              status: 'Approved', season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-07-23'), updatedAt: new Date('2025-07-23') },
    { id: 'FD-126', branchDeliveryId: 'BD-035', branchId: 'BR-LIR',  farmerId: 'UG-F-00907', farmerName: 'Omara William',      phone: '0782500907', commodity: 'Millet',   volume: 270, estimatedValue:   594_000, notes: '',              status: 'Approved', season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-07-23'), updatedAt: new Date('2025-07-23') },
    { id: 'FD-127', branchDeliveryId: 'BD-035', branchId: 'BR-LIR',  farmerId: 'UG-F-00908', farmerName: 'Akello Agnes',       phone: '0772500908', commodity: 'Millet',   volume: 310, estimatedValue:   682_000, notes: 'Clean grain',   status: 'Approved', season: 'Wet Season',  session: 'afternoon', createdAt: new Date('2025-07-23'), updatedAt: new Date('2025-07-23') },

    // BD-036 (Lira Town, Maize, Dry Season, Pending)
    { id: 'FD-128', branchDeliveryId: 'BD-036', branchId: 'BR-LIR',  farmerId: 'UG-F-00909', farmerName: 'Opio Kenneth',       phone: '0754500909', commodity: 'Maize',    volume: 340, estimatedValue:   850_000, notes: '',              status: 'Pending',  season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-10-09'), updatedAt: new Date('2025-10-09') },
    { id: 'FD-129', branchDeliveryId: 'BD-036', branchId: 'BR-LIR',  farmerId: 'UG-F-00910', farmerName: 'Adongo Irene',       phone: '0701500910', commodity: 'Maize',    volume: 310, estimatedValue:   775_000, notes: '',              status: 'Pending',  season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-10-09'), updatedAt: new Date('2025-10-09') },
    { id: 'FD-130', branchDeliveryId: 'BD-036', branchId: 'BR-LIR',  farmerId: 'UG-F-00911', farmerName: 'Olweny Patrick',     phone: '0782500911', commodity: 'Maize',    volume: 290, estimatedValue:   725_000, notes: 'Grade B',       status: 'Pending',  season: 'Dry Season',  session: 'morning',   createdAt: new Date('2025-10-09'), updatedAt: new Date('2025-10-09') },

    // BD-037 (Mbale East, Maize, Wet Season, Approved)
    { id: 'FD-131', branchDeliveryId: 'BD-037', branchId: 'BR-MBA2', farmerId: 'UG-F-01006', farmerName: 'Nabirye Grace',      phone: '0772501006', commodity: 'Maize',    volume: 390, estimatedValue:   975_000, notes: '',              status: 'Approved', season: 'Wet Season',  session: 'midday',    createdAt: new Date('2025-07-30'), updatedAt: new Date('2025-07-30') },
    { id: 'FD-132', branchDeliveryId: 'BD-037', branchId: 'BR-MBA2', farmerId: 'UG-F-01007', farmerName: 'Wafula George',      phone: '0754501007', commodity: 'Maize',    volume: 360, estimatedValue:   900_000, notes: 'Grade A',       status: 'Approved', season: 'Wet Season',  session: 'midday',    createdAt: new Date('2025-07-30'), updatedAt: new Date('2025-07-30') },
    { id: 'FD-133', branchDeliveryId: 'BD-037', branchId: 'BR-MBA2', farmerId: 'UG-F-01008', farmerName: 'Nakibuuka Aisha',    phone: '0701501008', commodity: 'Maize',    volume: 370, estimatedValue:   925_000, notes: '',              status: 'Approved', season: 'Wet Season',  session: 'midday',    createdAt: new Date('2025-07-30'), updatedAt: new Date('2025-07-30') },

    // BD-038 (Mbale East, Beans, Dry Season, Pending)
    { id: 'FD-134', branchDeliveryId: 'BD-038', branchId: 'BR-MBA2', farmerId: 'UG-F-01009', farmerName: 'Mudiba Tom',         phone: '0782501009', commodity: 'Beans',    volume: 310, estimatedValue:   775_000, notes: '',              status: 'Pending',  season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-10-24'), updatedAt: new Date('2025-10-24') },
    { id: 'FD-135', branchDeliveryId: 'BD-038', branchId: 'BR-MBA2', farmerId: 'UG-F-01010', farmerName: 'Namukhula Christine',phone: '0772501010', commodity: 'Beans',    volume: 280, estimatedValue:   700_000, notes: '',              status: 'Pending',  season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-10-24'), updatedAt: new Date('2025-10-24') },
    { id: 'FD-136', branchDeliveryId: 'BD-038', branchId: 'BR-MBA2', farmerId: 'UG-F-01011', farmerName: 'Wekesa Joseph',      phone: '0754501011', commodity: 'Beans',    volume: 290, estimatedValue:   725_000, notes: 'Well sorted',   status: 'Pending',  season: 'Dry Season',  session: 'afternoon', createdAt: new Date('2025-10-24'), updatedAt: new Date('2025-10-24') },
  ];

  private readonly farmers$: BehaviorSubject<FarmerDelivery[]>;
  // Start after the last seed record (FD-136) so new programmatic adds never collide.
  private counter = 136;

  constructor(
    private readonly http: HttpClient,
    private readonly branchSvc: BranchDeliveryService,
    private readonly pricing: CooperativePricingService,
  ) {
    const enriched = this.seed.map(d => {
      // If the seed record already has a unit price (e.g. grade-based records in BD-019/BD-020),
      // keep it as-is. Otherwise fall back to the cooperative's current flat price.
      const unitPrice = d.unitPrice ?? this.pricing.getUnitPrice(d.branchId ?? '', d.commodity);
      return {
        ...d,
        unitPrice,
        estimatedValue: unitPrice > 0 ? d.volume * unitPrice : d.estimatedValue,
        inputLoanDeduction: INPUT_LOAN_DEDUCTIONS[d.id],
      };
    });
    this.farmers$ = new BehaviorSubject<FarmerDelivery[]>(enriched);
  }

  getAll(): Observable<FarmerDelivery[]> {
    const snapshot = [...this.farmers$.value];
    return this.http.get<FarmerDelivery[]>(API_ENDPOINTS.BRANCH.FARMER_DELIVERIES).pipe(
      timeout(3000),
      tap(rows => this.farmers$.next(rows)),
      catchError(() => of(snapshot)),
      startWith(snapshot),
    );
  }

  allForRole$(
    branchId: string | null | undefined,
    role: string | null | undefined,
    branchDeliveryId?: string | null,
  ): Observable<FarmerDelivery[]> {
    return this.farmers$.pipe(
      map(deliveries => {
        let rows = deliveries;
        if (role === 'branch' && branchId) rows = rows.filter(d => d.branchId === branchId);
        if (branchDeliveryId) rows = rows.filter(d => d.branchDeliveryId === branchDeliveryId);
        return rows;
      }),
    );
  }

  // Sync — called during template rendering; Observable would cause change-detection issues here.
  getByBranch(branchDeliveryId: string): FarmerDelivery[] {
    return this.farmers$.value.filter(f => f.branchDeliveryId === branchDeliveryId);
  }

  add(form: FarmerDeliveryFormData): Observable<FarmerDelivery> {
    return this.http.post<FarmerDelivery>(API_ENDPOINTS.BRANCH.FARMER_DELIVERIES, form).pipe(
      timeout(2000),
      tap(entry => {
        this.farmers$.next([...this.farmers$.value, entry]);
        this.aggregate(form.branchDeliveryId);
      }),
      catchError(() => of(this.addMock(form))),
    );
  }

  update(id: string, form: FarmerDeliveryFormData): Observable<FarmerDelivery | null> {
    const rows = this.farmers$.value;
    const idx = rows.findIndex(f => f.id === id);
    if (idx === -1) return of(null);
    const oldBranchId = rows[idx].branchDeliveryId;
    const localUpdated: FarmerDelivery = { ...rows[idx], ...form, updatedAt: new Date() };
    return this.http.put<FarmerDelivery>(API_ENDPOINTS.BRANCH.FARMER_DELIVERY_BY_ID(id), form).pipe(
      timeout(2000),
      tap(updated => {
        this.replaceAt(idx, updated);
        this.aggregate(oldBranchId);
        if (form.branchDeliveryId !== oldBranchId) this.aggregate(form.branchDeliveryId);
      }),
      catchError(() => {
        this.replaceAt(idx, localUpdated);
        this.aggregate(oldBranchId);
        if (form.branchDeliveryId !== oldBranchId) this.aggregate(form.branchDeliveryId);
        return of(localUpdated);
      }),
    );
  }

  delete(id: string): Observable<void> {
    const target = this.farmers$.value.find(f => f.id === id);
    if (!target) return of(void 0);
    return this.http.delete<void>(API_ENDPOINTS.BRANCH.FARMER_DELIVERY_BY_ID(id)).pipe(
      timeout(2000),
      tap(() => {
        this.farmers$.next(this.farmers$.value.filter(f => f.id !== id));
        this.aggregate(target.branchDeliveryId);
      }),
      catchError(() => {
        this.farmers$.next(this.farmers$.value.filter(f => f.id !== id));
        this.aggregate(target.branchDeliveryId);
        return of(void 0);
      }),
    );
  }

  private addMock(form: FarmerDeliveryFormData): FarmerDelivery {
    this.counter++;
    const entry: FarmerDelivery = {
      ...form,
      // grade and gradeName are optional in FarmerDeliveryFormData, so they spread through
      // automatically — no explicit mapping needed.
      id: `FD-${String(this.counter).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.farmers$.next([...this.farmers$.value, entry]);
    this.aggregate(form.branchDeliveryId);
    return entry;
  }

  private replaceAt(idx: number, updated: FarmerDelivery): void {
    const rows = this.farmers$.value;
    this.farmers$.next([...rows.slice(0, idx), updated, ...rows.slice(idx + 1)]);
  }

  // Recalculates batch totals from current farmer rows whenever a farmer delivery changes.
  private aggregate(branchDeliveryId?: string): void {
    if (!branchDeliveryId) return;

    const children = this.farmers$.value.filter(f => f.branchDeliveryId === branchDeliveryId);
    const branch = this.branchSvc.getDeliveryById(branchDeliveryId);
    if (!branch) return;

    const farmerCount = children.length;
    const volume = children.reduce((s, f) => s + (f.volume || 0), 0);
    const estimatedValue = children.reduce((s, f) => s + (f.estimatedValue || 0), 0);

    const commodityCount: Record<string, number> = {};
    children.forEach(f => {
      commodityCount[f.commodity] = (commodityCount[f.commodity] || 0) + 1;
    });
    const commodity = Object.keys(commodityCount).sort(
      (a, b) => commodityCount[b] - commodityCount[a]
    )[0] ?? branch.commodity;

    this.branchSvc.updateDelivery(branchDeliveryId, {
      branchName: branch.branchName,
      farmerCount,
      commodity,
      volume,
      estimatedValue,
      status: branch.status,
      season: branch.season,
    }).subscribe(); // fire-and-forget — catchError in updateDelivery means this can't throw
  }
}
