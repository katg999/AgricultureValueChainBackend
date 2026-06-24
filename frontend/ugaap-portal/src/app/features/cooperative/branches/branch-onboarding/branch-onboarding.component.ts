import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { BranchService, BranchCreatePayload } from '../../../../core/services/branch.service';

// Shared UI components used in the template
import { FormShellComponent } from '../../../../shared/components/form-wizard/form-wizard.component';
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
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
    FormShellComponent,
    FormSectionComponent,
    InputComponent,
    ButtonComponent,
    ModalComponent,
    AlertComponent,
  ],
  templateUrl: './branch-onboarding.component.html',
  styleUrls: ['./branch-onboarding.component.css'],
})
export class BranchOnboardingComponent implements OnInit {

  // ── Form ──────────────────────────────────────────────────
  branchForm!: FormGroup;

  // ── UI state ──────────────────────────────────────────────
  showConfirmModal = false;
  isLoading = false;
  errorMessage = '';

  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private branchService: BranchService,
  ) {}

  ngOnInit(): void {
    this.initBranchForm();
  }

  // ── Form setup ────────────────────────────────────────────

  initBranchForm(): void {
    this.branchForm = this.fb.group({
      tenantId: [''],

      // Identity
      branchName: ['', [Validators.required, Validators.minLength(3)]],
      // Reg number must be uppercase letters and digits only (e.g., KAS001)
      branchRegistrationNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],

      // Location
      location: ['', Validators.required],
      region: ['', Validators.required],
      country: ['', Validators.required],
      establishedDate: ['', Validators.required],

      // Address
      address: ['', [Validators.required, Validators.minLength(10)]],
      poBox: ['', [Validators.required, Validators.minLength(5)]],

      // Manager
      managerName: ['', [Validators.required, Validators.minLength(3)]],
      managerEmail: ['', [Validators.required, Validators.email]],
      // Phone must include country code: +[1–3 digits][4–14 digits]
      managerPhone: ['', [Validators.required, Validators.pattern(/^\+\d{1,3}\d{4,14}$/)]],
    });
  }

  // ── Modal ─────────────────────────────────────────────────

  openConfirmModal(): void {
    if (this.branchForm.invalid) {
      // Touch every field so red error messages appear on screen
      this.branchForm.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  // ── Submit ────────────────────────────────────────────────

  registerBranch(): void {
    this.errorMessage = '';
    // Navigate to the branch dashboard and pass the new branch data via router state
    // so the dashboard can show a success toast / highlight the new row
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

  // ── Field error messages ──────────────────────────────────

  getFieldError(fieldName: string): string {
    const control = this.branchForm.get(fieldName);
    if (!control?.touched || !control?.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['email']) return 'Invalid email format';
    if (control.errors['pattern']) {
      if (fieldName === 'branchRegistrationNumber')
        return 'Only uppercase letters and numbers allowed (e.g., KAS001)';
      if (fieldName === 'managerPhone')
        return 'Include country code (e.g., +256712345678)';
      return 'Invalid format';
    }
    if (control.errors['minlength']) {
      const required = control.errors['minlength'].requiredLength;
      return `Minimum ${required} characters required`;
    }
    return '';
  }

  // ── Convenience getter ────────────────────────────────────

  get formValue() {
    return this.branchForm.value;
  }
}
