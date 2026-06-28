import { CommonModule }            from '@angular/common';
import { Component }                from '@angular/core';
import { FormsModule }              from '@angular/forms';
import { ActivatedRoute, Router }   from '@angular/router';
import { permissionGuard } from '../../../../core/guards/permission.guard';


import { FormShellComponent } from '../../../../shared/components/form-wizard/form-wizard.component';
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import {
  FarmerProfile,
  FarmerRegistrationForm,
  FarmerService,
} from '../../../shared-farmer-domain/farmer.service';
import { SessionService } from '../../../../core/services/session.service';

@Component({
  selector: 'app-branch.farmer-register',
  standalone: true,
  imports: [CommonModule, FormsModule, FormShellComponent, FormSectionComponent, ButtonComponent, InputComponent],
  templateUrl: './branch.farmer-register.component.html',
  styleUrl: './branch.farmer-register.component.css',
})
export class BranchFarmerRegisterComponent {

  // FIELD OPTIONS
  readonly genderOptions = ['Female', 'Male', 'Other', 'Prefer not to say'];
  readonly irrigationOptions = ['Rain-fed', 'Irrigation', 'Both'];
  readonly locationOptions = [
    'Central Region',
    'Eastern Region',
    'Northern Region',
    'Western Region',
  ];
  readonly landOwnershipOptions = ['Owned', 'Leased', 'Communal', 'Family Land'];
  readonly bankOptions = [
    'Stanbic Bank',
    'Centenary Bank',
    'DFCU Bank',
    'Bank of Africa',
    'Equity Bank',
    'Absa Bank',
    'Post Bank',
    'Finance Trust Bank',
    'Other',
  ];
  readonly farmImageUrl = 'assets/images/farm-aerial.jpg';
  readonly maxPhotoSizeBytes = 2 * 1024 * 1024;

  // ─────────────────────────────────────────
  // VALIDATION PATTERNS
  // ─────────────────────────────────────────
  // Exactly 10 digits — no country code prefix, no spaces
  private readonly phoneRegex = /^\d{10}$/;
  // Exactly 14 uppercase alphanumeric characters — input is auto-uppercased before validation
  private readonly nationalIdRegex = /^[A-Z0-9]{14}$/;

  // ─────────────────────────────────────────
  // COMPONENT STATE
  // ─────────────────────────────────────────
  isEditMode = false;
  farmerId: string | null = null;
  loadingFarmer = false;
  photoError = '';
  photoFileName = '';
  isSaving = false;
  saveError: string | null = null;
  formErrors: Record<string, string> = {};

  // ─────────────────────────────────────────
  // FORM MODEL
  // ─────────────────────────────────────────
  form: FarmerRegistrationForm = {
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    dateOfBirth: '',
    nationalIdNumber: '',
    gender: 'Female',
    photoPreviewUrl: '',
    farmLocation: 'Central Region',
    village: '',
    gpsCoordinates: '',
    totalLandArea: null,
    irrigationSource: 'Rain-fed',
    landOwnershipType: 'Owned',
    production: {
      commodity: '',
      livestock: '',
    },
    cooperativeGroup: '',
    assignedBranch: '',
    paymentMethod: {
      type: 'mobile_money',
      bankName: '',
      bankBranch: '',
      bankAccountHolderName: '',
      bankAccountNumber: '',
      wendiWalletNumber: '',
      mobileMoneyProvider: 'mtn',
      mobileMoneyPhone: '',
    },
  };

  // ─────────────────────────────────────────
  // CONSTRUCTOR
  // ─────────────────────────────────────────
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private farmerService: FarmerService,
    private session: SessionService,
  ) {}

  // ─────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────
  // this method is to be uncommented when the permission guard is implemented and we want to enforce that only branch staff can access this page.
  // ngOnInit(): void {
  //   // const role = this.session.userRole();
  //   // if (role && role !== 'branch') {
  //   //   this.router.navigate(['/unauthorized']);
  //   //   return;
  //   // }

  //   const id = this.route.snapshot.paramMap.get('id');
  //   if (id) {
  //     this.isEditMode    = true;
  //     this.farmerId      = id;
  //     this.loadingFarmer = true;
  //     this.farmerService.getById(id).subscribe({
  //       next: profile => {
  //         this.populateForm(profile);
  //         this.loadingFarmer = false;
  //       },
  //       error: () => {
  //         this.loadingFarmer = false;
  //         this.saveError = 'Could not load farmer profile.';
  //       },
  //     });
  //   }
  // }

  // ─────────────────────────────────────────
  // PHOTO HANDLING
  // ─────────────────────────────────────────
  removeFarmerPhoto(): void {
    this.form.photoPreviewUrl = '';
    this.photoFileName = '';
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
      this.photoFileName = '';
      this.photoError = 'Please upload a JPG or PNG image.';
      return;
    }
    if (file.size > this.maxPhotoSizeBytes) {
      this.form.photoPreviewUrl = '';
      this.photoFileName = '';
      this.photoError = 'Photo must be 2 MB or smaller.';
      return;
    }
    this.photoFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.form.photoPreviewUrl = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  }

  // ─────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────

  private validateForm(): boolean {
    this.formErrors = {};
    const f = this.form;
    const pm = f.paymentMethod;

    if (!f.fullName.trim()) this.formErrors['fullName'] = 'Full name is required.';

    if (!f.nationalIdNumber.trim()) {
      this.formErrors['nationalIdNumber'] = 'National ID number is required.';
    } else if (!this.nationalIdRegex.test(f.nationalIdNumber.trim())) {
      this.formErrors['nationalIdNumber'] = 'Must be exactly 14 alphanumeric characters.';
    }

    if (!f.phoneNumber.trim()) {
      this.formErrors['phoneNumber'] = 'Phone number is required.';
    } else if (!this.phoneRegex.test(f.phoneNumber.trim())) {
      this.formErrors['phoneNumber'] = 'Phone number must be exactly 10 digits (e.g. 0700000000).';
    }

    if (!f.emailAddress.trim()) this.formErrors['emailAddress'] = 'Email address is required.';

    if (!f.dateOfBirth) {
      this.formErrors['dateOfBirth'] = 'Date of birth is required.';
    } else {
      const dobYear = new Date(f.dateOfBirth).getFullYear();
      if (dobYear >= new Date().getFullYear()) {
        this.formErrors['dateOfBirth'] = 'Date of birth cannot be in the current year or future.';
      }
    }

    if (!f.village.trim()) this.formErrors['village'] = 'Village / Town is required.';
    if (f.totalLandArea === null || f.totalLandArea <= 0)
      this.formErrors['totalLandArea'] = 'Total land area is required.';
    if (pm.type === 'bank') {
      if (!pm.bankName) this.formErrors['bankName'] = 'Please select a bank.';
      if (!pm.bankBranch.trim()) this.formErrors['bankBranch'] = 'Bank branch is required.';
      if (!pm.bankAccountHolderName.trim())
        this.formErrors['bankAccountHolderName'] = 'Account holder name is required.';
      if (!/^\d{12}$/.test(pm.bankAccountNumber))
        this.formErrors['bankAccountNumber'] = 'Must be exactly 12 digits.';
    }
    // wendi_wallet: no validation needed — number is auto-filled from phone on save

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

    // Both mobile money and Wendi wallet are tied to the farmer's phone number.
    // We write the value here (not reactively in the template) so the model
    // is always in sync with whatever phone number was entered at submit time.
    if (this.form.paymentMethod.type === 'mobile_money') {
      this.form.paymentMethod.mobileMoneyPhone = this.form.phoneNumber;
    }
    if (this.form.paymentMethod.type === 'wendi_wallet') {
      this.form.paymentMethod.wendiWalletNumber = this.form.phoneNumber;
    }

    this.isSaving = true;
    this.saveError = null;

    const payload: FarmerRegistrationForm = {
      ...this.form,
      branchId: this.session.branchId() ?? undefined,
      cooperativeId: this.session.cooperativeId() ?? undefined,
      assignedBranch: this.session.branchId() || '',
      cooperativeGroup: this.session.tenantId() || '',
    };

    if (this.isEditMode && this.farmerId) {
      this.farmerService.update(this.farmerId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/branch/farmers/list']);
        },
        error: (err) => {
          this.isSaving = false;
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
      error: (err) => {
        this.isSaving = false;
        this.saveError = err?.error?.message ?? 'Failed to register farmer. Please try again.';
      },
    });
  }

  // ─────────────────────────────────────────
  // EDIT MODE POPULATION
  // ─────────────────────────────────────────
  private populateForm(profile: FarmerProfile): void {
    this.form = {
      fullName: profile.fullName,
      emailAddress: profile.emailAddress,
      phoneNumber: profile.phoneNumber,
      dateOfBirth: profile.dateOfBirth,
      nationalIdNumber: profile.nationalIdNumber,
      gender: profile.gender,
      photoPreviewUrl: profile.photoUrl,
      farmLocation: profile.farmLocation,
      village: profile.village,
      gpsCoordinates: profile.farm.gpsCoordinates,
      totalLandArea: profile.farm.totalLandArea,
      irrigationSource: profile.farm.irrigationSource,
      landOwnershipType: profile.farm.landOwnershipType,
      production: {
        commodity: profile.farm.primaryCrops[0] ?? '',
        livestock: profile.farm.livestock.join(', '),
      },
      cooperativeGroup: profile.groupCredit.cooperativeGroup,
      assignedBranch: profile.registration.assignedBranch,
      paymentMethod: profile.paymentMethod ?? {
        type: 'mobile_money',
        bankName: '',
        bankBranch: '',
        bankAccountHolderName: '',
        bankAccountNumber: '',
        wendiWalletNumber: '',
        mobileMoneyProvider: 'mtn',
        mobileMoneyPhone: profile.phoneNumber,
      },
    };
  }
}

export { BranchFarmerRegisterComponent as FarmerRegisterComponent };
