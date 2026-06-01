import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Shared components
import { LogoComponent } from '../../../../shared/components/logo/logo.component';
import { StepperComponent, Step } from '../../../../shared/components/stepper/stepper.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

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
    AlertComponent
  ],
  templateUrl: './branch-onboarding.component.html',
  styleUrls: ['./branch-onboarding.component.css']
})
export class BranchOnboardingComponent implements OnInit {

  // ── Stepper ───────────────────────────────────────────────
  steps: Step[] = [
    { label: 'BRANCH INFO', number: '01' },
    { label: 'MANAGER', number: '02' },
    { label: 'REVIEW', number: '03' }
  ];

  currentStep = 0;

  // ── Forms ─────────────────────────────────────────────────
  branchForm!: FormGroup;

  // ── Modal ─────────────────────────────────────────────────
  showConfirmModal = false;

  // ── Loading states ────────────────────────────────────────
  isLoading = false;
  isSaving = false;

  // ── Error & success ───────────────────────────────────────
  errorMessage: string = '';
  submitSuccess: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initBranchForm();
  }

  // ── Init form ─────────────────────────────────────────────

  initBranchForm(): void {
    this.branchForm = this.fb.group({
      branchName: ['', [Validators.required, Validators.minLength(3)]],
      branchRegistrationNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
      location: ['', Validators.required],
      region: ['', Validators.required],
      country: ['', Validators.required],
      establishedDate: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(10)]],
      poBox: ['', [Validators.required, Validators.minLength(5)]],
      websiteUrl: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]],
      managerName: ['', [Validators.required, Validators.minLength(3)]],
      managerEmail: ['', [Validators.required, Validators.email]],
      managerPhone: ['', [Validators.required, Validators.pattern(/^\+\d{1,3}\d{4,14}$/)]]
    });
  }

  // ── Navigation ────────────────────────────────────────────

  nextStep(): void {
    if (this.currentStep === 0) {
      if (!this.isStepValid(0)) return;
    } else if (this.currentStep === 1) {
      if (!this.isStepValid(1)) return;
    }
    this.currentStep++;
  }

  previousStep(): void {
    this.currentStep--;
  }

  // ── Step validation ───────────────────────────────────────

  private isStepValid(step: number): boolean {
    const controls = step === 0
      ? ['branchName', 'branchRegistrationNumber', 'location', 'region', 'country', 'establishedDate', 'address', 'poBox', 'websiteUrl']
      : ['managerName', 'managerEmail', 'managerPhone'];

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
    this.isLoading = true;
    this.errorMessage = '';
    this.submitSuccess = false;

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.showConfirmModal = false;
      this.submitSuccess = true;

      // Optional: Navigate or show success message in the current view
      // this.router.navigate(['/branches/success'], { state: { branch: this.branchForm.value } });
    }, 1500);
  }

  // ── Save progress ─────────────────────────────────────────

  saveProgress(): void {
    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
      alert('Progress saved! (Demo only - no actual save)');
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
        if (fieldName === 'websiteUrl') return 'Enter a valid URL (e.g., https://example.com)';
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