<<<<<<< Updated upstream
import { CommonModule }   from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
=======
import { CommonModule }            from '@angular/common';
import { Component, OnInit }        from '@angular/core';
import { FormsModule }              from '@angular/forms';
import { ActivatedRoute, Router }   from '@angular/router';
>>>>>>> Stashed changes
import { CommonModule }            from '@angular/common';
import { Component, OnInit }        from '@angular/core';
import { FormsModule }              from '@angular/forms';
import { ActivatedRoute, Router }   from '@angular/router';

import { ButtonComponent }  from '../../../../shared/components/button/button.component';
import { InputComponent }   from '../../../../shared/components/input/input.component';
import {
  FarmerProfile,
  FarmerRegistrationForm,
  FarmerService,
} from '../../../shared-farmer-domain/farmer.service';
import { ButtonComponent }  from '../../../../shared/components/button/button.component';
import { InputComponent }   from '../../../../shared/components/input/input.component';
import {
  FarmerProfile,
  FarmerRegistrationForm,
  FarmerService,
} from '../../../shared-farmer-domain/farmer.service';
import { SessionService } from '../../../../core/services/session.service';
import { ToastService }   from '../../../../core/services/toast.service';

/** Stepper step descriptor */
interface WizardStep {
  label: string;
}

/** Stepper step descriptor */
interface WizardStep {
  label: string;
}

/** Stepper step descriptor */
interface WizardStep {
  label: string;
}

@Component({
  selector: 'app-branch.farmer-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './branch.farmer-register.component.html',
  styleUrl: './branch.farmer-register.component.css',
})
export class BranchFarmerRegisterComponent implements OnInit {

  // ─────────────────────────────────────────
  // WIZARD STEPS
  // ─────────────────────────────────────────
  readonly steps: WizardStep[] = [
    { label: 'Personal details' },
    { label: 'Farm specifications' },
    { label: 'Payment method' },
    { label: 'Production details' },
  ];

  currentStep = 0;

  // ─────────────────────────────────────────
  // FIELD OPTIONS
  // ─────────────────────────────────────────
  // ─────────────────────────────────────────
  // WIZARD STEPS
  // ─────────────────────────────────────────
  readonly steps: WizardStep[] = [
    { label: 'Personal details' },
    { label: 'Farm specifications' },
    { label: 'Payment method' },
    { label: 'Production details' },
  ];

  currentStep = 0;

  // ─────────────────────────────────────────
  // FIELD OPTIONS
  // ─────────────────────────────────────────
  readonly genderOptions        = ['Female', 'Male', 'Other', 'Prefer not to say'];
  readonly irrigationOptions    = ['Rain-fed', 'Irrigation', 'Both'];
  readonly locationOptions      = [
    'Central Region', 'Eastern Region', 'Northern Region', 'Western Region',
  ];
  readonly locationOptions      = [
    'Central Region', 'Eastern Region', 'Northern Region', 'Western Region',
  ];
  readonly landOwnershipOptions = ['Owned', 'Leased', 'Customary', 'Communal', 'Rented'];
  readonly bankOptions          = [
    'Stanbic Bank', 'Centenary Bank', 'DFCU Bank', 'Bank of Africa',
    'Equity Bank', 'Absa Bank', 'Post Bank', 'Finance Trust Bank', 'Other',
  ];
  readonly farmImageUrl      = 'assets/images/farm-aerial.jpg';
  readonly maxPhotoSizeBytes = 2 * 1024 * 1024;
  readonly bankOptions          = [
    'Stanbic Bank', 'Centenary Bank', 'DFCU Bank', 'Bank of Africa',
    'Equity Bank', 'Absa Bank', 'Post Bank', 'Finance Trust Bank', 'Other',
  ];
  readonly farmImageUrl      = 'assets/images/farm-aerial.jpg';
  readonly maxPhotoSizeBytes = 2 * 1024 * 1024;

  // ─────────────────────────────────────────
  // COMPONENT STATE
  // ─────────────────────────────────────────
  // ─────────────────────────────────────────
  // COMPONENT STATE
  // ─────────────────────────────────────────
  isEditMode    = false;
  farmerId: string | null = null;
  loadingFarmer = false;
  photoError    = '';
  isSaving      = false;
  saveError: string | null = null;
  formErrors: Record<string, string> = {};

  // ─────────────────────────────────────────
  // FORM MODEL
  // ─────────────────────────────────────────
  // ─────────────────────────────────────────
  // FORM MODEL
  // ─────────────────────────────────────────
  form: FarmerRegistrationForm = {
    fullName:          '',
    emailAddress:      '',
    phoneNumber:       '',
    dateOfBirth:       '',
    nationalIdNumber:  '',
    gender:            'Female',
    photoPreviewUrl:   '',
    farmLocation:      'Central Region',
    village:           '',
    gpsCoordinates:    '',
    totalLandArea:     null,
    irrigationSource:  'Rain-fed',
    landOwnershipType: 'Owned',
    production: {
      coffee: false, maize: false, cocoa: false, vanilla: false,
      cattle: 0, goats: 0, poultry: 0,
    },
    cooperativeGroup: '',
    assignedBranch:   '',
    paymentMethod: {
      type:                  'mobile_money',
      bankName:              '',
      bankBranch:            '',
      bankAccountHolderName: '',
      bankAccountNumber:     '',
      wendiWalletNumber:     '',
      mobileMoneyProvider:   'mtn',
      mobileMoneyPhone:      '',
    },
  };

  // ─────────────────────────────────────────
  // CONSTRUCTOR
  // ─────────────────────────────────────────
<<<<<<< Updated upstream
  };

  private toast = inject(ToastService);

=======
>>>>>>> Stashed changes
    paymentMethod: {
      type:                  'mobile_money',
      bankName:              '',
      bankBranch:            '',
      bankAccountHolderName: '',
      bankAccountNumber:     '',
      wendiWalletNumber:     '',
      mobileMoneyProvider:   'mtn',
      mobileMoneyPhone:      '',
    },
  };

  // ─────────────────────────────────────────
  // CONSTRUCTOR
  // ─────────────────────────────────────────
  constructor(
    private router:        Router,
    private route:         ActivatedRoute,
    private farmerService: FarmerService,
    private session:       SessionService,
  ) {}

  // ─────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────
  // ─────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────
  ngOnInit(): void {
    const role = this.session.userRole();
    if (role && role !== 'branch') {
      this.router.navigate(['/unauthorized']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode    = true;
      this.farmerId      = id;
      this.loadingFarmer = true;
      this.farmerService.getById(id).subscribe({
        next: profile => {
          this.populateForm(profile);
          this.loadingFarmer = false;
        },
        error: () => {
          this.loadingFarmer = false;
          this.saveError = 'Could not load farmer profile.';
        },
      });
    }
  }

  // ─────────────────────────────────────────
  // STEP NAVIGATION
  // ─────────────────────────────────────────

  /**
   * Advance to the next step if the current step's fields are valid.
   * We only validate the fields that belong to the current step so the
   * user isn't blocked by errors on a later page.
   */
  nextStep(): void {
    if (!this.validateCurrentStep()) return;
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.scrollTop();
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.formErrors = {};
      this.scrollTop();
    }
  }

  /**
   * Allow clicking completed steps (i < currentStep) to go back
   * to review; clicking future steps is disabled until we reach them.
   */
  goToStep(index: number): void {
    if (index < this.currentStep) {
      this.currentStep = index;
      this.formErrors  = {};
      this.scrollTop();
    }
  }

  private scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─────────────────────────────────────────
  // PHOTO HANDLING
  // ─────────────────────────────────────────
  // ─────────────────────────────────────────
  // STEP NAVIGATION
  // ─────────────────────────────────────────

  /**
   * Advance to the next step if the current step's fields are valid.
   * We only validate the fields that belong to the current step so the
   * user isn't blocked by errors on a later page.
   */
  nextStep(): void {
    if (!this.validateCurrentStep()) return;
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.scrollTop();
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.formErrors = {};
      this.scrollTop();
    }
  }

  /**
   * Allow clicking completed steps (i < currentStep) to go back
   * to review; clicking future steps is disabled until we reach them.
   */
  goToStep(index: number): void {
    if (index < this.currentStep) {
      this.currentStep = index;
      this.formErrors  = {};
      this.scrollTop();
    }
  }

  private scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─────────────────────────────────────────
  // PHOTO HANDLING
  // ─────────────────────────────────────────
  removeFarmerPhoto(): void {
    this.form.photoPreviewUrl = '';
    this.photoError = '';
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handlePhotoFile(file);
    (event.target as HTMLInputElement).value = '';
  }

  onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handlePhotoFile(file);
  }

  private handlePhotoFile(file: File): void {
    this.photoError = '';
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.form.photoPreviewUrl = '';
      this.photoError = 'Please upload a JPG or PNG image.';
      return;
    }
    if (file.size > this.maxPhotoSizeBytes) {
      this.form.photoPreviewUrl = '';
      this.photoError = 'Photo must be 2 MB or smaller.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.form.photoPreviewUrl =
        typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  }

  // ─────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────

  /**
   * Validate only the fields that belong to the currently visible step.
   * Returns true if the step is clean.
   */
  private validateCurrentStep(): boolean {
    this.formErrors = {};
    const f = this.form;

    switch (this.currentStep) {

      case 0: // Personal Details
        if (!f.fullName.trim())
          this.formErrors['fullName'] = 'Full name is required.';
        if (!f.nationalIdNumber.trim())
          this.formErrors['nationalIdNumber'] = 'National ID number is required.';
        if (!f.phoneNumber.trim())
          this.formErrors['phoneNumber'] = 'Phone number is required.';
        if (!f.emailAddress.trim())
          this.formErrors['emailAddress'] = 'Email address is required.';
        if (!f.dateOfBirth)
          this.formErrors['dateOfBirth'] = 'Date of birth is required.';
        break;

      case 1: // Farm Specifications
        if (!f.village.trim())
          this.formErrors['village'] = 'Village / Town is required.';
        if (f.totalLandArea === null || f.totalLandArea <= 0)
          this.formErrors['totalLandArea'] = 'Total land area is required.';
        break;

      case 2: // Payment Method
        const pm = f.paymentMethod;
        if (pm.type === 'bank') {
          if (!pm.bankName)
            this.formErrors['bankName'] = 'Please select a bank.';
          if (!pm.bankBranch.trim())
            this.formErrors['bankBranch'] = 'Bank branch is required.';
          if (!pm.bankAccountHolderName.trim())
            this.formErrors['bankAccountHolderName'] = 'Account holder name is required.';
          if (!/^\d{12}$/.test(pm.bankAccountNumber))
            this.formErrors['bankAccountNumber'] = 'Must be exactly 12 digits.';
        }
        if (pm.type === 'wendi_wallet') {
          if (!/^\d{14}$/.test(pm.wendiWalletNumber))
            this.formErrors['wendiWalletNumber'] = 'Must be exactly 14 digits.';
        }
        break;

      // Step 3 (Production Details) has no required fields
    }

    return Object.keys(this.formErrors).length === 0;
  }

  /**
   * Full-form validation used only at final submit.
   * Re-runs all step rules so nothing is missed if the user skipped back.
   */
  private validateForm(): boolean {
    this.formErrors = {};
    const f  = this.form;
    const pm = f.paymentMethod;

    if (!f.fullName.trim())
      this.formErrors['fullName'] = 'Full name is required.';
    if (!f.nationalIdNumber.trim())
      this.formErrors['nationalIdNumber'] = 'National ID number is required.';
    if (!f.phoneNumber.trim())
      this.formErrors['phoneNumber'] = 'Phone number is required.';
    if (!f.emailAddress.trim())
      this.formErrors['emailAddress'] = 'Email address is required.';
    if (!f.dateOfBirth)
      this.formErrors['dateOfBirth'] = 'Date of birth is required.';
    if (!f.village.trim())
      this.formErrors['village'] = 'Village / Town is required.';
    if (f.totalLandArea === null || f.totalLandArea <= 0)
      this.formErrors['totalLandArea'] = 'Total land area is required.';
    if (pm.type === 'bank') {
      if (!pm.bankName)
        this.formErrors['bankName'] = 'Please select a bank.';
      if (!pm.bankBranch.trim())
        this.formErrors['bankBranch'] = 'Bank branch is required.';
      if (!pm.bankAccountHolderName.trim())
        this.formErrors['bankAccountHolderName'] = 'Account holder name is required.';
      if (!/^\d{12}$/.test(pm.bankAccountNumber))
        this.formErrors['bankAccountNumber'] = 'Must be exactly 12 digits.';
    }
    if (pm.type === 'wendi_wallet') {
      if (!/^\d{14}$/.test(pm.wendiWalletNumber))
        this.formErrors['wendiWalletNumber'] = 'Must be exactly 14 digits.';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  // ─────────────────────────────────────────
  // FORM ACTIONS
  // ─────────────────────────────────────────
  onCancel(): void {
    this.router.navigate(['/branch/farmers/list']);
  }

  onSave(): void {
    if (!this.validateForm()) return;

    if (this.form.paymentMethod.type === 'mobile_money') {
      this.form.paymentMethod.mobileMoneyPhone = this.form.phoneNumber;
<<<<<<< Updated upstream
    if (!this.form.fullName || !this.form.phoneNumber || !this.form.nationalIdNumber) {
      this.toast.error('Missing required fields', 'Please fill in Name, Phone, and National ID before submitting.');
      return;
=======
>>>>>>> Stashed changes
    }

    this.isSaving  = true;
    this.saveError = null;

    const payload: FarmerRegistrationForm = {
      ...this.form,
      branchId:       this.session.branchId() ?? undefined,
      cooperativeId:  this.session.cooperativeId() ?? undefined,
      assignedBranch: this.session.branchId() || '',
    };

    if (this.isEditMode && this.farmerId) {
      this.farmerService.update(this.farmerId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/branch/farmers/list']);
        },
        error: err => {
          this.isSaving  = false;
          this.saveError = err?.error?.message ?? 'Failed to update farmer. Please try again.';
        },
      });
      return;
    }

    this.farmerService.create({ ...payload, status: 'Pending' }).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/branch/farmers/list']);
      },
      error: err => {
        this.isSaving  = false;
        this.saveError = err?.error?.message ?? 'Failed to register farmer. Please try again.';
      },
    });
  }

  // ─────────────────────────────────────────
  // EDIT MODE POPULATION
  // ─────────────────────────────────────────
  private populateForm(profile: FarmerProfile): void {
    this.form = {
      fullName:          profile.fullName,
      emailAddress:      profile.emailAddress,
      phoneNumber:       profile.phoneNumber,
      dateOfBirth:       profile.dateOfBirth,
      nationalIdNumber:  profile.nationalIdNumber,
      gender:            profile.gender,
      photoPreviewUrl:   profile.photoUrl,
      farmLocation:      profile.farmLocation,
      village:           profile.village,
      gpsCoordinates:    profile.farm.gpsCoordinates,
      totalLandArea:     profile.farm.totalLandArea,
      irrigationSource:  profile.farm.irrigationSource,
      landOwnershipType: profile.farm.landOwnershipType,
      production: {
        coffee:  profile.farm.primaryCrops.includes('Coffee'),
        maize:   profile.farm.primaryCrops.includes('Maize'),
        cocoa:   profile.farm.primaryCrops.includes('Cocoa'),
        vanilla: profile.farm.primaryCrops.includes('Vanilla'),
        cattle:  profile.farm.livestock.includes('Cattle')  ? 1 : 0,
        goats:   profile.farm.livestock.includes('Goats')   ? 1 : 0,
        poultry: profile.farm.livestock.includes('Poultry') ? 1 : 0,
      },
      cooperativeGroup: profile.groupCredit.cooperativeGroup,
      assignedBranch:   profile.registration.assignedBranch,
      paymentMethod: profile.paymentMethod ?? {
        type:                  'mobile_money',
        bankName:              '',
        bankBranch:            '',
        bankAccountHolderName: '',
        bankAccountNumber:     '',
        wendiWalletNumber:     '',
        mobileMoneyProvider:   'mtn',
        mobileMoneyPhone:      profile.phoneNumber,
      },
    };
  }
}

export { BranchFarmerRegisterComponent as FarmerRegisterComponent };