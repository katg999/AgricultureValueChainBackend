import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute  } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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

  // ── API response ──────────────────────────────────────────
  cooperativeResponse: any = null;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
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
      contactPersonName: ['', Validators.required],
      contactPersonPhone: ['', Validators.required],
      contactPersonEmail: ['', [Validators.required, Validators.email]],
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

  // ── Submit ────────────────────────────────────────────────

  activateCooperative(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    const payload = {
        name: this.profileForm.value.name,
        registrationNumber: this.profileForm.value.registrationNumber,
        address: this.profileForm.value.address,
        contactPersonName: this.profileForm.value.contactPersonName,
        contactPersonPhone: this.profileForm.value.contactPersonPhone,
        contactPersonEmail: this.profileForm.value.contactPersonEmail,
        defaultBranchName: this.profileForm.value.defaultBranchName,
        defaultBranchLocation: this.profileForm.value.defaultBranchLocation,
        poBox: this.profileForm.value.poBox,
        websiteUrl: this.profileForm.value.websiteUrl,
        country: this.profileForm.value.country
    };

    this.http.post('http://localhost:8081/api/v1/cooperatives', payload, { headers })
        .subscribe({
            next: (response: any) => {
                this.isLoading = false;
                this.showConfirmModal = false;

                // Navigate to role creation, passing tenantId so it's pre-filled
                this.router.navigate(['/users/role-form'], {
                    state: {
                        tenantId: response.tenantId,
                        cooperativeId: response.cooperativeId,
                        defaultBranchId: response.defaultBranchId,
                        defaultBranchCode: response.defaultBranchCode,
                        message: `Cooperative "${payload.name}" activated successfully. 
                                  Tenant ID: ${response.tenantId}. 
                                  Now create the Maker and Checker roles.`
                    }
                });
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message
                    || 'Failed to activate cooperative. Please try again.';
            }
        });
}

  // ── Save progress ─────────────────────────────────────────

  saveProgress(): void {
    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
      this.router.navigate(['/users/role-form']);
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