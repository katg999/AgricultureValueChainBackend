// features/cooperative/agents/agents.service.ts
//
// Domain service for field agents.
// Uses HttpClient + API_ENDPOINTS; mock data is returned when USE_MOCK = true.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { USE_MOCK } from '../../../core/mock/mock-config';

export type AgentStatus = 'active' | 'inactive';
export type AgentRole = 'field_agent' | 'collection_clerk';

export interface Agent {
  id: string;
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

export interface AgentInput {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  role: AgentRole;
  branchId: string;
}

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

  private readonly _agents = new BehaviorSubject<Agent[]>(
    USE_MOCK ? [...SEED_AGENTS] : [],
  );
  readonly agents$ = this._agents.asObservable();

  constructor(private http: HttpClient) {}

  // ── Read ─────────────────────────────────────────────────────────────────────

  list(): Observable<Agent[]> {
    if (USE_MOCK) return of([...SEED_AGENTS]);
    return this.http.get<Agent[]>(API_ENDPOINTS.COOPERATIVE.AGENTS).pipe(
      tap(agents => this._agents.next(agents)),
      catchError(err => { throw err; }),
    );
  }

  getById(id: string): Observable<Agent | undefined> {
    if (USE_MOCK) return of(SEED_AGENTS.find(a => a.id === id));
    return this.http.get<Agent>(API_ENDPOINTS.COOPERATIVE.AGENT_BY_ID(id)).pipe(
      catchError(err => { throw err; }),
    );
  }

  // ── Create ────────────────────────────────────────────────────────────────────

  create(input: AgentInput): Observable<Agent> {
    if (USE_MOCK) {
      const seq = this._agents.value.length + 1;
      const agent: Agent = {
        id: `agt-${String(seq).padStart(3, '0')}`,
        agentCode: `AGT-${String(seq).padStart(4, '0')}`,
        ...input,
        branchName: this._branchName(input.branchId),
        assignedFarmers: 0,
        collectionsThisSeason: '0 MT',
        status: 'active',
        registeredAt: new Date().toISOString().slice(0, 10),
      };
      this._agents.next([agent, ...this._agents.value]);
      return of(agent);
    }
    return this.http.post<Agent>(API_ENDPOINTS.COOPERATIVE.AGENTS, input).pipe(
      tap(agent => this._upsert(agent)),
      catchError(err => { throw err; }),
    );
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  update(id: string, input: AgentInput): Observable<Agent> {
    if (USE_MOCK) {
      const existing = this._agents.value.find(a => a.id === id);
      const updated: Agent = {
        ...(existing as Agent),
        ...input,
        branchName: this._branchName(input.branchId),
      };
      this._upsert(updated);
      return of(updated);
    }
    return this.http.put<Agent>(API_ENDPOINTS.COOPERATIVE.AGENT_BY_ID(id), input).pipe(
      tap(agent => this._upsert(agent)),
      catchError(err => { throw err; }),
    );
  }

  setStatus(id: string, status: AgentStatus): Observable<void> {
    if (USE_MOCK) {
      this._agents.next(this._agents.value.map(a => a.id === id ? { ...a, status } : a));
      return of(undefined);
    }
    const url = status === 'active'
      ? API_ENDPOINTS.COOPERATIVE.AGENT_ACTIVATE(id)
      : API_ENDPOINTS.COOPERATIVE.AGENT_DEACTIVATE(id);
    return this.http.post<void>(url, {}).pipe(
      tap(() => this._agents.next(this._agents.value.map(a => a.id === id ? { ...a, status } : a))),
      catchError(err => { throw err; }),
    );
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private _upsert(agent: Agent): void {
    const list = [...this._agents.value];
    const idx = list.findIndex(a => a.id === agent.id);
    if (idx >= 0) list[idx] = agent; else list.unshift(agent);
    this._agents.next(list);
  }

  private _branchName(branchId: string): string {
    return AGENT_BRANCHES.find(b => b.id === branchId)?.name ?? 'Unassigned';
  }
}
