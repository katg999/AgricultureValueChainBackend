// Cooperative onboarding — single-page form that creates the cooperative,
// its default branch, bank details, and both admin (Admin 1 / Admin 2) accounts
// in one submission.  No step wizard; all validation runs at final submit.

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { finalize, timeout } from 'rxjs';

import { FormShellComponent } from '../../../shared/components/form-wizard/form-wizard.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { CooperativeService } from '../../../core/services/cooperative.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormFeedbackService } from '../../../core/services/form-feedback.service';

@Component({
  selector: 'app-cooperative-onboarding',
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
    //AlertComponent,
  ],
  templateUrl: './cooperative-onboarding.component.html',
  styleUrls: ['./cooperative-onboarding.component.css'],
})
export class CooperativeOnboardingComponent implements OnInit {
  profileForm!: FormGroup;

  // Admin photo previews — stored as base64 strings, not part of the FormGroup
  admin1Photo = '';
  admin2Photo = '';
  admin1PhotoName = '';
  admin2PhotoName = '';

  // Modal + loading state
  showConfirmModal = false;
  isLoading = false;

  private readonly fieldLabels: Record<string, string> = {
    name: 'Cooperative Name',
    registrationNumber: 'Registration Number',
    defaultBranchName: 'Default Branch Name',
    address: 'Address',
    country: 'Country',
    accountName: 'Account Name',
    accountNumber: 'Account Number',
    admin1FullName: 'Admin 1 Full Name',
    admin1Email: 'Admin 1 Email',
    admin1Phone: 'Admin 1 Phone',
    admin2FullName: 'Admin 2 Full Name',
    admin2Email: 'Admin 2 Email',
    admin2Phone: 'Admin 2 Phone',
  };

  // Gender options shared by both admin sections
  readonly genderOptions = ['Female', 'Male', 'Other', 'Prefer not to say'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cooperativeService: PlatformCooperativesService,
    private titleService: Title,
    private toast: ToastService,
    private feedback: FormFeedbackService,
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('New Cooperative | UGAAP');
    this.initProfileForm();
  }

  // ── Form initialisation ───────────────────────────────────────────────────

  initProfileForm(): void {
    this.profileForm = this.fb.group({
      // Section 1 — Identity
      name: ['', Validators.required],
      registrationNumber: ['', Validators.required],
      defaultBranchName: ['', Validators.required],
      defaultBranchLocation: [''],

      // Section 2 — Address
      address: ['', Validators.required],
      country: ['', Validators.required],
      poBox: [''],
      websiteUrl: [''],

      // Section 4 — Bank Account (fixed to Pearl Bank)
      bankName: ['Pearl Bank'],
      bankBranch: [''],
      accountName: ['', Validators.required],
      accountNumber: ['', [Validators.required, Validators.pattern(/^\d{6,20}$/)]],

      // Section 5 — Admin 1 (formerly Maker)
      admin1FullName: ['', Validators.required],
      admin1Email: ['', [Validators.required, Validators.email]],
      admin1Phone: ['', Validators.required],
      admin1DateOfBirth: [''],
      admin1NationalId: ['', Validators.pattern(/^[A-Z0-9]{14}$/)],
      admin1Gender: ['Female'],

      // Section 6 — Admin 2 (formerly Checker)
      admin2FullName: ['', Validators.required],
      admin2Email: ['', [Validators.required, Validators.email]],
      admin2Phone: ['', Validators.required],
      admin2DateOfBirth: [''],
      admin2NationalId: ['', Validators.pattern(/^[A-Z0-9]{14}$/)],
      admin2Gender: ['Female'],
    });
  }

  // ── Photo handling — Admin 1 ──────────────────────────────────────────────

  onAdmin1PhotoSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleAdminPhoto(file, 1);
    (event.target as HTMLInputElement).value = '';
  }

  onAdmin1PhotoDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleAdminPhoto(file, 1);
  }

  removeAdmin1Photo(): void {
    this.admin1Photo = '';
    this.admin1PhotoName = '';
  }

  // ── Photo handling — Admin 2 ──────────────────────────────────────────────

  onAdmin2PhotoSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleAdminPhoto(file, 2);
    (event.target as HTMLInputElement).value = '';
  }

  onAdmin2PhotoDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleAdminPhoto(file, 2);
  }

  removeAdmin2Photo(): void {
    this.admin2Photo = '';
    this.admin2PhotoName = '';
  }

  private handleAdminPhoto(file: File, which: 1 | 2): void {
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > maxBytes) return;

    if (which === 1) this.admin1PhotoName = file.name;
    else this.admin2PhotoName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (which === 1) this.admin1Photo = result;
      else this.admin2Photo = result;
    };
    reader.readAsDataURL(file);
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  openConfirmModal(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.feedback.formError(this.profileForm, this.fieldLabels);
      return;
    }
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  activateCooperative(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.feedback.formError(this.profileForm, this.fieldLabels);
      return;
    }

    this.isLoading = true;

    const v = this.profileForm.value;

    const payload = {
      name: v.name,
      registrationNumber: v.registrationNumber,
      address: v.address,
      country: v.country,
      poBox: v.poBox,
      websiteUrl: v.websiteUrl,
      defaultBranchName: v.defaultBranchName,
      defaultBranchLocation: v.defaultBranchLocation,

      bankDetails: {
        bankName: v.bankName,
        bankBranch: v.bankBranch,
        accountName: v.accountName,
        accountNumber: v.accountNumber,
      },

      // Admin accounts sent as part of the cooperative creation payload
      admin1: {
        fullName: v.admin1FullName,
        email: v.admin1Email,
        phone: v.admin1Phone,
        dateOfBirth: v.admin1DateOfBirth,
        nationalId: v.admin1NationalId,
        gender: v.admin1Gender,
        photoBase64: this.admin1Photo || null,
      },
      admin2: {
        fullName: v.admin2FullName,
        email: v.admin2Email,
        phone: v.admin2Phone,
        dateOfBirth: v.admin2DateOfBirth,
        nationalId: v.admin2NationalId,
        gender: v.admin2Gender,
        photoBase64: this.admin2Photo || null,
      },
    };

    this.cooperativeService
      .createCooperative(payload)
      .pipe(
        timeout(30_000),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.showConfirmModal = false;
          this.toast.success(
            'Cooperative activated',
            `${v.name} has been registered and both admin accounts created.`,
          );
          this.router.navigate(['/platform/cooperatives']);
        },
        error: (err) => {
          this.feedback.serverError(err);
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getFieldError(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email format';
      if (control.errors['pattern']) {
        if (fieldName === 'accountNumber') return 'Account number must be 6–20 digits';
        if (fieldName === 'admin1NationalId' || fieldName === 'admin2NationalId')
          return 'Must be exactly 14 alphanumeric characters';
      }
    }
    return '';
  }

  get formValue() {
    return this.profileForm.value;
  }
}
