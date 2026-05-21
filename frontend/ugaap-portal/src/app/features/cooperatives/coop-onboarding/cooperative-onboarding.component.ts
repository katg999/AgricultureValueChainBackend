import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute  } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Shared components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { StepperComponent, Step } from '../../../shared/components/stepper/stepper.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';


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
    AlertComponent
  ],
  templateUrl: './cooperative-onboarding.component.html',
  styleUrls: ['./cooperative-onboarding.component.css']
})
export class CooperativeOnboardingComponent implements OnInit {

  // ── Stepper ───────────────────────────────────────────────
  steps: Step[] = [
    { label: 'PROFILE', number: '01' },
    { label: 'REVIEW', number: '02' }
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
    private router: Router
  ) {}

  ngOnInit(): void {
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
      country: ['', Validators.required]
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
    // console.log('ACTIVATE BUTTON CLICKED!');
    
    this.isLoading = true;
    this.errorMessage = '';

    // Simulate API delay
    setTimeout(() => {
      this.isLoading = false;
      this.showConfirmModal = false;
      
      // Navigate to Maker & Checker account creation
      // Change this line in your activateCooperative() method:
      this.router.navigate(['/cooperatives/maker-checker-creation'], {
        state: {
          cooperativeName: this.profileForm.value.name,
          registrationNumber: this.profileForm.value.registrationNumber,
          message: `Cooperative "${this.profileForm.value.name}" ready. Now create Maker and Checker accounts.`
        }
      
});
    }, 1000);
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
