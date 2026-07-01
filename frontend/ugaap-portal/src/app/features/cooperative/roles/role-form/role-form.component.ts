// Create / edit a cooperative role, and provision the first user for it.
//
// Save flow (three chained calls):
//   1. POST /access/roles                  → create the role
//   2. POST /access/roles/:id/permissions  → attach selected permissions
//   3. POST /access/users                  → create the user, returns generated
//      credentials which are displayed once for the admin to copy.

import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { FormShellComponent } from '../../../../shared/components/form-wizard/form-wizard.component';
import { FormSectionComponent } from '../../../../shared/components/form-section/form-section.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PermissionTabsComponent } from '../../../../shared/components/permission-tabs/permission-tabs.component';
import { ToastService } from '../../../../core/services/toast.service';

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
    FormShellComponent,
    FormSectionComponent,
    InputComponent,
    ButtonComponent,
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

  readonly selectedPermissions = signal<string[]>([]);

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

    if (this.isEditMode) {
      // Edit mode: only name + description (tenantId is set at creation and cannot change)
      this.roleForm = this.fb.group({
        name:        ['', Validators.required],
        description: ['', Validators.required],
      });

      const state = history.state;
      if (state?.role) {
        // Pre-fill from navigation state — works without a backend.
        // TODO (backend integration): also call this.loadRoleData() here
        // so fresh API data (including permissions) overlays the state data.
        this.roleForm.patchValue({
          name:        state.role.name,
          description: state.role.description,
        });
      } else {
        // Navigated directly to /edit URL — no state, must load from API.
        this.loadRoleData();
      }
    } else {
      // Create mode: role details + first user account
      this.roleForm = this.fb.group({
        name:        ['', Validators.required],
        description: ['', Validators.required],
        tenantId:    ['', Validators.required],
        fullName:    ['', Validators.required],
        email:       ['', [Validators.required, Validators.email]],
        phone:       ['', [Validators.required, Validators.pattern(/^\+\d{1,3}\d{4,14}$/)]],
      });
      const state = this.router.getCurrentNavigation()?.extras?.state ?? history.state;
      if (state?.tenantId) {
        this.roleForm.patchValue({ tenantId: state.tenantId });
      }
    }
  }

  // ── Data loading (edit mode) ──────────────────────────────────────────────

  loadRoleData(): void {
    if (!this.roleId) return;
    this.http.get<any>(API_ENDPOINTS.ACCESS.ROLE_BY_ID(this.roleId)).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          name: role.name,
          description: role.description,
          tenantId: role.tenantId,
        });
        this.loadRolePermissions();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Failed to load role data';
      },
    });
  }

  loadRolePermissions(): void {
    if (!this.roleId) return;
    this.http.get<any[]>(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(this.roleId)).subscribe({
      next: (permissions) => {
        const ids = permissions.map(p =>
          typeof p === 'string'
            ? p
            : `${String(p.module).toLowerCase()}.${String(p.action).toLowerCase()}`,
        );
        this.selectedPermissions.set(ids);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Failed to load permissions';
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get selectedPermissionsCount(): number { return this.selectedPermissions().length; }

  get permissionsDesc(): string {
    const n = this.selectedPermissionsCount;
    return `${n} permission${n === 1 ? '' : 's'} selected`;
  }

  getFieldError(field: string): string {
    const ctrl = this.roleForm.get(field);
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'This field is required';
      if (ctrl.errors['email'])    return 'Please enter a valid email address';
      if (ctrl.errors['pattern'] && field === 'phone')
        return 'Include country code (e.g. +256712345678)';
    }
    return '';
  }

  cancel(): void { this.router.navigate(['/cooperative/roles']); }

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
      this.toast.warning('No permissions selected', 'Please select at least one permission before saving.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isEditMode) {
      this.updateRole();
      return;
    }

    const { name, description, fullName, email, phone } = this.roleForm.value;

    this.http.post<any>(API_ENDPOINTS.ACCESS.ROLES, { name, description }).subscribe({
      next: (roleRes) => {
        const createdRoleId = roleRes.roleId;

        this.http.post<any>(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(createdRoleId), {
          permissions: this.toBackendPermissions(),
        }).subscribe({
          next: () => {
            const state = history.state;
            this.http.post<any>(API_ENDPOINTS.ACCESS.USERS, {
              fullName, email, phone,
              branchId: state?.branchId ?? '',
              roleId: createdRoleId,
            }).subscribe({
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
                this.toast.success('Role created', `"${name}" and user account set up successfully.`);
              },
              error: (err) => {
                this.isLoading = false;
                const msg = err?.error?.message ?? 'Role and permissions saved but user creation failed.';
                this.errorMessage = msg;
                this.toast.error('User creation failed', msg);
              },
            });
          },
          error: (err) => {
            this.isLoading = false;
            const msg = err?.error?.message ?? 'Role created but permissions could not be assigned.';
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

  // ── Update (edit mode) ────────────────────────────────────────────────────

  private updateRole(): void {
    const { name, description } = this.roleForm.value;

    this.http.put<any>(API_ENDPOINTS.ACCESS.ROLE_BY_ID(this.roleId!), { name, description }).subscribe({
      next: () => {
        this.http.post<any>(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(this.roleId!), {
          permissions: this.toBackendPermissions(),
        }).subscribe({
          next: () => {
            this.isLoading = false;
            this.toast.success('Role updated', `"${name}" has been updated successfully.`);
            this.router.navigate(['/cooperative/roles']);
          },
          error: (err) => {
            this.isLoading = false;
            const msg = err?.error?.message ?? 'Role updated but permissions could not be saved.';
            this.errorMessage = msg;
            this.toast.error('Permissions failed', msg);
          },
        });
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message ?? 'Failed to update the role. Please try again.';
        this.errorMessage = msg;
        this.toast.error('Update failed', msg);
      },
    });
  }

  // ── Permission mapping (frontend ids → backend {module, action} pairs) ────

  private toBackendPermissions(): { module: string; action: string; description: string }[] {
    const moduleMap: Record<string, string> = {
      dashboard: 'REPORTING', organisation: 'BRANCHES', configuration: 'ACCESS_MANAGEMENT',
      collections: 'INVENTORY', farmers: 'MEMBERSHIP', agents: 'MEMBERSHIP',
      branches: 'BRANCHES', inventory: 'INVENTORY', finance: 'INVENTORY',
      users: 'MEMBERSHIP', roles: 'ACCESS_MANAGEMENT', reports: 'REPORTING',
      cooperatives: 'BRANCHES', settings: 'ACCESS_MANAGEMENT',
    };
    const actionMap: Record<string, string> = {
      view: 'VIEW', metrics: 'VIEW', performance: 'VIEW', disburse: 'VIEW', export: 'VIEW',
      create: 'CREATE', register: 'CREATE', record: 'CREATE', onboard: 'CREATE',
      receive: 'CREATE', request: 'CREATE', issue: 'CREATE', generate: 'CREATE',
      build: 'CREATE', edit: 'EDIT', transfer: 'EDIT', adjust: 'EDIT', assign: 'EDIT',
      submit: 'EDIT', grade: 'EDIT', process: 'EDIT', reset_password: 'EDIT',
      approve: 'APPROVE', reject: 'APPROVE', delete: 'DELETE', deactivate: 'DELETE', suspend: 'DELETE',
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
