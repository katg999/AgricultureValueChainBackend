import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Shared reusable components
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    InputComponent,
    LogoComponent,
    AlertComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  /**
   * Reactive login form
   */
  loginForm!: FormGroup;

  /**
   * Loading state
   */
  isLoading = false;

  /**
   * Error message
   */
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {

    this.loginForm = this.fb.group({
      email: [
        '',
        [Validators.required, Validators.email]
      ],

      password: [
        '',
        [Validators.required, Validators.minLength(6)]
      ]
    });
  }

  /**
   * Handle login form submission
   */
  onSubmit(): void {

    // Trigger validations
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
  usernameOrEmail: this.loginForm.value.email,
  password: this.loginForm.value.password
 };

    this.http.post(
      'http://localhost:8081/auth/login',
      payload
    ).subscribe({

      next: (response: any) => {

  this.isLoading = false;

  console.log('Login Success:', response);

  //  Extract token correctly
  const token = response?.data?.accessToken;

  if (token) {
    localStorage.setItem('token', token);
  }

  // OPTIONAL: store user info too
  if (response?.data) {
    localStorage.setItem(
      'user',
      JSON.stringify(response.data)
    );
  }

  // Navigate after successful login
        //this.router.navigate(['/users/role-form']);
        this.router.navigate(['/cooperatives/onboarding'])
},

      error: (error) => {

        this.isLoading = false;

        console.error('Login Failed:', error);

        this.errorMessage =
          error?.error?.message ||
          'Invalid email or password';
      }
    });
  }

  /**
   * Email validation messages
   */
  getEmailError(): string {

    const control = this.loginForm.get('email');

    if (control?.touched && control?.errors) {

      if (control.errors['required']) {
        return 'Email is required';
      }

      if (control.errors['email']) {
        return 'Please enter a valid email';
      }
    }

    return '';
  }

  /**
   * Password validation messages
   */
  getPasswordError(): string {

    const control = this.loginForm.get('password');

    if (control?.touched && control?.errors) {

      if (control.errors['required']) {
        return 'Password is required';
      }

      if (control.errors['minlength']) {
        return 'Password must be at least 6 characters';
      }
    }

    return '';
  }
}