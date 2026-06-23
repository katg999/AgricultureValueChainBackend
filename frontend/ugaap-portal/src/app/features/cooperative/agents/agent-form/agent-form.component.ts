// features/cooperative/agents/agent-form/agent-form.component.ts
//
// Register / edit a field agent. The same component serves both modes —
// an :id route param switches it to edit and pre-fills the form.
// Persistence goes through AgentsService (mock store today, API later).
//
// Layout follows the shared <app-form-wizard> shell (the farmer-register
// design): step 1 captures identity, step 2 the branch assignment.

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FormShellComponent }   from '../../../../shared/components/form-wizard/form-wizard.component';
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { ToastService } from '../../../../core/services/toast.service';
import { AGENT_BRANCHES, AgentInput, AgentsService } from '../agents.service';

@Component({
  selector: 'app-agent-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormShellComponent,
    FormSectionComponent,
    InputComponent,
    ButtonComponent,
  ],
  templateUrl: './agent-form.component.html',
  styleUrls: ['./agent-form.component.css'],
})
export class AgentFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private agentsService = inject(AgentsService);

  agentId: string | null = null;
  isEditMode = false;
  agentForm!: FormGroup;
  isSaving = false;

  readonly branches = AGENT_BRANCHES;

  ngOnInit(): void {
    this.agentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.agentId;

    this.agentForm = this.fb.group({
      fullName:   ['', Validators.required],
      phone:      ['', [Validators.required, Validators.pattern(/^\+\d{1,3}\d{4,14}$/)]],
      email:      ['', [Validators.required, Validators.email]],
      nationalId: ['', Validators.required],
      role:       ['field_agent', Validators.required],
      branchId:   ['', Validators.required],
    });

    if (this.isEditMode && this.agentId) {
      const agent = this.agentsService.getById(this.agentId);
      if (!agent) {
        this.toast.error('Agent not found', 'The agent you tried to edit does not exist.');
        this.router.navigate(['/cooperative/agents']);
        return;
      }
      this.agentForm.patchValue({
        fullName:   agent.fullName,
        phone:      agent.phone,
        email:      agent.email,
        nationalId: agent.nationalId,
        role:       agent.role,
        branchId:   agent.branchId,
      });
    }
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  getFieldError(field: string): string {
    const ctrl = this.agentForm.get(field);
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'This field is required';
      if (ctrl.errors['email']) return 'Please enter a valid email address';
      if (ctrl.errors['pattern'] && field === 'phone')
        return 'Include country code (e.g. +256712345678)';
    }
    return '';
  }

  cancel(): void {
    this.router.navigate(['/cooperative/agents']);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  saveAgent(): void {
    if (this.agentForm.invalid) {
      this.agentForm.markAllAsTouched();
      return;
    }

    const input = this.agentForm.value as AgentInput;

    if (this.isEditMode && this.agentId) {
      this.agentsService.update(this.agentId, input);
      this.toast.success('Agent updated', `${input.fullName}'s details have been saved.`);
    } else {
      const agent = this.agentsService.create(input);
      this.toast.success('Agent registered', `${agent.fullName} has been registered as ${agent.agentCode}.`);
    }

    this.router.navigate(['/cooperative/agents']);
  }
}
