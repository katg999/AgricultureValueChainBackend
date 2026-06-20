// features/cooperative/profile/cooperative-profile.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { InfoCardComponent }     from '../../../shared/components/info-card/info-card.component';
import { InputComponent }        from '../../../shared/components/input/input.component';
import { ButtonComponent }       from '../../../shared/components/button/button.component';
import { ToggleSwitchComponent } from '../../../shared/components/toggle-switch/toggle-switch.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { ToastService }          from '../../../core/services/toast.service';
import { CooperativeBankDetails } from '../../../core/services/cooperative.service';
import { CooperativePricingService } from '../../../core/services/cooperative-pricing.service';

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

export interface OperationalModules {
  // Structure
  hasBranches: boolean;
  hasCollectionHubs: boolean;
  hasFieldAgents: boolean;
  // Operations
  doesGrading: boolean;
  distributesInputs: boolean;
  paysThroughPlatform: boolean;
  // Credit
  extendsCreditToFarmers: boolean;
  allowMultipleOpenCredits: boolean;
  // Seasons & membership
  operatesInSeasons: boolean;
  requiresFarmerApproval: boolean;
  chargesMembershipFee: boolean;
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
    ToggleSwitchComponent,
    HasPermissionDirective,
  ],
  templateUrl: './cooperative-profile.component.html',
  styleUrls: ['./cooperative-profile.component.css'],
})
export class CooperativeProfileComponent implements OnInit {

  private fb         = inject(FormBuilder);
  private toast      = inject(ToastService);
  private pricingSvc = inject(CooperativePricingService);

  // ── Mock data — replace with GET /cooperative/profile ──────────────────────

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

  // ── Operational modules ────────────────────────────────────────────────────

  modulesForm = this.fb.group({
    // Structure
    hasBranches:           [true],
    hasCollectionHubs:     [true],
    hasFieldAgents:        [false],
    // Operations — doesGrading is seeded from CooperativePricingService in ngOnInit
    doesGrading:           [false],
    distributesInputs:     [false],
    paysThroughPlatform:   [true],
    // Credit
    extendsCreditToFarmers:   [false],
    allowMultipleOpenCredits: [false],
    // Seasons & membership
    operatesInSeasons:      [true],
    requiresFarmerApproval: [true],
    chargesMembershipFee:   [false],
  });

  isSavingModules = false;

  ngOnInit(): void {
    // Sync doesGrading from the pricing service so profile reflects the live state.
    this.modulesForm.patchValue({ doesGrading: this.pricingSvc.useGrades });
  }

  get creditEnabled(): boolean {
    return !!this.modulesForm.get('extendsCreditToFarmers')?.value;
  }

  saveModules(): void {
    this.isSavingModules = true;
    // Push doesGrading into CooperativePricingService so edit-prices stays in sync.
    this.pricingSvc.setUseGrades(!!this.modulesForm.get('doesGrading')?.value);
    // Replace with: PUT /cooperative/profile/modules
    setTimeout(() => {
      this.isSavingModules = false;
      this.toast.success('Modules updated', 'Changes will take effect on next login.');
    }, 800);
  }

  // ── Bank details ───────────────────────────────────────────────────────────

  isEditingBank = false;
  isSaving      = false;

  bankForm = this.fb.group({
    bankName:            ['', Validators.required],
    bankBranch:          [''],
    accountName:         ['', Validators.required],
    accountNumber:       ['', [Validators.required, Validators.pattern(/^\d{6,20}$/)]],
    mobileMoneyProvider: [''],
    mobileMoneyNumber:   [''],
  });

  startEditingBank(): void {
    this.bankForm.patchValue(this.bankDetails);
    this.isEditingBank = true;
  }

  cancelEditingBank(): void { this.isEditingBank = false; }

  saveBankDetails(): void {
    if (this.bankForm.invalid) { this.bankForm.markAllAsTouched(); return; }
    // Replace with: PUT /cooperative/profile/bank-details
    this.bankDetails  = this.bankForm.value as CooperativeBankDetails;
    this.isEditingBank = false;
    this.toast.success('Bank details updated', 'New disbursements will use the updated account.');
  }

  getBankFieldError(field: string): string {
    const ctrl = this.bankForm.get(field);
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'This field is required';
      if (ctrl.errors['pattern'])  return 'Account number must be 6–20 digits';
    }
    return '';
  }

  get maskedAccountNumber(): string {
    const n = this.bankDetails.accountNumber;
    return n.length > 4 ? '•'.repeat(n.length - 4) + n.slice(-4) : n;
  }
}
