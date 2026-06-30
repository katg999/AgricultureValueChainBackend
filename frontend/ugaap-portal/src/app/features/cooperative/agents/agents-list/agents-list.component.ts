// features/cooperative/agents/agents-list/agents-list.component.ts
//
// Agent register — lists every field agent with search, status filter, and row actions.
// Action buttons are permission-gated with *hasPermission.

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { Agent, AgentStatus, AgentsService } from '../agents.service';

type StatusFilter = 'all' | AgentStatus;

@Component({
  selector: 'app-agents-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ModalComponent, HasPermissionDirective, DataTableComponent, CellDirective],
  templateUrl: './agents-list.component.html',
  styleUrls: ['./agents-list.component.css'],
})
export class AgentsListComponent implements OnInit {

  private agentsService = inject(AgentsService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // ── Filters ──────────────────────────────────────────────────────────────────

  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly agents = toSignal(this.agentsService.agents$, { initialValue: [] as Agent[] });

  readonly filteredAgents = computed<Agent[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    return this.agents().filter(agent => {
      if (status !== 'all' && agent.status !== status) return false;
      if (!q) return true;
      return [agent.fullName, agent.agentCode, agent.phone, agent.email, agent.branchName]
        .some(field => field.toLowerCase().includes(q));
    });
  });

  readonly activeCount = computed(() => this.agents().filter(a => a.status === 'active').length);

  cols: TableColumn[] = [
    { key: 'agentCode',             header: 'CODE',        class: 'mono' },
    { key: 'name',                  header: 'NAME' },
    { key: 'role',                  header: 'ROLE' },
    { key: 'branchName',            header: 'BRANCH' },
    { key: 'assignedFarmers',       header: 'FARMERS',     class: 'mono' },
    { key: 'collectionsThisSeason', header: 'COLLECTIONS', class: 'mono' },
    { key: 'status',                header: 'STATUS' },
    { key: 'actions',               header: 'ACTIONS' },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.agentsService.list().subscribe({
      error: () => this.toast.error('Failed to load agents', 'Could not reach the server. Please try again.'),
    });
  }

  // ── Detail modal ──────────────────────────────────────────────────────────────

  showDetailModal = false;
  selectedAgent: Agent | null = null;

  viewAgent(agent: Agent): void {
    this.selectedAgent = agent;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedAgent = null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  registerAgent(): void {
    this.router.navigate(['/cooperative/agents/register']);
  }

  editAgent(agent: Agent): void {
    this.router.navigate(['/cooperative/agents', agent.id, 'edit']);
  }

  toggleStatus(agent: Agent): void {
    const next: AgentStatus = agent.status === 'active' ? 'inactive' : 'active';
    if (next === 'inactive' && !confirm(`Deactivate ${agent.fullName}? They will no longer be able to record collections.`)) {
      return;
    }
    this.agentsService.setStatus(agent.id, next).subscribe({
      next: () => this.toast.success(
        next === 'active' ? 'Agent reactivated' : 'Agent deactivated',
        `${agent.fullName} is now ${next}.`,
      ),
      error: () => this.toast.error('Status update failed', 'Could not update agent status. Please try again.'),
    });
  }

  // ── Template helpers ──────────────────────────────────────────────────────────

  roleLabel(agent: Agent): string {
    return agent.role === 'field_agent' ? 'Field Agent' : 'Collection Clerk';
  }

  trackById(_: number, agent: Agent): string {
    return agent.id;
  }
}
