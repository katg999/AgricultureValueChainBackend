// features/cooperative/agents/agents.service.ts
//
// Domain service for field agents — the people who register farmers and
// collect produce on behalf of a branch.
//
// Currently backed by an in-memory mock store so the screens are fully
// functional without the backend. Each method documents the API call that
// replaces it (endpoints already defined in core/constants/api-endpoints.ts
// under COOPERATIVE.AGENTS).

import { Injectable, signal } from '@angular/core';

export type AgentStatus = 'active' | 'inactive';
export type AgentRole = 'field_agent' | 'collection_clerk';

export interface Agent {
  id: string;
  /** Technical reference shown in mono font, e.g. AGT-0007 */
  agentCode: string;
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  role: AgentRole;
  branchId: string;
  branchName: string;
  assignedFarmers: number;
  collectionsThisSeason: string;
  status: AgentStatus;
  registeredAt: string;
}

/** Fields captured by the register / edit form */
export interface AgentInput {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  role: AgentRole;
  branchId: string;
}

/** Branches offered in the assignment dropdown — mirrors branch mock data */
export const AGENT_BRANCHES: { id: string; name: string }[] = [
  { id: 'br-001', name: 'Hoima Central' },
  { id: 'br-002', name: 'Masindi Depot' },
  { id: 'br-003', name: 'Gulu North' },
  { id: 'br-004', name: 'Lira East' },
  { id: 'br-005', name: 'Mbale West' },
];

const SEED_AGENTS: Agent[] = [
  {
    id: 'agt-001', agentCode: 'AGT-0001', fullName: 'Moses Byaruhanga',
    phone: '+256772114501', email: 'moses.b@bugishu.coop', nationalId: 'CM900421003XKE',
    role: 'field_agent', branchId: 'br-001', branchName: 'Hoima Central',
    assignedFarmers: 64, collectionsThisSeason: '18.2 MT', status: 'active', registeredAt: '2025-02-14',
  },
  {
    id: 'agt-002', agentCode: 'AGT-0002', fullName: 'Sarah Nambooze',
    phone: '+256701558294', email: 'sarah.n@bugishu.coop', nationalId: 'CF880317002LMQ',
    role: 'collection_clerk', branchId: 'br-001', branchName: 'Hoima Central',
    assignedFarmers: 41, collectionsThisSeason: '12.7 MT', status: 'active', registeredAt: '2025-03-02',
  },
  {
    id: 'agt-003', agentCode: 'AGT-0003', fullName: 'Ivan Okello',
    phone: '+256759301873', email: 'ivan.o@bugishu.coop', nationalId: 'CM921105004PRT',
    role: 'field_agent', branchId: 'br-003', branchName: 'Gulu North',
    assignedFarmers: 52, collectionsThisSeason: '15.9 MT', status: 'active', registeredAt: '2025-04-19',
  },
  {
    id: 'agt-004', agentCode: 'AGT-0004', fullName: 'Grace Akello',
    phone: '+256782446120', email: 'grace.a@bugishu.coop', nationalId: 'CF950623001ZWB',
    role: 'field_agent', branchId: 'br-004', branchName: 'Lira East',
    assignedFarmers: 38, collectionsThisSeason: '9.4 MT', status: 'inactive', registeredAt: '2025-01-28',
  },
  {
    id: 'agt-005', agentCode: 'AGT-0005', fullName: 'Peter Wanyama',
    phone: '+256703918456', email: 'peter.w@bugishu.coop', nationalId: 'CM870914005QAC',
    role: 'collection_clerk', branchId: 'br-005', branchName: 'Mbale West',
    assignedFarmers: 47, collectionsThisSeason: '14.1 MT', status: 'active', registeredAt: '2025-05-07',
  },
];

@Injectable({ providedIn: 'root' })
export class AgentsService {

  /** Reactive agent list — components read this signal directly */
  private readonly _agents = signal<Agent[]>([...SEED_AGENTS]);
  readonly agents = this._agents.asReadonly();

  // ── Read ────────────────────────────────────────────────────────────────────

  /** Replace with: GET API_ENDPOINTS.COOPERATIVE.AGENT_BY_ID(id) */
  getById(id: string): Agent | undefined {
    return this._agents().find(a => a.id === id);
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  /** Replace with: POST API_ENDPOINTS.COOPERATIVE.AGENTS */
  create(input: AgentInput): Agent {
    const seq = this._agents().length + 1;
    const agent: Agent = {
      id: `agt-${String(seq).padStart(3, '0')}`,
      agentCode: `AGT-${String(seq).padStart(4, '0')}`,
      ...input,
      branchName: this.branchName(input.branchId),
      assignedFarmers: 0,
      collectionsThisSeason: '0 MT',
      status: 'active',
      registeredAt: new Date().toISOString().slice(0, 10),
    };
    this._agents.update(list => [agent, ...list]);
    return agent;
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  /** Replace with: PUT API_ENDPOINTS.COOPERATIVE.AGENT_BY_ID(id) */
  update(id: string, input: AgentInput): Agent | undefined {
    let updated: Agent | undefined;
    this._agents.update(list =>
      list.map(a => {
        if (a.id !== id) return a;
        updated = { ...a, ...input, branchName: this.branchName(input.branchId) };
        return updated;
      }),
    );
    return updated;
  }

  /** Replace with: POST AGENT_DEACTIVATE(id) / AGENT_ACTIVATE(id) */
  setStatus(id: string, status: AgentStatus): void {
    this._agents.update(list =>
      list.map(a => (a.id === id ? { ...a, status } : a)),
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private branchName(branchId: string): string {
    return AGENT_BRANCHES.find(b => b.id === branchId)?.name ?? 'Unassigned';
  }
}
