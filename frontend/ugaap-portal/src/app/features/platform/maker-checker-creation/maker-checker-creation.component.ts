import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Shared components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

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
 * - Password validation
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
    PasswordStrengthComponent,
    AlertComponent
  ],
  templateUrl: './maker-checker-creation.component.html',
  styleUrls: ['./maker-checker-creation.component.css']
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
  cooperativeName = '';
  cooperativeMessage = '';

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

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    // Get cooperative info from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.cooperativeName = navigation.extras.state['cooperativeName'] || 'the cooperative';
      this.cooperativeMessage = navigation.extras.state['message'] || '';
    }
  }

  ngOnInit(): void {
    this.initForms();
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
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Checker form
    this.checkerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+256\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
      dateOfBirth: [''],
      nationalId: [''],
      gender: ['Female'],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Password match validator
   */
  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    
    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

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
      if (control.errors['minLength']) return 'Password must be at least 8 characters';
      if (control.errors['pattern']) {
        if (fieldName === 'phone') return 'Invalid phone format. Use: +256 700 000000';
      }
    }
    
    // Check password mismatch
    if (fieldName === 'confirmPassword' && form.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    
    return '';
  }

  /**
   * Get current password for strength meter
   */
  getMakerPassword(): string {
    return this.makerForm.get('password')?.value || '';
  }

  getCheckerPassword(): string {
    return this.checkerForm.get('password')?.value || '';
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
    // Validate both forms
    if (this.makerForm.invalid || this.checkerForm.invalid) {
      this.makerForm.markAllAsTouched();
      this.checkerForm.markAllAsTouched();
      alert('Please fill in all required fields for both Maker and Checker');
      return;
    }

    this.isLoading = true;

    const makerData = {
      ...this.makerForm.value,
      role: 'Maker',
      photo: this.makerPhotoFile,
      hasFullPermissions: true
    };

    const checkerData = {
      ...this.checkerForm.value,
      role: 'Checker',
      photo: this.checkerPhotoFile,
      hasFullPermissions: true
    };

    console.log('Creating Maker account:', makerData);
    console.log('Creating Checker account:', checkerData);

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      
      // Navigate to success page or cooperative dashboard
      this.router.navigate(['/cooperatives/activation-success'], {
        state: {
          cooperativeName: this.cooperativeName,
          makerName: makerData.fullName,
          checkerName: checkerData.fullName
        }
      });
    }, 2000);
  }
}
