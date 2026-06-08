import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// remove HttpClient import, add BranchService
import { BranchService, BranchCreatePayload } from '../../../../core/services/branch.service';

// Shared components
import { LogoComponent } from '../../../../shared/components/logo/logo.component';
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
    LogoComponent,
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
    { label: 'BRANCH INFO', number: '01' },
    { label: 'REVIEW', number: '02' },
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
      websiteUrl: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]],
    });
  }

  // ── Navigation ────────────────────────────────────────────
  nextStep(): void {
    if (this.currentStep === 0) {
      if (!this.isStepValid(0)) return;
    }
    this.currentStep++;
  }

  previousStep(): void {
    this.currentStep--;
  }

  // ── Step validation ───────────────────────────────────────
  private isStepValid(step: number): boolean {
    const controls =
      step === 0
        ? [
            'tenantId',
            'branchName',
            'branchRegistrationNumber',
            'location',
            'region',
            'country',
            'establishedDate',
            'address',
            'poBox',
            'websiteUrl',
          ]
        : [];

    let valid = true;
    for (const field of controls) {
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
    // this.isLoading = true;
    this.errorMessage = '';
    this.submitSuccess = false;

    const formVal = this.branchForm.value;

    const payload: BranchCreatePayload = {
      name: formVal.branchName,
      tenantId: formVal.tenantId,
      registrationNumber: formVal.branchRegistrationNumber,
      location: formVal.location,
      region: formVal.region,
      country: formVal.country,
      establishedDate: formVal.establishedDate,
      address: formVal.address,
      poBox: formVal.poBox,
      websiteUrl: formVal.websiteUrl,
    };

    console.log('BRANCH PAYLOAD:', payload);

    this.branchService.createBranch(payload).subscribe({
      next: (res) => {
        console.log('BRANCH CREATED:', res);
        this.isLoading = false;
        this.showConfirmModal = false;
        this.submitSuccess = true;

        this.toast.success(
          'Branch registered',
          `${formVal.branchName} has been successfully registered.`,
        );

        setTimeout(() => {
          this.router.navigate(['/cooperatives/branches/onboarding']);
        }, 1500);
      },
      error: (err) => {
        console.error('BRANCH REGISTRATION FAILED:', err);
        this.isLoading = false;
        this.showConfirmModal = false;
        this.errorMessage = err?.error?.message ?? 'Failed to register branch. Please try again.';
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
        if (fieldName === 'tenantId')
          return 'Only uppercase letters, numbers, and hyphens allowed (e.g., TENANT-001)';
        if (fieldName === 'branchRegistrationNumber')
          return 'Only uppercase letters and numbers allowed (e.g., KAS001)';
        if (fieldName === 'websiteUrl') return 'Enter a valid URL (e.g., https://example.com)';
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
