import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

// Core Services
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { DashboardConfigService } from '../../../core/services/dashboard-config.service';

// Shared Components
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
    AlertComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  private returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private session: SessionService,
    private dashboardConfig: DashboardConfigService,
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  getEmailError(): string {
    const c = this.loginForm.get('email');
    if (c?.touched && c.errors) {
      if (c.errors['required']) return 'Email is required';
      if (c.errors['email']) return 'Please enter a valid email address';
    }
    return '';
  }

  getPasswordError(): string {
    const c = this.loginForm.get('password');
    if (c?.touched && c.errors) {
      if (c.errors['required']) return 'Password is required';
      if (c.errors['minlength']) return 'Password must be at least 6 characters';
    }
    return '';
  }

  getRoleError(): string {
    const c = this.loginForm.get('role');
    if (c?.touched && c.errors?.['required']) return 'Please select your role';
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    this.authService.login({ usernameOrEmail: email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;

        const data = res?.data;

        // Check for temporary token to trigger OTP flow
        const tempToken = (data as any)?.tempToken || (data as any)?.access;

        if (tempToken) {
          // Save it so the OTP component can access it
          this.session.setTempToken(tempToken);

          //Navigate to the OTP verification screen immediately
          this.router.navigate(['/auth/otp']);
        } else {
          this.errorMessage = 'Unexpected response from server. Please try again.';
        }

        // If no tempToken, proceed with existing session logic (direct login)
        this.session.setSession(data.accessToken, data.refreshToken, {
          id: data.userId,
          fullName: data.username,
          email: data.email,
          phone: '',
          role: data.roles?.[0] ?? '',
          permissions: [],
        });

        const roles: string[] = data.roles ?? [];
        const isPlatformAdmin = roles.includes('PLATFORM_ADMIN');
        const isMakerOrChecker =
          roles.includes('COOPERATIVE_ADMIN_MAKER') || roles.includes('COOPERATIVE_ADMIN_CHECKER');

        if (isMakerOrChecker) {
          const hasCompletedSetup = localStorage.getItem(`setup_complete_${data.userId}`);
          if (!hasCompletedSetup) {
            // First time logging in — send to setup wizard before accessing the app.
            this.router.navigateByUrl('/auth/first-time-login');
          } else {
            // Returning user: session.setSession() was called above, so the role is stored.
            // homeRoute() checks the role and picks the correct dashboard:
            //   Platform admin  → /platform/dashboard
            //   Cooperative admin → /cooperative/dashboard
            //   Branch staff    → /branch/dashboard
            // This replaces the old hardcoded path ('/branch/farmers/list') which ignored the user's level.
            this.router.navigateByUrl(this.dashboardConfig.homeRoute());
          }
          return;
        }

        if (isPlatformAdmin) {
          // Same pattern — let homeRoute() decide the destination based on the stored role.
          this.router.navigateByUrl(this.dashboardConfig.homeRoute());
          return;
        }

        //   this.router.navigateByUrl('/branch/farmers/list');
      },
      error: (err) => {
        this.isLoading = false;
        console.error('LOGIN ERROR', err);
        this.errorMessage = err?.error?.message ?? 'Invalid credentials. Please try again.';
      },
    });
  }
}
