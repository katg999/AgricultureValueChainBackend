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
import { CooperativeBankAccount } from '../../../core/services/cooperative.service';
import { CooperativePricingService } from '../../../core/services/cooperative-pricing.service';

interface CooperativeProfile {
  name: string;
  registrationNumber: string;
  address: string;
  country: string;
  poBox: string;
  websiteUrl: string;
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
    memberSince: '2024-03-18',
    status: 'active',
  };

  // ── Bank accounts — replace with GET /cooperative/profile/bank-accounts ───
  bankAccounts: CooperativeBankAccount[] = [
    {
      id: '1',
      bankName: 'Stanbic Bank Uganda',
      bankBranch: 'Mbale Branch',
      accountName: 'Bugishu Cooperative Union Ltd',
      accountNumber: '9030012345678',
      isPrimary: true,
    },
  ];

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

  // ── Bank accounts ──────────────────────────────────────────────────────────

  showAccountForm   = false;
  editingAccountId: string | null = null;  // null = adding new
  isSavingAccount   = false;

  accountForm = this.fb.group({
    bankName:      ['', Validators.required],
    bankBranch:    [''],
    accountName:   ['', Validators.required],
    accountNumber: ['', [Validators.required, Validators.pattern(/^\d{6,20}$/)]],
  });

  maskNumber(n: string): string {
    return n.length > 4 ? '•'.repeat(n.length - 4) + n.slice(-4) : n;
  }

  openAddAccountForm(): void {
    this.editingAccountId = null;
    this.accountForm.reset();
    this.showAccountForm = true;
  }

  openEditAccountForm(account: CooperativeBankAccount): void {
    this.editingAccountId = account.id;
    this.accountForm.patchValue(account);
    this.showAccountForm = true;
  }

  cancelAccountForm(): void {
    this.showAccountForm   = false;
    this.editingAccountId  = null;
    this.accountForm.reset();
  }

  saveAccount(): void {
    if (this.accountForm.invalid) { this.accountForm.markAllAsTouched(); return; }
    const val = this.accountForm.value;

    if (this.editingAccountId) {
      // Replace with: PUT /cooperative/profile/bank-accounts/:id
      this.bankAccounts = this.bankAccounts.map(a =>
        a.id === this.editingAccountId ? { ...a, ...val } : a,
      ) as CooperativeBankAccount[];
      this.toast.success('Account updated', 'Bank account details have been saved.');
    } else {
      // Replace with: POST /cooperative/profile/bank-accounts
      const isFirst = this.bankAccounts.length === 0;
      const added: CooperativeBankAccount = {
        id:            Date.now().toString(),
        bankName:      val.bankName!,
        bankBranch:    val.bankBranch || undefined,
        accountName:   val.accountName!,
        accountNumber: val.accountNumber!,
        isPrimary:     isFirst,  // first account auto-becomes primary
      };
      this.bankAccounts = [...this.bankAccounts, added];
      this.toast.success('Account added', isFirst ? 'Set as primary account.' : 'Bank account saved.');
    }

    this.cancelAccountForm();
  }

  setPrimary(id: string): void {
    // Replace with: PATCH /cooperative/profile/bank-accounts/:id/primary
    this.bankAccounts = this.bankAccounts.map(a => ({ ...a, isPrimary: a.id === id }));
    this.toast.success('Primary account updated', 'Farmer disbursements will use this account.');
  }

  deleteAccount(account: CooperativeBankAccount): void {
    if (account.isPrimary) {
      this.toast.error('Cannot delete primary account', 'Set another account as primary first.');
      return;
    }
    if (confirm(`Delete the "${account.bankName}" account ending in ${account.accountNumber.slice(-4)}?`)) {
      // Replace with: DELETE /cooperative/profile/bank-accounts/:id
      this.bankAccounts = this.bankAccounts.filter(a => a.id !== account.id);
      this.toast.success('Account removed', 'Bank account has been deleted.');
    }
  }

  getAccountFieldError(field: string): string {
    const ctrl = this.accountForm.get(field);
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'This field is required';
      if (ctrl.errors['pattern'])  return 'Account number must be 6–20 digits';
    }
    return '';
  }
}
