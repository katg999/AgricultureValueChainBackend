// features/cooperative/profile/cooperative-profile.component.ts
//
// Cooperative profile — the organisation's own record: registration details,
// contact person, and the bank details used for farmer payment disbursements.
// Bank details are editable in place (agents.edit-style permission gating via
// organisation.edit). Data is mock-seeded until the profile endpoint lands.

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { ToastService } from '../../../core/services/toast.service';
import { CooperativeBankDetails } from '../../../core/services/cooperative.service';

interface CooperativeProfile {
  name: string;
  registrationNumber: string;
  address: string;
  country: string;
  poBox: string;
  websiteUrl: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  memberSince: string;
  status: 'active' | 'suspended';
}

@Component({
  selector: 'app-cooperative-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InfoCardComponent,
    InputComponent,
    ButtonComponent,
    HasPermissionDirective,
  ],
  templateUrl: './cooperative-profile.component.html',
  styleUrls: ['./cooperative-profile.component.css'],
})
export class CooperativeProfileComponent {

  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // Mock data — replace with GET /cooperative profile endpoint when available
  profile: CooperativeProfile = {
    name: 'Bugishu Cooperative Union',
    registrationNumber: 'COOP/2024/0157',
    address: 'Plot 12, Republic Street, Mbale',
    country: 'Uganda',
    poBox: 'P.O. Box 547, Mbale',
    websiteUrl: 'https://bugishu.coop',
    contactPersonName: 'James Wabwire',
    contactPersonPhone: '+256772889911',
    contactPersonEmail: 'admin@bugishu.coop',
    memberSince: '2024-03-18',
    status: 'active',
  };

  bankDetails: CooperativeBankDetails = {
    bankName: 'Stanbic Bank Uganda',
    bankBranch: 'Mbale Branch',
    accountName: 'Bugishu Cooperative Union Ltd',
    accountNumber: '9030012345678',
    mobileMoneyProvider: 'MTN MoMo',
    mobileMoneyNumber: '+256772889911',
  };

  /** When true the bank details card switches to its edit form */
  isEditingBank = false;
  isSaving = false;

  bankForm = this.fb.group({
    bankName: ['', Validators.required],
    bankBranch: [''],
    accountName: ['', Validators.required],
    accountNumber: ['', [Validators.required, Validators.pattern(/^\d{6,20}$/)]],
    mobileMoneyProvider: [''],
    mobileMoneyNumber: [''],
  });

  // ── Bank details editing ────────────────────────────────────────────────────

  startEditingBank(): void {
    this.bankForm.patchValue(this.bankDetails);
    this.isEditingBank = true;
  }

  cancelEditingBank(): void {
    this.isEditingBank = false;
  }

  saveBankDetails(): void {
    if (this.bankForm.invalid) {
      this.bankForm.markAllAsTouched();
      return;
    }

    // Replace with: PUT /cooperative/profile/bank-details
    this.bankDetails = this.bankForm.value as CooperativeBankDetails;
    this.isEditingBank = false;
    this.toast.success('Bank details updated', 'New disbursements will use the updated account.');
  }

  getBankFieldError(field: string): string {
    const ctrl = this.bankForm.get(field);
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'This field is required';
      if (ctrl.errors['pattern']) return 'Account number must be 6–20 digits';
    }
    return '';
  }

  /** Mask all but the last four digits when displaying the account number */
  get maskedAccountNumber(): string {
    const n = this.bankDetails.accountNumber;
    return n.length > 4 ? '•'.repeat(n.length - 4) + n.slice(-4) : n;
  }
}
