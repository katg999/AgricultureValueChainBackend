import { CommonModule }   from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent }  from '../../../../shared/components/input/input.component';
import { FarmerProfile, FarmerRegistrationForm, FarmerService } from '../../../shared-farmer-domain/farmer.service';
import { SessionService } from '../../../../core/services/session.service';

@Component({
  selector: 'app-branch.farmer-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './branch.farmer-register.component.html',
  styleUrl: './branch.farmer-register.component.css',
})
export class BranchFarmerRegisterComponent implements OnInit {

  // Field options
  readonly genderOptions        = ['Female', 'Male', 'Other', 'Prefer not to say'];
  readonly irrigationOptions    = ['Rain-fed', 'Irrigation', 'Both'];
  readonly locationOptions      = ['Central Region', 'Eastern Region', 'Northern Region', 'Western Region'];
  readonly landOwnershipOptions = ['Owned', 'Leased', 'Customary', 'Communal', 'Rented'];
  readonly farmImageUrl         = 'assets/images/farm-aerial.jpg';
  readonly maxPhotoSizeBytes    = 2 * 1024 * 1024;

  // Component state
  isEditMode    = false;
  farmerId: string | null = null;
  loadingFarmer = false;
  photoError    = '';
  isSaving      = false;
  saveError: string | null = null;

  // Form model
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
  };

  constructor(
    private router:        Router,
    private route:         ActivatedRoute,
    private farmerService: FarmerService,
    private session:       SessionService,
  ) {}

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

  // Photo handling

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
      this.form.photoPreviewUrl = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.readAsDataURL(file);
  }

  // Form actions

  onCancel(): void {
    this.router.navigate(['/branch/farmers/list']);
  }

  onSave(): void {
    if (!this.form.fullName || !this.form.phoneNumber || !this.form.nationalIdNumber) {
      alert('Please fill in all required fields (Name, Phone, National ID).');
      return;
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
    };
  }
}

export { BranchFarmerRegisterComponent as FarmerRegisterComponent };
