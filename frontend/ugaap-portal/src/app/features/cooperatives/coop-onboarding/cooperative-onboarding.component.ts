import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

// Shared components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { StepperComponent, Step } from '../../../shared/components/stepper/stepper.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { UserCardComponent, User } from '../../../shared/components/user-card/user-card.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { BadgeComponent } from '../../../shared/components/badge/badge';

/**
 * Cooperative Onboarding Component
 * 
 * Multi-step form for registering new cooperatives.
 * Collects organization details, assigns admins, and activates the cooperative.
 * 
 * Steps:
 * 1. Profile - Organization details (name, registration, location)
 * 2. Admin - Link two primary administrators
 * 3. Inventory - Initial setup (skipped for now)
 * 4. Review - Confirm and activate
 * 
 * Features:
 * - Multi-step stepper
 * - Form validation
 * - User search and selection
 * - Confirmation modal
 * - Progress persistence
 * 
 * Flow:
 * Profile → Admin → Review → Confirm → Success
 */
@Component({
  selector: 'app-cooperative-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    LogoComponent,
    StepperComponent,
    InputComponent,
    ButtonComponent,
    ModalComponent,
    UserCardComponent,
    AlertComponent,
    BadgeComponent
  ],
  templateUrl: './cooperative-onboarding.component.html',
  styleUrls: ['./cooperative-onboarding.component.css']
})
export class CooperativeOnboardingComponent implements OnInit {

  /**
   * Stepper configuration
   */
  steps: Step[] = [
    { label: 'PROFILE', number: '01' },
    { label: 'ADMIN', number: '02' },
    { label: 'REVIEW', number: '03' }
  ];

  /**
   * Current step index
   */
  currentStep = 0;

  /**
   * Profile form (Step 1)
   */
  profileForm!: FormGroup;

  /**
   * Admin selection data (Step 2)
   */
  searchQuery = '';
  availableUsers: User[] = [
    {
      id: '1',
      name: 'Nakato Mariam',
      email: 'mariam.n@mubende-coop.ug',
      phone: '+256 782 445 992',
      verified: true,
      selected: false
    },
    {
      id: '2',
      name: 'Babirye Kissa',
      email: 'kissa.b@mubende-coop.ug',
      phone: '+256 755 112 304',
      role: 'ACCOUNTANT',
      verified: false,
      selected: false
    }
  ];

  selectedAdmins: User[] = [];

  /**
   * Confirmation modal state
   */
  showConfirmModal = false;

  /**
   * Loading states
   */
  isLoading = false;
  isSaving = false;

  /**
   * Organization data (accumulated across steps)
   */
  organizationData = {
    name: '',
    registrationNumber: '',
    poBox: '',
    websiteUrl: '',
    headquarters: '',
    country: ''
  };

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initProfileForm();
  }

  /**
   * Initialize profile form
   */
  initProfileForm(): void {
    this.profileForm = this.fb.group({
      organizationName: ['', [Validators.required]],
      registrationNumber: ['', [Validators.required]],
      poBox: [''],
      websiteUrl: [''],
      headquarters: ['', [Validators.required]],
      country: ['', [Validators.required]]
    });
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    // Validate current step before proceeding
    if (this.currentStep === 0) {
      if (this.profileForm.invalid) {
        this.profileForm.markAllAsTouched();
        return;
      }
      // Save profile data
      this.saveProfileData();
    }

    if (this.currentStep === 1) {
      if (this.selectedAdmins.length === 0) {
        alert('Please select at least one administrator');
        return;
      }
    }

    // Skip inventory step (step 2) for now
    if (this.currentStep === 1) {
      this.currentStep = 3; // Jump to review
      return;
    }

    this.currentStep++;
  }

  /**
   * Navigate to previous step
   */
  previousStep(): void {
    // Skip inventory step when going back
    if (this.currentStep === 3) {
      this.currentStep = 1; // Jump back to admin
      return;
    }

    this.currentStep--;
  }

  /**
   * Save profile form data
   */
  saveProfileData(): void {
    const formValue = this.profileForm.value;
    this.organizationData = {
      name: formValue.organizationName,
      registrationNumber: formValue.registrationNumber,
      poBox: formValue.poBox,
      websiteUrl: formValue.websiteUrl,
      headquarters: formValue.headquarters,
      country: formValue.country
    };
  }

  /**
   * Search users for admin selection
   */
  onSearchUsers(): void {
    // TODO: Implement actual search
    console.log('Search users:', this.searchQuery);
  }

  /**
   * Handle user selection
   */
  onUserSelected(user: User): void {
    if (this.selectedAdmins.length >= 2) {
      alert('Maximum 2 administrators allowed');
      return;
    }

    user.selected = true;
    this.selectedAdmins.push(user);
  }

  /**
   * Handle user removal
   */
  onUserRemoved(user: User): void {
    user.selected = false;
    this.selectedAdmins = this.selectedAdmins.filter(u => u.id !== user.id);
  }

  /**
   * Get filtered users (not selected)
   */
  get filteredUsers(): User[] {
    return this.availableUsers.filter(u => !u.selected);
  }

  /**
   * Open activation confirmation modal
   */
  openConfirmModal(): void {
    this.showConfirmModal = true;
  }

  /**
   * Close confirmation modal
   */
  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  /**
   * Activate cooperative
   */
  activateCooperative(): void {
    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.showConfirmModal = false;
      
      // Navigate to success page
      this.router.navigate(['/cooperatives/activation-success']);
    }, 2000);
  }

  /**
   * Save progress and exit
   */
  saveProgress(): void {
    this.isSaving = true;

    setTimeout(() => {
      this.isSaving = false;
      console.log('Progress saved');
      this.router.navigate(['/cooperatives']);
    }, 1000);
  }

  /**
   * Get form field error
   */
  getFieldError(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
    }
    return '';
  }
}
