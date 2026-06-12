import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

// Shared components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { StepperComponent, Step } from '../../../shared/components/stepper/stepper.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { CooperativeService } from '../../../core/services/cooperative.service';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';

@Component({
  selector: 'app-cooperative-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LogoComponent,
    StepperComponent,
    InputComponent,
    ButtonComponent,
    ModalComponent,
    AlertComponent,
  ],
  templateUrl: './cooperative-onboarding.component.html',
  styleUrls: ['./cooperative-onboarding.component.css'],
})
export class CooperativeOnboardingComponent implements OnInit {
  // ── Stepper ───────────────────────────────────────────────
  steps: Step[] = [
    { label: 'PROFILE', number: '01' },
    { label: 'REVIEW', number: '02' },
  ];

  currentStep = 0;

  // ── Forms ─────────────────────────────────────────────────
  profileForm!: FormGroup;

  // ── Modal ─────────────────────────────────────────────────
  showConfirmModal = false;

  // ── Loading states ────────────────────────────────────────
  isLoading = false;
  isSaving = false;

  // ── Error message ─────────────────────────────────────────
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cooperativeService: CooperativeService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Cooperative Onboarding | UGAAP');
    this.initProfileForm();
  }

  // ── Init form ─────────────────────────────────────────────

  initProfileForm(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      registrationNumber: ['', Validators.required],
      address: ['', Validators.required],
      defaultBranchName: ['', Validators.required],
      defaultBranchLocation: [''],
      poBox: [''],
      websiteUrl: [''],
      country: ['', Validators.required],
      contactPersonName: ['', Validators.required],
      contactPersonPhone: ['', Validators.required],
      contactPersonEmail: ['', [Validators.required, Validators.email]],
    });
  }

  // ── Navigation ────────────────────────────────────────────

  nextStep(): void {
    if (this.currentStep === 0) {
      if (this.profileForm.invalid) {
        this.profileForm.markAllAsTouched();
        return;
      }
    }
    this.currentStep++;
  }

  previousStep(): void {
    this.currentStep--;
  }

  // ── Modal ─────────────────────────────────────────────────

  openConfirmModal(): void {
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  // ── Submit (Navigate to Maker & Checker Creation) ────────

  activateCooperative(): void {
   //console.log('ACTIVATE BUTTON CLICKED!');
   
    if(this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.showConfirmModal = false;

    const payload = {
      name: this.profileForm.value.name,
      registrationNumber: this.profileForm.value.registrationNumber,
      address: this.profileForm.value.address,
      contactPersonName: this.profileForm.value.contactPersonName,
      contactPersonPhone: this.profileForm.value.contactPersonPhone,
      contactPersonEmail: this.profileForm.value.contactPersonEmail,
      poBox: this.profileForm.value.poBox,
      websiteUrl: this.profileForm.value.websiteUrl,
      country: this.profileForm.value.country,
      defaultBranchName: this.profileForm.value.defaultBranchName,
      defaultBranchLocation: this.profileForm.value.defaultBranchLocation,
    };

    this.cooperativeService.createCooperative(payload).subscribe({
      next: (res) => {
        console.log('ONBOARD RESPONSE:', res);
        this.isLoading = false;

        this.router.navigate(['/platform/maker-checker'], {
          state: {
            cooperative: res,
            message: `Cooperative "${payload.name}" created successfully`,
          },
        });
      },

      error: (err) => {
        this.isLoading = false;

        console.error('Create cooperative failed:', err);

        this.errorMessage =
          err?.error?.message ?? 'You do not have permission to create a cooperative.';
      },
    });
  }

  // ── Save progress ─────────────────────────────────────────

  saveProgress(): void {
    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
      alert('Progress saved! (This is just a demo - no actual save)');
    }, 1000);
  }

  // ── Helpers ───────────────────────────────────────────────

  getFieldError(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email format';
    }
    return '';
  }

  get formValue() {
    return this.profileForm.value;
  }
}
