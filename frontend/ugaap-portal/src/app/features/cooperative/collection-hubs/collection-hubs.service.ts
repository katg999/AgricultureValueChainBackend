// features/cooperative/collection-hubs/collection-hubs.service.ts
//
// Domain service for collection hubs — physical sites where farmers bring
// produce for weighing, grading and temporary storage before transport.
//
// Currently backed by an in-memory mock store. Each method documents the
// API call that replaces it once the backend endpoint is live.

import { Injectable, signal } from '@angular/core';

export type HubStatus = 'active' | 'inactive';

export interface CollectionHub {
  id: string;
  /** Reference code shown in mono font, e.g. HUB-0003 */
  hubCode: string;
  name: string;
  location: string;
  district: string;
  branchId: string;
  branchName: string;
  /** Storage capacity in metric tonnes */
  capacity: number;
  /** Current load in metric tonnes */
  currentLoad: number;
  commodities: string[];
  status: HubStatus;
  createdAt: string;
}

/** Fields captured by the create / edit form */
export interface CollectionHubInput {
  name: string;
  location: string;
  district: string;
  branchId: string;
  capacity: number;
  commodities: string[];
}

export const HUB_BRANCHES: { id: string; name: string }[] = [
  { id: 'br-001', name: 'Hoima Central' },
  { id: 'br-002', name: 'Masindi Depot' },
  { id: 'br-003', name: 'Gulu North' },
  { id: 'br-004', name: 'Lira East' },
  { id: 'br-005', name: 'Mbale West' },
];

export const UGANDA_DISTRICTS = [
  'Hoima', 'Masindi', 'Gulu', 'Lira', 'Mbale', 'Kampala',
  'Jinja', 'Mbarara', 'Arua', 'Soroti', 'Tororo', 'Kasese',
  'Kabale', 'Fort Portal', 'Masaka',
];

export const COMMODITIES = [
  'Robusta Coffee', 'Arabica Coffee', 'Maize', 'Rice',
  'Sunflower', 'Soya Beans', 'Simsim', 'Millet',
];

const SEED_HUBS: CollectionHub[] = [
  {
    id: 'hub-001', hubCode: 'HUB-0001',
    name: 'Hoima Market Hub', location: 'Hoima Trading Centre, Plot 14',
    district: 'Hoima', branchId: 'br-001', branchName: 'Hoima Central',
    capacity: 50, currentLoad: 32.4,
    commodities: ['Robusta Coffee', 'Maize'],
    status: 'active', createdAt: '2025-01-10',
  },
  {
    id: 'hub-002', hubCode: 'HUB-0002',
    name: 'Masindi South Collection Point', location: 'Masindi-Kampala Rd, Km 4',
    district: 'Masindi', branchId: 'br-002', branchName: 'Masindi Depot',
    capacity: 80, currentLoad: 71.0,
    commodities: ['Robusta Coffee'],
    status: 'active', createdAt: '2025-02-03',
  },
  {
    id: 'hub-003', hubCode: 'HUB-0003',
    name: 'Gulu Farmers Hub', location: 'Gulu Central Market, Stall 22',
    district: 'Gulu', branchId: 'br-003', branchName: 'Gulu North',
    capacity: 40, currentLoad: 12.7,
    commodities: ['Simsim', 'Soya Beans', 'Millet'],
    status: 'active', createdAt: '2025-03-18',
  },
  {
    id: 'hub-004', hubCode: 'HUB-0004',
    name: 'Lira East Aggregation Centre', location: 'Lira Municipality, Block C',
    district: 'Lira', branchId: 'br-004', branchName: 'Lira East',
    capacity: 60, currentLoad: 0,
    commodities: ['Sunflower', 'Soya Beans'],
    status: 'inactive', createdAt: '2025-04-22',
  },
  {
    id: 'hub-005', hubCode: 'HUB-0005',
    name: 'Mbale West Hub', location: 'Mbale Industrial Area, Shed B',
    district: 'Mbale', branchId: 'br-005', branchName: 'Mbale West',
    capacity: 35, currentLoad: 28.9,
    commodities: ['Arabica Coffee', 'Maize'],
    status: 'active', createdAt: '2025-05-30',
  },
];

@Injectable({ providedIn: 'root' })
export class CollectionHubsService {

  private readonly _hubs = signal<CollectionHub[]>([...SEED_HUBS]);
  readonly hubs = this._hubs.asReadonly();

  // ── Read ────────────────────────────────────────────────────────────────────

  /** Replace with: GET API_ENDPOINTS.COOPERATIVE.HUB_BY_ID(id) */
  getById(id: string): CollectionHub | undefined {
    return this._hubs().find(h => h.id === id);
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  /** Replace with: POST API_ENDPOINTS.COOPERATIVE.COLLECTION_HUBS */
  create(input: CollectionHubInput): CollectionHub {
    const seq = this._hubs().length + 1;
    const hub: CollectionHub = {
      id: `hub-${String(seq).padStart(3, '0')}`,
      hubCode: `HUB-${String(seq).padStart(4, '0')}`,
      ...input,
      branchName: this.branchName(input.branchId),
      currentLoad: 0,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this._hubs.update(list => [hub, ...list]);
    return hub;
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  /** Replace with: PUT API_ENDPOINTS.COOPERATIVE.HUB_BY_ID(id) */
  update(id: string, input: CollectionHubInput): CollectionHub | undefined {
    let updated: CollectionHub | undefined;
    this._hubs.update(list =>
      list.map(h => {
        if (h.id !== id) return h;
        updated = { ...h, ...input, branchName: this.branchName(input.branchId) };
        return updated;
      }),
    );
    return updated;
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  /** Replace with: DELETE API_ENDPOINTS.COOPERATIVE.HUB_BY_ID(id) */
  delete(id: string): void {
    this._hubs.update(list => list.filter(h => h.id !== id));
  }

  // ── Status toggle ───────────────────────────────────────────────────────────

  /** Replace with: POST HUB_DEACTIVATE(id) / HUB_ACTIVATE(id) */
  setStatus(id: string, status: HubStatus): void {
    this._hubs.update(list =>
      list.map(h => (h.id === id ? { ...h, status } : h)),
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private branchName(branchId: string): string {
    return HUB_BRANCHES.find(b => b.id === branchId)?.name ?? 'Unassigned';
  }
}
