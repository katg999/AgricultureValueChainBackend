import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

import { FormShellComponent }   from '../../../../shared/components/form-wizard/form-wizard.component';
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { InputComponent }       from '../../../../shared/components/input/input.component';
import { ButtonComponent }      from '../../../../shared/components/button/button.component';
import { ToggleSwitchComponent } from '../../../../shared/components/toggle-switch/toggle-switch.component';
import { AlertComponent }       from '../../../../shared/components/alert/alert.component';
import { ModalComponent }       from '../../../../shared/components/modal/modal.component';
import { FormFeedbackService }  from '../../../../core/services/form-feedback.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    FormShellComponent,
    FormSectionComponent,
    InputComponent,
    ButtonComponent,
    ToggleSwitchComponent,
    AlertComponent,
    ModalComponent,
  ],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {

  userForm!: FormGroup;

  sendWelcomeEmail = true;
  requireOTP = true;

  genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  roleOptions = [
    'Admin',
    'Maker',
    'Checker',
    'Logistics Manager',
    'Accountant',
    'Field Officer'
  ];

  isLoading = false;
  showConfirmModal = false;

  private readonly fieldLabels: Record<string, string> = {
    fullName: 'Full Name',
    email:    'Email Address',
    phone:    'Phone Number',
    role:     'Role',
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private feedback: FormFeedbackService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      fullName:    ['', [Validators.required]],
      email:       ['', [Validators.required, Validators.email]],
      phone:       ['', [Validators.required, Validators.pattern(/^\+256\s?\d{3}\s?\d{3}\s?\d{3}$/)]],
      dateOfBirth: [''],
      nationalId:  ['', Validators.pattern(/^[A-Z0-9]{14}$/)],
      gender:      ['Female'],
      role:        ['Admin', [Validators.required]],
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email'])    return 'Invalid email address';
      if (control.errors['pattern']) {
        if (fieldName === 'phone')      return 'Invalid phone format. Use: +256 700 000000';
        if (fieldName === 'nationalId') return 'Must be exactly 14 alphanumeric characters';
      }
    }
    return '';
  }

  cancel(): void {
    this.router.navigate(['/platform/users']);
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.feedback.formError(this.userForm, this.fieldLabels);
      return;
    }

    const dob = this.userForm.get('dateOfBirth')?.value;
    if (dob && !this.isValidDate(dob)) {
      this.feedback.fieldError(['Date of Birth (invalid format, use YYYY-MM-DD)']);
      return;
    }

    this.showConfirmModal = true;
  }

  onConfirmSave(): void {
    this.showConfirmModal = false;
    this.isLoading = true;
    this.feedback.success('User created', `${this.userForm.value.fullName} has been added successfully.`);
    this.isLoading = false;
    this.router.navigate(['/platform/users']);
  }

  isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  formatDateForDB(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
