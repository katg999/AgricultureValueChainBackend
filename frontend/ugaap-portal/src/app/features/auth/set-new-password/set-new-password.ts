import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-set-new-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './set-new-password.html',
  styleUrl: './set-new-password.scss'
})
export class SetNewPasswordComponent implements OnInit {

  passwordForm!: FormGroup;
  isLoading = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8)
      ]],
      confirmPassword: ['', Validators.required]
    });
  }

  get password(): string {
    return this.passwordForm.get('newPassword')?.value || '';
  }

  get criteria() {
    return {
      length: this.password.length >= 8,
      number: /\d/.test(this.password),
      uppercase: /[A-Z]/.test(this.password),
      special: /[^A-Za-z0-9]/.test(this.password)
    };
  }

  get allCriteriaMet(): boolean {
    return Object.values(this.criteria).every(v => v);
  }

  onSubmit(): void {
    if (this.passwordForm.invalid || !this.allCriteriaMet) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/auth/login']);
    }, 1200);
  }
}