// features/cooperative/roles/role-form/role-form.component.ts
//
// Create / edit a cooperative role, and provision the first user for it.
//
// Permissions are picked through the shared <app-permission-tabs> component:
// one tab per service (Farmers, Inventory, …) showing every granular action
// available under it. The selected ids drive the sidebar + guards at login
// time, so a role with nothing under "farmers" never sees the Farmers menu.
//
// Save flow (three chained calls):
//   1. POST /access/roles                  → create the role
//   2. POST /access/roles/:id/permissions  → attach the selected permissions
//   3. POST /access/users                  → create the user, returns generated
//      credentials which are displayed once for the admin to copy.

import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { PermissionTabsComponent } from '../../../../shared/components/permission-tabs/permission-tabs.component';
import { ToastService } from '../../../../core/services/toast.service';

/** Login details returned by the backend after the role's user is created */
export interface GeneratedCredentials {
  roleName: string;
  username: string;
  fullName: string;
  email: string;
  temporaryPassword: string;
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent,
    InfoCardComponent,
    PermissionTabsComponent,
  ],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.css'],
})
export class RoleFormComponent implements OnInit {
  roleId: string | null = null;
  isEditMode = false;
  roleForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  /** Permission ids granted to this role — two-way bound to the tab picker */
  readonly selectedPermissions = signal<string[]>([]);

  /** Set after a successful save — switches the view to the credentials card */
  generatedCredentials: GeneratedCredentials | null = null;
  credentialsCopied = false;

  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;

    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      tenantId: ['', Validators.required],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+\d{1,3}\d{4,14}$/)]],
    });

    // Accept tenantId passed via router state (e.g. from onboarding)
    const state = this.router.getCurrentNavigation()?.extras?.state ?? history.state;
    if (state?.tenantId) {
      this.roleForm.patchValue({ tenantId: state.tenantId });
    }

    if (this.isEditMode) {
      // this.loadRoleData();
    }
  }

  get selectedPermissionsCount(): number {
    return this.selectedPermissions().length;
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  getFieldError(field: string): string {
    const ctrl = this.roleForm.get(field);
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'This field is required';
      if (ctrl.errors['email']) return 'Please enter a valid email address';
      if (ctrl.errors['pattern'] && field === 'phone')
        return 'Include country code (e.g. +256712345678)';
    }
    return '';
  }

  cancel(): void {
    this.router.navigate(['/cooperative/roles']);
  }

  // ── Credential helpers ────────────────────────────────────────────────────

  copyAllCredentials(): void {
    if (!this.generatedCredentials) return;
    const { fullName, roleName, username, email, temporaryPassword } = this.generatedCredentials;
    const text = `Full name: ${fullName}\nRole: ${roleName}\nUsername: ${username}\nEmail: ${email}\nPassword: ${temporaryPassword}`;
    navigator.clipboard.writeText(text).then(() => {
      this.credentialsCopied = true;
      setTimeout(() => (this.credentialsCopied = false), 3000);
    });
  }

  dismissCredentials(): void {
    this.generatedCredentials = null;
    this.router.navigate(['/cooperative/roles']);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  saveRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }
    if (this.selectedPermissionsCount === 0) {
      this.toast.warning(
        'No permissions selected',
        'Please select at least one permission before saving.',
      );
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { name, description, tenantId, fullName, email, phone } = this.roleForm.value;

    // Step 1: Create role
    this.http.post<any>(API_ENDPOINTS.ACCESS.ROLES, { name, description, tenantId }).subscribe({
      next: (roleRes) => {
        const createdRoleId = roleRes.roleId;

        // Step 2: Assign permissions
        this.http
          .post<any>(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(createdRoleId), {
            permissions: this.toBackendPermissions(),
          })
          .subscribe({
            next: () => {
              // Step 3: Create user for this role
              const state = history.state;
              this.http
                .post<any>(API_ENDPOINTS.ACCESS.USERS, {
                  fullName,
                  email,
                  phone,
                  tenantId,
                  branchId: state?.branchId ?? '',
                  roleId: createdRoleId,
                })
                .subscribe({
                  next: (userRes) => {
                    this.isLoading = false;
                    this.generatedCredentials = {
                      roleName: userRes.roleName,
                      username: userRes.username,
                      fullName: userRes.fullName,
                      email: userRes.email,
                      temporaryPassword: userRes.temporaryPassword,
                    };
                    this.cdr.detectChanges();
                    this.toast.success(
                      'Role created',
                      `"${name}" and user account set up successfully.`,
                    );
                  },
                  error: (err) => {
                    this.isLoading = false;
                    const msg =
                      err?.error?.message ?? 'Role and permissions saved but user creation failed.';
                    this.errorMessage = msg;
                    this.toast.error('User creation failed', msg);
                  },
                });
            },
            error: (err) => {
              this.isLoading = false;
              const msg =
                err?.error?.message ?? 'Role created but permissions could not be assigned.';
              this.errorMessage = msg;
              this.toast.error('Permissions failed', msg);
            },
          });
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message ?? 'Failed to save the role. Please try again.';
        this.errorMessage = msg;
        this.toast.error('Save failed', msg);
      },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  // private loadRoleData(): void {
  //   // Stub — replace with real API call when endpoint is available.
  //   // On load, push the role's granted ids into the picker:
  //   //   this.selectedPermissions.set(role.permissions);
  // }

  /**
   * Converts the granular frontend ids (e.g. "farmers.approve",
   * "reports.payments.view") into the {module, action} pairs the backend
   * accepts today (shared/security/Permission.java). The original id is sent
   * in `description` so nothing is lost; once the backend stores granular ids
   * natively this mapping can be dropped and the raw ids sent instead.
   */
  private toBackendPermissions(): { module: string; action: string; description: string }[] {
    const moduleMap: Record<string, string> = {
      dashboard: 'REPORTING',
      organisation: 'BRANCHES',
      configuration: 'ACCESS_MANAGEMENT',
      collections: 'INVENTORY',
      farmers: 'MEMBERSHIP',
      branches: 'BRANCHES',
      inventory: 'INVENTORY',
      users: 'MEMBERSHIP',
      roles: 'ACCESS_MANAGEMENT',
      reports: 'REPORTING',
      cooperatives: 'BRANCHES',
      settings: 'ACCESS_MANAGEMENT',
    };
    const actionMap: Record<string, string> = {
      view: 'VIEW',
      metrics: 'VIEW',
      performance: 'VIEW',
      disburse: 'VIEW',
      export: 'VIEW',
      create: 'CREATE',
      register: 'CREATE',
      record: 'CREATE',
      onboard: 'CREATE',
      receive: 'CREATE',
      issue: 'CREATE',
      generate: 'CREATE',
      build: 'CREATE',
      edit: 'EDIT',
      transfer: 'EDIT',
      adjust: 'EDIT',
      assign: 'EDIT',
      submit: 'EDIT',
      grade: 'EDIT',
      reset_password: 'EDIT',
      approve: 'APPROVE',
      reject: 'APPROVE',
      delete: 'DELETE',
      deactivate: 'DELETE',
      suspend: 'DELETE',
    };

    const seen = new Set<string>();
    const out: { module: string; action: string; description: string }[] = [];

    for (const id of this.selectedPermissions()) {
      const parts = id.split('.');
      const module = moduleMap[parts[0]];
      const action = actionMap[parts[parts.length - 1]];
      if (!module || !action) continue;

      const key = `${module}:${action}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ module, action, description: id });
    }
    return out;
  }
}
