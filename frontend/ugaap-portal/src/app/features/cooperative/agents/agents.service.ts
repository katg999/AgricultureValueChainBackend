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
import { MOCK_BRANCHES } from '../../../core/mock/mock-branch';
import { MOCK_AGENTS } from '../../../core/mock/mock-cooperative';

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

export { MOCK_BRANCHES as AGENT_BRANCHES } from '../../../core/mock/mock-branch';

@Injectable({ providedIn: 'root' })
export class AgentsService {

  private readonly _agents = new BehaviorSubject<Agent[]>(
    USE_MOCK ? [...MOCK_AGENTS] as Agent[] : [],
  );
  readonly agents$ = this._agents.asObservable();

  constructor(private http: HttpClient) {}

  // ── Read ─────────────────────────────────────────────────────────────────────

  list(): Observable<Agent[]> {
    if (USE_MOCK) return of([...MOCK_AGENTS] as Agent[]);
    return this.http.get<Agent[]>(API_ENDPOINTS.COOPERATIVE.AGENTS).pipe(
      tap(agents => this._agents.next(agents)),
      catchError(() => of([])),
    );
  }

  getById(id: string): Observable<Agent | undefined> {
    if (USE_MOCK) return of(MOCK_AGENTS.find(a => a.id === id) as Agent | undefined);
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
    return MOCK_BRANCHES.find(b => b.id === branchId)?.name ?? 'Unassigned';
  }
}
