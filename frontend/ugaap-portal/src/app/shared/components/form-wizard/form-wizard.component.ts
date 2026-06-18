// shared/components/form-wizard/form-wizard.component.ts
//
// Reusable two-column form shell, extracted from the branch farmer-register
// design so every create/edit form in the app shares the same look:
//
//   ┌──────────────┬──────────────────────────────┐
//   │ brand        │  <ng-content>                │
//   │ wizard title │   .form-panel (one per step) │
//   │ ● step list  │   .form-nav   (bottom nav)   │
//   │ step counter │                              │
//   └──────────────┴──────────────────────────────┘
//
// The shell owns the card, stepper sidebar and responsive collapse; the
// parent projects its panels and nav buttons and styles them with the
// global "wizard form kit" classes in styles.css (.form-panel, .field-grid,
// .field-label, .form-input, .form-nav, …).
//
// Usage:
//   <app-form-wizard
//     [title]="'Register agent'"
//     [steps]="[{ label: 'Agent details' }, { label: 'Assignment' }]"
//     [currentStep]="currentStep"
//     (stepSelected)="goToStep($event)">
//
//     <section *ngIf="currentStep === 0" class="form-panel"> … </section>
//     <section *ngIf="currentStep === 1" class="form-panel"> … </section>
//     <div class="form-nav"> … </div>
//   </app-form-wizard>

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WizardStep {
  label: string;
}

@Component({
  selector: 'app-form-wizard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-shell">
      <div class="wizard-card">

        <!-- LEFT COLUMN — stepper sidebar -->
        <aside class="stepper-col">
          <div class="wizard-brand">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#F25D27"/>
              <path d="M8 22 Q16 6 24 22" stroke="#fff" stroke-width="2.5"
                    stroke-linecap="round" fill="none"/>
              <circle cx="16" cy="11" r="2.5" fill="#fff"/>
            </svg>
            <span class="wizard-brand-name">UGAAP</span>
          </div>

          <p class="wizard-title">{{ title }}</p>

          <nav class="step-list" aria-label="Form steps">
            <button
              *ngFor="let step of steps; let i = index"
              class="step-item"
              [class.step--done]="i < currentStep"
              [class.step--active]="i === currentStep"
              [attr.aria-current]="i === currentStep ? 'step' : null"
              (click)="stepSelected.emit(i)"
              type="button">

              <span class="step-bubble" aria-hidden="true">
                <svg *ngIf="i < currentStep" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="white" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span *ngIf="i >= currentStep">{{ i + 1 }}</span>
              </span>

              <span class="step-label">{{ step.label }}</span>
            </button>
          </nav>

          <p class="step-counter">Step {{ currentStep + 1 }} of {{ steps.length }}</p>
        </aside>

        <!-- RIGHT COLUMN — panels + nav projected by the parent form -->
        <div class="form-col">
          <ng-content></ng-content>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary:        #F25D27;
      --primary-light:  rgba(242, 93, 39, 0.08);
      --primary-ring:   rgba(242, 93, 39, 0.18);
      --secondary:      #200B26;
      --surface-page:   #F5F4F7;
      --surface-card:   #FFFFFF;
      --surface-subtle: #FAF9FB;
      --border:         #E8E4EE;
      --text-muted:     #6B6277;
      --text-hint:      #9C94A8;
      --step-size:      36px;
    }

    /* ── Page shell ── */
    .page-shell {
      min-height: 100%;
      background: var(--surface-page);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 48px 24px;
      font-family: var(--font-human, 'Inter', sans-serif);
      box-sizing: border-box;
    }

    /* ── Two-column card ── */
    .wizard-card {
      width: 100%;
      max-width: 900px;
      background: var(--surface-card);
      border-radius: 16px;
      box-shadow: 0 4px 32px rgba(32, 11, 38, 0.07),
                  0 1px 4px  rgba(32, 11, 38, 0.04);
      display: grid;
      grid-template-columns: 220px 1fr;
      overflow: hidden;
      min-height: 600px;
    }

    /* ── Stepper sidebar ── */
    .stepper-col {
      background: var(--surface-subtle);
      border-right: 1px solid var(--border);
      padding: 36px 28px;
      display: flex;
      flex-direction: column;
    }

    .wizard-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }

    .wizard-brand-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--secondary);
      letter-spacing: 0.06em;
    }

    .wizard-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin: 0 0 20px;
    }

    .step-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
      width: 100%;
    }

    .step-item:hover { background: rgba(32, 11, 38, 0.04); }

    .step-item:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    .step-bubble {
      width: var(--step-size);
      height: var(--step-size);
      border-radius: 50%;
      border: 2px solid var(--border);
      background: var(--surface-card);
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
    }

    .step--done .step-bubble {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
    }

    .step--active .step-bubble {
      border-color: var(--primary);
      background: var(--primary-light);
      color: var(--primary);
      box-shadow: 0 0 0 4px var(--primary-ring);
    }

    .step-label {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 400;
      transition: color 0.15s ease, font-weight 0.15s ease;
    }

    .step--active .step-label {
      color: var(--secondary);
      font-weight: 600;
    }

    .step-counter {
      font-size: 11px;
      color: var(--text-hint);
      margin: 24px 0 0;
    }

    /* connector line between steps */
    .step-list .step-item + .step-item { position: relative; }

    .step-list .step-item + .step-item::before {
      content: '';
      position: absolute;
      left: 29px;
      top: -10px;
      width: 2px;
      height: 12px;
      background: var(--border);
      border-radius: 1px;
    }

    /* ── Form column ── */
    .form-col {
      display: flex;
      flex-direction: column;
      padding: 40px 44px 36px;
      min-width: 0;
    }

    /* ── Responsive: collapse stepper to a horizontal row ── */
    @media (max-width: 720px) {
      .page-shell {
        padding: 0;
        align-items: stretch;
        background: var(--surface-card);
      }

      .wizard-card {
        grid-template-columns: 1fr;
        border-radius: 0;
        box-shadow: none;
        min-height: 100vh;
      }

      .stepper-col {
        border-right: none;
        border-bottom: 1px solid var(--border);
        padding: 20px 20px 16px;
        gap: 12px;
      }

      .wizard-title,
      .step-counter { display: none; }

      .step-list { flex-direction: row; gap: 0; }

      .step-list .step-item + .step-item::before { display: none; }

      .step-item {
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 6px 4px;
        flex: 1;
      }

      .step-label {
        font-size: 9px;
        text-align: center;
      }

      .step-bubble {
        --step-size: 28px;
        font-size: 11px;
      }

      .form-col { padding: 28px 20px 24px; }
    }
  `],
})
export class FormWizardComponent {

  /** Uppercase label under the brand, e.g. "Register agent" */
  @Input() title = '';

  /** Ordered step definitions shown in the sidebar */
  @Input() steps: WizardStep[] = [];

  /** Index of the step whose panel the parent is currently showing */
  @Input() currentStep = 0;

  /** Emits the clicked step index — the parent decides whether to jump */
  @Output() stepSelected = new EventEmitter<number>();
}
