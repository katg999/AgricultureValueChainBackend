import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { FarmerRegistrationForm, FarmerService } from '../farmer.service';

@Component({
  selector: 'app-farmer-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './farmer-register.component.html',
  styleUrl: './farmer-register.component.css',
})
export class FarmerRegisterComponent {
  @ViewChild('photoInput') private photoInput?: ElementRef<HTMLInputElement>;

  readonly genderOptions = ['Female', 'Male', 'Other', 'Prefer not to say'];
  readonly irrigationOptions = ['Rain-fed', 'Irrigation', 'Both'];
  readonly locationOptions = ['Central Region', 'Eastern Region', 'Northern Region', 'Western Region'];
  readonly landOwnershipOptions = ['Owned', 'Leased', 'Customary', 'Communal', 'Rented'];
  readonly cooperativeGroups = [
    'Kasese Coffee Growers Union',
    'Gulu Maize Cooperative',
    'Masaka Beans Growers',
    'Mukono Rice Farmers'
  ];
  readonly branches = ['Kasese Central', 'Gulu North', 'Masaka East', 'Mukono West'];

  readonly farmImageUrl = 'assets/images/farm-aerial.jpg'; // replace with real asset
  readonly maxPhotoSizeBytes = 2 * 1024 * 1024;

  photoError = '';

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
      coffee: false,
      maize: false,
      cocoa: false,
      vanilla: false,
      cattle: 0,
      goats: 0,
      poultry: 0,
    },
    cooperativeGroup: 'Kasese Coffee Growers Union',
    assignedBranch: 'Kasese Central',
  };

  constructor(private router: Router, private farmerService: FarmerService) {}

  onCancel(): void {
    this.router.navigate(['/farmers/list']);
  }

  triggerFileInput(): void {
    this.photoInput?.nativeElement.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.handlePhotoFile(file);
    }

    input.value = '';
  }

  onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];

    if (file) {
      this.handlePhotoFile(file);
    }
  }

  onSave(): void {
    // Basic required-field guard
    if (!this.form.fullName || !this.form.phoneNumber || !this.form.nationalIdNumber) {
      alert('Please fill in all required fields.');
      return;
    }
    this.farmerService.create(this.form);
    this.router.navigate(['/farmers/list']);
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
}
