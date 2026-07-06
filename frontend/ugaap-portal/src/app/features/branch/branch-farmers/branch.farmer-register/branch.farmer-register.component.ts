import { CommonModule }            from '@angular/common';
import { Component, OnInit }        from '@angular/core';
import { FormsModule }              from '@angular/forms';
import { ActivatedRoute, Router }   from '@angular/router';
import { from }                     from 'rxjs';
import { permissionGuard } from '../../../../core/guards/permission.guard';
import {
  fetchGenderOptions,
  fetchIrrigationTypes,
  fetchRegions,
  fetchLandOwnership,
  fetchBankOptions,
} from '../../../../core/mock/mock-reference-data';


import { FormShellComponent } from '../../../../shared/components/form-wizard/form-wizard.component';
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import {
  FarmerProfile,
  FarmerRegistrationForm,
  FarmerService,
} from '../../../shared-farmer-domain/farmer.service';
import { SessionService } from '../../../../core/services/session.service';
import { FormFeedbackService } from '../../../../core/services/form-feedback.service';

@Component({
  selector: 'app-branch.farmer-register',
  standalone: true,
  imports: [CommonModule, FormsModule, FormShellComponent, FormSectionComponent, ButtonComponent, InputComponent, ModalComponent],
  templateUrl: './branch.farmer-register.component.html',
  styleUrl: './branch.farmer-register.component.css',
})
export class BranchFarmerRegisterComponent implements OnInit {

  // FIELD OPTIONS — populated from mock-reference-data on init
  genderOptions:        string[] = [];
  irrigationOptions:    string[] = [];
  locationOptions:      string[] = [];
  landOwnershipOptions: string[] = [];
  bankOptions:          string[] = [];
  readonly farmImageUrl = 'assets/images/farm-aerial.jpg';
  readonly maxPhotoSizeBytes = 2 * 1024 * 1024;

  // ─────────────────────────────────────────
  // VALIDATION PATTERNS
  // ─────────────────────────────────────────
  // Exactly 10 digits — no country code prefix, no spaces
  private readonly phoneRegex = /^\d{10}$/;
  // Exactly 14 uppercase alphanumeric characters — input is auto-uppercased before validation
  private readonly nationalIdRegex = /^[A-Z0-9]{14}$/;

  private readonly fieldLabels: Record<string, string> = {
    fullName:               'Full Name',
    nationalIdNumber:       'National ID Number',
    phoneNumber:            'Phone Number',
    emailAddress:           'Email Address',
    dateOfBirth:            'Date of Birth',
    village:                'Village / Town',
    totalLandArea:          'Total Land Area',
    bankName:               'Bank',
    bankBranch:             'Bank Branch',
    bankAccountHolderName:  'Account Holder Name',
    bankAccountNumber:      'Account Number',
  };

  // ─────────────────────────────────────────
  // COMPONENT STATE
  // ─────────────────────────────────────────
  isEditMode = false;
  farmerId: string | null = null;
  loadingFarmer = false;
  photoError = '';
  photoFileName = '';
  isSaving = false;
  showConfirmModal = false;
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
    private feedback: FormFeedbackService,
  ) {}

  // ─────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────
  ngOnInit(): void {
    // Load dropdown options from async mock fetch (swap for real HTTP calls when API is ready)
    from(fetchGenderOptions()).subscribe(v    => this.genderOptions        = v);
    from(fetchIrrigationTypes()).subscribe(v  => this.irrigationOptions    = v);
    from(fetchRegions()).subscribe(v          => this.locationOptions       = v);
    from(fetchLandOwnership()).subscribe(v    => this.landOwnershipOptions  = v);
    from(fetchBankOptions()).subscribe(v      => this.bankOptions           = v);
  }

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
  //         this.loadingFarmer = false;
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

  get reviewPaymentSummary(): string {
    const pm = this.form.paymentMethod;
    if (pm.type === 'bank')         return `${pm.bankName} — ${pm.bankAccountNumber}`;
    if (pm.type === 'wendi_wallet') return `Wendi Wallet — ${this.form.phoneNumber}`;
    return `Mobile Money (${pm.mobileMoneyProvider.toUpperCase()}) — ${this.form.phoneNumber}`;
  }

  onSave(): void {
    if (!this.validateForm()) {
      const invalid = Object.keys(this.formErrors).map(k => this.fieldLabels[k] ?? k);
      this.feedback.fieldError(invalid);
      return;
    }

    // Sync payment phone fields before showing the review so the preview is accurate
    if (this.form.paymentMethod.type === 'mobile_money') {
      this.form.paymentMethod.mobileMoneyPhone = this.form.phoneNumber;
    }
    if (this.form.paymentMethod.type === 'wendi_wallet') {
      this.form.paymentMethod.wendiWalletNumber = this.form.phoneNumber;
    }

    this.showConfirmModal = true;
  }

  onConfirmSave(): void {
    this.showConfirmModal = false;
    this.isSaving = true;

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
          this.feedback.success('Farmer updated', `${this.form.fullName}'s profile has been saved.`);
          this.router.navigate(['/branch/farmers/list']);
        },
        error: (err) => {
          this.isSaving = false;
          this.feedback.serverError(err);
        },
      });
      return;
    }

    this.farmerService.create({ ...payload, status: 'Pending' }).subscribe({
      next: () => {
        this.isSaving = false;
        this.feedback.success('Farmer registered', `${this.form.fullName} has been added successfully.`);
        this.router.navigate(['/branch/farmers/list']);
      },
      error: (err) => {
        this.isSaving = false;
        this.feedback.serverError(err);
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
