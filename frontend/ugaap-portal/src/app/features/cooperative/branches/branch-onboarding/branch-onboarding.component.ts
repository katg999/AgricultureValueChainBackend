import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { BranchService, BranchCreatePayload } from '../../../../core/services/branch.service';
import { SessionService } from '../../../../core/services/session.service';

// Shared UI components used in the template
import { FormShellComponent } from '../../../../shared/components/form-wizard/form-wizard.component';
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { ToastService } from '../../../../core/services/toast.service';

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

  private toast   = inject(ToastService);
  private session = inject(SessionService);

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
      poBox: ['', [Validators.required, Validators.minLength(5), Validators.pattern(/^[A-Za-z0-9\s.,\-\/]+$/)]],

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
    this.isLoading = true;

    const tenantId = this.session.tenantId() ?? '';
    const v = this.formValue;

    const payload: BranchCreatePayload = {
      name:               v.branchName,
      tenantId,
      registrationNumber: v.branchRegistrationNumber,
      location:           v.location,
      region:             v.region,
      country:            v.country,
      establishedDate:    v.establishedDate,
      address:            v.address,
      poBox:              v.poBox,
      websiteUrl:         '',
    };

    this.branchService.createBranch(payload).pipe(
      finalize(() => {
        this.isLoading = false;
        this.showConfirmModal = false;
      }),
    ).subscribe({
      next: (branch) => {
        this.toast.success(`Branch "${branch.name}" created successfully`);
        this.router.navigate(['/cooperative/branches/dashboard']);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Failed to create branch. Please try again.';
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
      if (fieldName === 'poBox')
        return 'Only letters, numbers, spaces, periods, commas, and hyphens allowed';
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
