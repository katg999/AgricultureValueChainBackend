// BatchFlowStatusComponent shows where a payment batch sits in its lifecycle
// (Draft -> Pending Approval -> Approved -> Disbursed, or Rejected) plus
// per-farmer settle progress once disbursement has started. Purely
// presentational — no services, no outputs. The host component (e.g.
// BatchFarmersComponent) already computes everything this needs.
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StepperComponent, Step } from '../stepper/stepper.component';
import { BadgeComponent } from '../badge/badge';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { AlertComponent } from '../alert/alert.component';

// Defined locally (not imported from the finance feature's batch.models.ts)
// so this shared component has no dependency on any feature folder. The
// literal values match BatchStatus exactly, so a PaymentBatch.status value
// is structurally assignable here with no cast needed.
export type BatchFlowStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Disbursed';

// Rejected is a terminal off-ramp from Pending Approval, not a step on this
// line — StepperComponent has no concept of a failed/branched step, so it's
// excluded here and handled as its own case in the template.
const STEP_ORDER: BatchFlowStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Disbursed'];

@Component({
  selector: 'app-batch-flow-status',
  standalone: true,
  imports: [CommonModule, StepperComponent, BadgeComponent, ProgressBarComponent, AlertComponent],
  templateUrl: './batch-flow-status.component.html',
  styleUrls: ['./batch-flow-status.component.css'],
})
export class BatchFlowStatusComponent {
  @Input() status!: BatchFlowStatus;
  @Input() totalFarmers = 0;
  @Input() settledCount = 0;
  @Input() hasFailures = false;

  readonly steps: Step[] = [
    { label: 'Draft', number: '01' },
    { label: 'Pending Approval', number: '02' },
    { label: 'Approved', number: '03' },
    { label: 'Disbursed', number: '04' },
  ];

  get isRejected(): boolean {
    return this.status === 'Rejected';
  }

  get currentStep(): number {
    return STEP_ORDER.indexOf(this.status);
  }

  // Progress only means something once disbursement can plausibly have
  // started — showing "0 of 12" while a batch is still Draft/Pending would
  // imply work is underway when it hasn't begun.
  get showProgress(): boolean {
    return this.status === 'Approved' || this.status === 'Disbursed';
  }

  get progressPercentage(): number {
    return this.totalFarmers > 0 ? Math.round((this.settledCount / this.totalFarmers) * 100) : 0;
  }

  get progressVariant(): 'success' | 'warning' | 'info' {
    if (this.hasFailures) return 'warning';
    if (this.progressPercentage === 100) return 'success';
    return 'info';
  }

  get failureMessage(): string {
    return `${this.settledCount} of ${this.totalFarmers} farmers paid — some failed, retry below.`;
  }
}
