// features/platform/coop-onboarding/cooperative-onboarding.component.ts
//
// Cooperative onboarding — sets up a new cooperative on the platform.
//
// Layout follows the shared <app-form-wizard> shell (the farmer-register
// design): cooperative info → bank details → default branch → review.
// On activation the payload (including bank details for disbursements) is
// posted to the cooperatives endpoint, then the flow continues into
// maker-checker account creation.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { FormWizardComponent } from '../../../shared/components/form-wizard/form-wizard.component';
// Shared components
import { StepperComponent, Step } from '../../../shared/components/stepper/stepper.component';
import { InputComponent }  from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent }  from '../../../shared/components/modal/modal.component';
import { AlertComponent }  from '../../../shared/components/alert/alert.component';
import { CooperativeService } from '../../../core/services/cooperative.service';

/** Form controls validated before leaving each step */
const STEP_FIELDS: string[][] = [
  ['name', 'registrationNumber', 'address', 'country',
   'contactPersonName', 'contactPersonPhone', 'contactPersonEmail'],
  ['bankName', 'accountName', 'accountNumber'],
  ['defaultBranchName'],
  [],   // review
];

@Component({
  selector: 'app-cooperative-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    StepperComponent,
    InputComponent,
    ButtonComponent,
    ModalComponent,
    AlertComponent,
  ],
  templateUrl: './cooperative-onboarding.component.html',
  styleUrls: ['./cooperative-onboarding.component.css'],
})
export class CooperativeOnboardingComponent implements OnInit {
  // ── Stepper ───────────────────────────────────────────────
  readonly steps: Step[] = [
    { label: 'Identity',  number: '01' },
    { label: 'Address',   number: '02' },
    { label: 'Contact',   number: '03' },
    { label: 'Branch',    number: '04' },
    { label: 'Review',    number: '05' },
  ];
  currentStep = 0;

  isSaving = false;

  profileForm!: FormGroup;

  // Field groups per step, used for step-level validation
  private stepFields: string[][] = [
    ['name', 'registrationNumber'],
    ['address', 'country', 'poBox', 'websiteUrl'],
    ['contactPersonName', 'contactPersonPhone', 'contactPersonEmail'],
    ['defaultBranchName', 'defaultBranchLocation'],
    [],
  ];

  // ── Save progress ─────────────────────────────────────────
  saveProgress(): void {
    this.isSaving = true;
    // Replace with: PATCH /cooperative/onboarding/draft
    setTimeout(() => {
      this.isSaving = false;
      this.router.navigate(['/platform/cooperatives']);
    }, 600);
  }

  // ── Modal ─────────────────────────────────────────────────
  showConfirmModal = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cooperativeService: CooperativeService,
    private titleService: Title,
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Cooperative Onboarding | UGAAP');
    this.initProfileForm();
  }

  // ── Init form ─────────────────────────────────────────────

  initProfileForm(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      registrationNumber: ['', Validators.required],
      address: ['', Validators.required],
      country: ['', Validators.required],
      poBox: [''],
      websiteUrl: [''],
      contactPersonName: ['', Validators.required],
      contactPersonPhone: ['', Validators.required],
      contactPersonEmail: ['', [Validators.required, Validators.email]],

      // Default branch — created automatically on activation
      defaultBranchName:     ['', Validators.required],
      defaultBranchLocation: [''],

      // Bank details — where farmer payments are disbursed from
      bankName:            ['', Validators.required],
      bankBranch:          [''],
      accountName:         ['', Validators.required],
      accountNumber:       ['', [Validators.required, Validators.pattern(/^\d{6,20}$/)]],
      mobileMoneyProvider: [''],
      mobileMoneyNumber:   [''],
    });
  }

  // ── Step navigation ───────────────────────────────────────

  /** Validate current step's fields then advance one step */
  nextStep(): void {
    const fields = this.stepFields[this.currentStep] ?? [];
    let valid = true;
    for (const field of fields) {
      const ctrl = this.profileForm.get(field);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) valid = false;
    }
    if (!valid) return;
    this.currentStep = Math.min(this.currentStep + 1, this.steps.length - 1);
  }

  previousStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 0);
  }

  /** Sidebar clicks: backward always allowed, forward gated by validation */
  goToStep(index: number): void {
    if (index <= this.currentStep) {
      this.currentStep = index;
      return;
    }
    if (this.validateStep(this.currentStep)) {
      this.currentStep = index;
    }
  }

  private validateStep(step: number): boolean {
    const fields = STEP_FIELDS[step] ?? [];
    let valid = true;
    for (const field of fields) {
      const ctrl = this.profileForm.get(field);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) valid = false;
    }
    return valid;
  }

  // ── Modal ─────────────────────────────────────────────────

  openConfirmModal(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  // ── Submit (navigate to Maker & Checker creation) ────────

  activateCooperative(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.showConfirmModal = false;

    const payload = {
      name: this.profileForm.value.name,
      registrationNumber: this.profileForm.value.registrationNumber,
      address: this.profileForm.value.address,
      contactPersonName: this.profileForm.value.contactPersonName,
      contactPersonPhone: this.profileForm.value.contactPersonPhone,
      contactPersonEmail: this.profileForm.value.contactPersonEmail,
      poBox: this.profileForm.value.poBox,
      websiteUrl: this.profileForm.value.websiteUrl,
      country: this.profileForm.value.country,
      defaultBranchName: this.profileForm.value.defaultBranchName,
      defaultBranchLocation: this.profileForm.value.defaultBranchLocation,

      bankDetails: {
        bankName: this.profileForm.value.bankName,
        bankBranch: this.profileForm.value.bankBranch,
        accountName: this.profileForm.value.accountName,
        accountNumber: this.profileForm.value.accountNumber,
        mobileMoneyProvider: this.profileForm.value.mobileMoneyProvider,
        mobileMoneyNumber: this.profileForm.value.mobileMoneyNumber,
      },
    };

    this.cooperativeService.createCooperative(payload).subscribe({
      next: (res) => {
        this.isLoading = false;

        this.router.navigate(['/platform/maker-checker'], {
          state: {
            cooperative: res,
            message: `Cooperative "${payload.name}" created successfully`,
          },
        });
      },

      error: (err) => {
        this.isLoading = false;
        console.error('Create cooperative failed:', err);
        this.errorMessage =
          err?.error?.message ?? 'You do not have permission to create a cooperative.';
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────

  getFieldError(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email format';
      if (control.errors['pattern'] && fieldName === 'accountNumber')
        return 'Account number must be 6–20 digits';
    }
    return '';
  }

  get formValue() {
    return this.profileForm.value;
  }
}