import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Shared components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { MakerCheckerService } from '../../../core/services/maker-checker.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ChangeDetectorRef } from '@angular/core';

/**
 * Maker & Checker Account Creation Component
 *
 * Creates both Maker and Checker accounts after cooperative activation.
 * Both accounts have full permissions to manage the cooperative.
 *
 * Features:
 * - Side-by-side Maker & Checker forms
 * - Photo upload (optional)
 * - Auto-assigned full permissions
 *
 * - Creates both accounts together
 *
 * Flow:
 * Cooperative Onboarding → Maker & Checker Creation → Success
 */
@Component({
  selector: 'app-maker-checker-creation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LogoComponent,
    InputComponent,
    ButtonComponent,
    InfoCardComponent,
    AlertComponent,
    ModalComponent,
  ],
  templateUrl: './maker-checker-creation.component.html',
  styleUrls: ['./maker-checker-creation.component.css'],
})
export class MakerCheckerCreationComponent implements OnInit {
  /**
   * Maker form
   */
  makerForm!: FormGroup;

  /**
   * Checker form
   */
  checkerForm!: FormGroup;

  /**
   * Cooperative info from navigation state
   */
  cooperativeId = '';
  cooperativeName = '';
  cooperativeMessage = '';

  //Pick Cooperative values
  cooperativeId = '';
  tenantId = '';

  /**
   * Photo previews
   */
  makerPhotoPreview: string | null = null;
  checkerPhotoPreview: string | null = null;

  /**
   * Photo files
   */
  makerPhotoFile: File | null = null;
  checkerPhotoFile: File | null = null;

  /**
   * Loading state
   */
  isLoading = false;

  /**
   * Gender options
   */
  genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  showCredentialsModal = false;

  makerCredentials: any = null;
  checkerCredentials: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private makerCheckerService: MakerCheckerService,
    private cdr: ChangeDetectorRef,
  ) {
    const navigation = this.router.getCurrentNavigation();

    if (navigation?.extras.state) {
      const cooperative = navigation.extras.state['cooperative'];

      console.log('COOPERATIVE RECEIVED:', cooperative);

      this.cooperativeId = cooperative?.cooperativeId ?? '';

      this.tenantId = cooperative?.tenantId ?? '';

      this.cooperativeName = cooperative?.name ?? '';

      this.cooperativeMessage = navigation.extras.state['message'] ?? '';
    }
    console.log('COOPERATIVE ID:', this.cooperativeId);
    console.log('TENANT ID:', this.tenantId);
  }

  // In ngOnInit, we initialize both forms with validation rules. 
  // The Maker and Checker forms have the same fields, but different default

  ngOnInit(): void {
    this.initForms();
    console.log('Cooperative data for approval:', 
    this.cooperativeId, this.cooperativeName, 
    this.cooperativeMessage);

  return;
  }

  /**
   * Initialize both forms
   */
  initForms(): void {
    // Maker form
    this.makerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+256\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
      dateOfBirth: [''],
      nationalId: [''],
      gender: ['Male'],
    });

    // Checker form
    this.checkerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+256\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
      dateOfBirth: [''],
      nationalId: [''],
      gender: ['Female'],
    });
  }

  /**
   * Password match validator
   */

  /**
   * Handle photo selection for Maker
   */
  onMakerPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB');
        return;
      }

      this.makerPhotoFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.makerPhotoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Handle photo selection for Checker
   */
  onCheckerPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB');
        return;
      }

      this.checkerPhotoFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.checkerPhotoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Remove Maker photo
   */
  removeMakerPhoto(): void {
    this.makerPhotoFile = null;
    this.makerPhotoPreview = null;
  }

  showCredentials(response: any): void {
    this.makerCredentials = response.maker;
    this.checkerCredentials = response.checker;
    this.showCredentialsModal = true;
    this.cdr.detectChanges(); // 👈 force Angular to detect the change
  }
  /**
   * Remove Checker photo
   */
  removeCheckerPhoto(): void {
    this.checkerPhotoFile = null;
    this.checkerPhotoPreview = null;
  }

  /**
   * Get form field error
   */
  getFieldError(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email address';

      if (control.errors['pattern']) {
        if (fieldName === 'phone') return 'Invalid phone format. Use: +256 700 000000';
      }
    }

    return '';
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    const confirmed = confirm('Are you sure? This will cancel the cooperative setup.');
    if (confirmed) {
      this.router.navigate(['/cooperatives']);
    }
  }

  /**
   * Create both accounts
   */
  createAccounts(): void {
    if (this.makerForm.invalid || this.checkerForm.invalid) {
      this.makerForm.markAllAsTouched();
      this.checkerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const payload = {
      makerFullName: this.makerForm.value.fullName,
      makerEmail: this.makerForm.value.email,
      makerPhone: this.makerForm.value.phone,
      checkerFullName: this.checkerForm.value.fullName,
      checkerEmail: this.checkerForm.value.email,
      checkerPhone: this.checkerForm.value.phone,
      tenantId: this.tenantId,
      cooperativeId: this.cooperativeId,
    };

    console.log('SETUP REQUEST:', payload);

    this.makerCheckerService.setup(payload, this.makerPhotoFile, this.checkerPhotoFile).subscribe({
      next: (res) => {
        console.log('SETUP RESPONSE:', res);
        this.isLoading = false;
        this.showCredentials(res);
      },
      error: (err) => {
        console.error('SETUP FAILED:', err);
        this.isLoading = false;
      },
    });
  }

  goToSuccessPage(): void {
    this.showCredentialsModal = false;

    this.router.navigate(['/cooperatives/activation-success'], {
      state: {
        cooperativeName: this.cooperativeName,
        maker: this.makerCredentials,
        checker: this.checkerCredentials,
      },
    });
  }
}
