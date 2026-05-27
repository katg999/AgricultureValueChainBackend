// ─────────────────────────────────────────────────────────────────────────────
// features/farmers/farmer-register/farmer-register.component.ts
//
// Farmer registration form — collects personal, farm, and cooperative data.
// On save: POST /api/v1/cooperative/farmers via FarmerService.create()
// ─────────────────────────────────────────────────────────────────────────────

import { CommonModule }   from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule }    from '@angular/forms';
import { Router }         from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent }  from '../../../../shared/components/input/input.component';
import { FarmerRegistrationForm, FarmerService } from '../farmer.service';

@Component({
  selector: 'app-farmer-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './farmer-register.component.html',
  styleUrl: './farmer-register.component.css',
})
export class FarmerRegisterComponent {

  // ── Field options ─────────────────────────────────────────────────────────
  readonly genderOptions         = ['Female', 'Male', 'Other', 'Prefer not to say'];
  readonly irrigationOptions     = ['Rain-fed', 'Irrigation', 'Both'];
  readonly locationOptions       = ['Central Region', 'Eastern Region', 'Northern Region', 'Western Region'];
  readonly landOwnershipOptions  = ['Owned', 'Leased', 'Customary', 'Communal', 'Rented'];
  readonly cooperativeGroups     = [
    'Kasese Coffee Growers Union',
    'Gulu Maize Cooperative',
    'Masaka Beans Growers',
    'Mukono Rice Farmers',
  ];
  readonly branches = ['Kasese Central', 'Gulu North', 'Masaka East', 'Mukono West'];

  readonly farmImageUrl       = 'assets/images/farm-aerial.jpg';
  readonly maxPhotoSizeBytes  = 2 * 1024 * 1024; // 2 MB

  // ── Component state ───────────────────────────────────────────────────────
  photoError  = '';
  isSaving    = false;
  saveError: string | null = null;

  // ── Form model ────────────────────────────────────────────────────────────
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
    cooperativeGroup: 'Kasese Coffee Growers Union',
    assignedBranch:   'Kasese Central',
  };

  constructor(
    private router:        Router,
    private farmerService: FarmerService,
  ) {}

  // ── Photo handling ────────────────────────────────────────────────────────

  removeFarmerPhoto(): void {
    this.form.photoPreviewUrl = '';
    this.photoError = '';
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handlePhotoFile(file);
    (event.target as HTMLInputElement).value = ''; // Reset so same file can be re-selected
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

  // ── Form actions ──────────────────────────────────────────────────────────

  onCancel(): void {
    this.router.navigate(['/farmers/list']);
  }

  onSave(): void {
    // Basic required-field guard
    if (!this.form.fullName || !this.form.phoneNumber || !this.form.nationalIdNumber) {
      alert('Please fill in all required fields (Name, Phone, National ID).');
      return;
    }

    this.isSaving  = true;
    this.saveError = null;

    // POST /api/v1/cooperative/farmers — auth + tenant headers added by interceptors
    this.farmerService.create(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        // Navigate back to the list after successful registration
        this.router.navigate(['/farmers/list']);
      },
      error: err => {
        this.isSaving  = false;
        this.saveError = err?.error?.message ?? 'Failed to register farmer. Please try again.';
      },
    });
  }
}
