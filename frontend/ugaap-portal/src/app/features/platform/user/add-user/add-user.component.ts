import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

// Shared components
import { LogoComponent } from '../../../../shared/components/logo/logo.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { ToggleSwitchComponent } from '../../../../shared/components/toggle-switch/toggle-switch.component';
import { PasswordStrengthComponent } from '../../../../shared/components/password-strength/password-strength.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

/**
 * Add New User Component
 * 
 * Form for creating new platform or cooperative admin users.
 * Collects personal details and account access settings.
 * 
 * Sections:
 * 1. Personal Details - Name, email, phone, DOB, National ID, gender
 * 2. Account Access - Role, temporary password, welcome email, OTP
 * 
 * Features:
 * - Multi-section form with validation
 * - Password strength indicator
 * - Toggle switches for options
 * - Date input with format validation (YYYY-MM-DD)
 * - Gender dropdown
 * - Role dropdown
 * - Reusable input component with built-in password toggle
 * - Form submission
 * 
 * Flow:
 * Add User → Save → Users List
 */
@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    LogoComponent,
    InputComponent,
    ButtonComponent,
    InfoCardComponent,
    ToggleSwitchComponent,
    PasswordStrengthComponent,
    AlertComponent
  ],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {

  /**
   * User form
   */
  userForm!: FormGroup;

  /**
   * Toggle options
   */
  sendWelcomeEmail = true;
  requireOTP = true;

  /**
   * Gender options
   */
  genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  /**
   * Role options
   */
  roleOptions = [
    'Admin',
    'Logistics Manager',
    'Accountant',
    'Field Officer'
  ];

  /**
   * Loading state
   */
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialize form
   */
  initForm(): void {
    this.userForm = this.fb.group({
      // Personal Details
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+256\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
      dateOfBirth: [''], // Optional, but if provided must be valid date
      nationalId: [''],
      gender: ['Female'],

      // Account Access
      role: ['Admin', [Validators.required]],
      tempPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Password match validator
   */
  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('tempPassword')?.value;
    const confirm = form.get('confirmPassword')?.value;
    
    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Get form field error
   */
  getFieldError(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email address';
      if (control.errors['minLength']) return 'Password must be at least 8 characters';
      if (control.errors['pattern']) {
        if (fieldName === 'phone') return 'Invalid phone format. Use: +256 700 000000';
      }
    }
    
    // Check password mismatch
    if (fieldName === 'confirmPassword' && this.userForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    
    return '';
  }

  /**
   * Get current password for strength meter
   */
  get currentPassword(): string {
    return this.userForm.get('tempPassword')?.value || '';
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    this.router.navigate(['/platform/users']);
  }

  /**
   * Save user
   */
  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    // Validate date format if provided
    const dob = this.userForm.get('dateOfBirth')?.value;
    if (dob && !this.isValidDate(dob)) {
      alert('Invalid date format. Please use YYYY-MM-DD');
      return;
    }

    this.isLoading = true;

    const userData = {
      ...this.userForm.value,
      sendWelcomeEmail: this.sendWelcomeEmail,
      requireOTP: this.requireOTP,
      // Format date consistently for DB
      dateOfBirth: dob ? this.formatDateForDB(dob) : null
    };

    console.log('Saving user:', userData);

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/platform/users']);
    }, 2000);
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Format date for database (YYYY-MM-DD)
   */
  formatDateForDB(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
