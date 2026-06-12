import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// remove HttpClient import, add BranchService
import { BranchService, BranchCreatePayload } from '../../../../core/services/branch.service';

// Shared components
import { StepperComponent, Step } from '../../../../shared/components/stepper/stepper.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { ToastService } from '../../../../core/services/toast.service';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';

@Component({
  selector: 'app-branch-onboarding',
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
  templateUrl: './branch-onboarding.component.html',
  styleUrls: ['./branch-onboarding.component.css'],
})
export class BranchOnboardingComponent implements OnInit {
  // ── Stepper ───────────────────────────────────────────────
  steps: Step[] = [
    { label: 'IDENTITY', number: '01' },
    { label: 'LOCATION', number: '02' },
    { label: 'CONTACT',  number: '03' },
    { label: 'MANAGER',  number: '04' },
    { label: 'REVIEW',   number: '05' },
  ];

  currentStep = 0;

  // ── Forms ─────────────────────────────────────────────────
  branchForm!: FormGroup;

  // ── Modal ─────────────────────────────────────────────────
  showConfirmModal = false;

  // ── Loading states ────────────────────────────────────────
  isLoading = false;
  isSaving = false;

  private toast = inject(ToastService);

  // ── Error & success ───────────────────────────────────────
  errorMessage: string = '';
  submitSuccess: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private branchService: BranchService,
  ) {}

  ngOnInit(): void {
    this.initBranchForm();
  }

  // ── Init form ─────────────────────────────────────────────
  initBranchForm(): void {
    this.branchForm = this.fb.group({
      tenantId: ['', []],
      branchName: ['', [Validators.required, Validators.minLength(3)]],
      branchRegistrationNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
      location: ['', Validators.required],
      region: ['', Validators.required],
      country: ['', Validators.required],
      establishedDate: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(10)]],
      poBox: ['', [Validators.required, Validators.minLength(5)]],
      managerName: ['', [Validators.required, Validators.minLength(3)]],
      managerEmail: ['', [Validators.required, Validators.email]],
      managerPhone: ['', [Validators.required, Validators.pattern(/^\+\d{1,3}\d{4,14}$/)]]
    });
  }

  // ── Navigation ────────────────────────────────────────────
  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) return;
    this.currentStep++;
  }

  previousStep(): void {
    this.currentStep--;
  }

  // ── Step validation ───────────────────────────────────────

  private readonly STEP_FIELDS: Record<number, string[]> = {
    0: ['branchName', 'branchRegistrationNumber'],
    1: ['location', 'region', 'country', 'establishedDate'],
    2: ['address', 'poBox'],
    3: ['managerName', 'managerEmail', 'managerPhone'],
  };

  private isStepValid(step: number): boolean {
    const fields = this.STEP_FIELDS[step] ?? [];
    let valid = true;
    for (const field of fields) {
      const control = this.branchForm.get(field);
      if (control?.invalid) {
        control.markAsTouched();
        valid = false;
      }
    }
    return valid;
  }

  // ── Modal ─────────────────────────────────────────────────
  openConfirmModal(): void {
    this.showConfirmModal = true;
    this.errorMessage = '';
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  // ── Register branch ───────────────────────────────────────
  registerBranch(): void {
    this.errorMessage = '';
    this.router.navigate(['/cooperative/branches/dashboard'], {
      state: {
        newBranch: {
          name:        this.formValue.branchName,
          location:    `${this.formValue.location}, ${this.formValue.region}`,
          branchCode:  this.formValue.branchRegistrationNumber,
          country:     this.formValue.country,
          managerName: this.formValue.managerName,
        },
      },
    });
  }

  // ── Save progress ─────────────────────────────────────────
  saveProgress(): void {
    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
      this.toast.success(
        'Progress saved',
        'Your branch details have been saved. You can continue later.',
      );
    }, 1000);
  }

  // ── Field error helper ────────────────────────────────────
  getFieldError(fieldName: string): string {
    const control = this.branchForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email format';
      if (control.errors['pattern']) {
        // Custom messages per field
        if (fieldName === 'branchRegistrationNumber') return 'Only uppercase letters and numbers allowed (e.g., KAS001)';
        if (fieldName === 'managerPhone') return 'Include country code (e.g., +256712345678)';
        return 'Invalid format';
      }
      if (control.errors['minlength']) {
        const requiredLength = control.errors['minlength'].requiredLength;
        return `Minimum ${requiredLength} characters required`;
      }
    }
    return '';
  }

  // ── Form value getter ─────────────────────────────────────
  get formValue() {
    return this.branchForm.value;
  }
}
