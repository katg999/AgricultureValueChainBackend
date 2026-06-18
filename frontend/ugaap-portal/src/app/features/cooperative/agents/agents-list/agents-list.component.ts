// features/cooperative/agents/agents-list/agents-list.component.ts
//
// Agent register — lists every field agent in the cooperative with search,
// status filtering and row actions (view, edit, deactivate/reactivate).
// Action buttons are permission-gated with *hasPermission, so a role without
// agents.register never sees the Register button, etc.

import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { Agent, AgentStatus, AgentsService } from '../agents.service';

type StatusFilter = 'all' | AgentStatus;

@Component({
  selector: 'app-agents-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ModalComponent, HasPermissionDirective],
  templateUrl: './agents-list.component.html',
  styleUrls: ['./agents-list.component.css'],
})
export class AgentsListComponent {

  private agentsService = inject(AgentsService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // ── Filters ─────────────────────────────────────────────────────────────────

  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly agents = this.agentsService.agents;

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

  // ── Detail modal ────────────────────────────────────────────────────────────

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

  // ── Actions ─────────────────────────────────────────────────────────────────

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
    this.agentsService.setStatus(agent.id, next);
    this.toast.success(
      next === 'active' ? 'Agent reactivated' : 'Agent deactivated',
      `${agent.fullName} is now ${next}.`,
    );
  }

  // ── Template helpers ────────────────────────────────────────────────────────

  roleLabel(agent: Agent): string {
    return agent.role === 'field_agent' ? 'Field Agent' : 'Collection Clerk';
  }

  trackById(_: number, agent: Agent): string {
    return agent.id;
  }
}
