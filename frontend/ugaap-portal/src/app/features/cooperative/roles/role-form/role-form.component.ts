// Save flow (two chained calls):
//   1. POST /access/roles  → create role with permissions in one shot
//   2. POST /access/users  → create the first user, returns generated credentials

import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { SessionService } from '../../../../core/services/session.service';
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
  private session = inject(SessionService);

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
      // Edit mode: name + description only — tenantId comes from session
      this.roleForm = this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
      });

      const state = history.state;
      if (state?.role) {
        this.roleForm.patchValue({
          name: state.role.name,
          description: state.role.description,
        });
        // Pre-fill permissions from navigation state if carried
        if (state.role.permissions?.length) {
          this.selectedPermissions.set(this.fromBackendPermissions(state.role.permissions));
        }
      } else {
        this.loadRoleData();
      }
    } else {
      // Create mode: role details + first user account
      // tenantId is NOT in the form — pulled from session in saveRole()
      this.roleForm = this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
        fullName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^\+\d{1,3}\d{4,14}$/)]],
      });
    }
  }

  // ── Data loading (edit mode) ──────────────────────────────────────────────
  // GET /roles/{id} now returns permissions inside RoleResponse,
  // so one call is enough — no separate loadRolePermissions() needed.

  loadRoleData(): void {
    if (!this.roleId) return;
    this.http.get<any>(API_ENDPOINTS.ACCESS.ROLE_BY_ID(this.roleId)).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          name: role.name,
          description: role.description,
        });
        // Permissions come back as { module, action, description }[] in RoleResponse
        if (role.permissions?.length) {
          this.selectedPermissions.set(this.fromBackendPermissions(role.permissions));
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Failed to load role data';
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get selectedPermissionsCount(): number {
    return this.selectedPermissions().length;
  }

  get permissionsDesc(): string {
    const n = this.selectedPermissionsCount;
    return `${n} permission${n === 1 ? '' : 's'} selected`;
  }

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

    const tenantId = this.session.tenantId();
    if (!tenantId) {
      this.toast.error(
        'No tenant context',
        'Cannot create a role without a tenant. Please log in again.',
      );
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isEditMode) {
      this.updateRole(tenantId);
      return;
    }

    const { name, description, fullName, email, phone } = this.roleForm.value;

    // Step 1 — create role + permissions in one call
    this.http
      .post<any>(API_ENDPOINTS.ACCESS.ROLES, {
        name,
        description,
        tenantId,
        permissions: this.toBackendPermissions(),
      })
      .subscribe({
        next: (roleRes) => {
          // Step 2 — create the first user for this role
          this.http
            .post<any>(API_ENDPOINTS.ACCESS.USERS, {
              fullName,
              email,
              phone,
              tenantId,
              branchId: history.state?.branchId ?? null,
              roleId: roleRes.roleId,
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
                const msg = err?.error?.message ?? 'Role saved but user creation failed.';
                this.errorMessage = msg;
                this.toast.error('User creation failed', msg);
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
  // TODO: needs a PUT /access/roles/{id} backend endpoint that accepts
  // { name, description, permissions[] } — same shape as CreateRoleRequest
  // minus tenantId (tenantId never changes after creation).

  private updateRole(tenantId: string): void {
    const { name, description } = this.roleForm.value;

    this.http
      .put<any>(API_ENDPOINTS.ACCESS.ROLE_BY_ID(this.roleId!), {
        name,
        description,
        tenantId,
        permissions: this.toBackendPermissions(),
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.toast.success('Role updated', `"${name}" has been updated successfully.`);
          this.router.navigate(['/cooperative/roles']);
        },
        error: (err) => {
          this.isLoading = false;
          const msg = err?.error?.message ?? 'Failed to update the role. Please try again.';
          this.errorMessage = msg;
          this.toast.error('Update failed', msg);
        },
      });
  }

  // ── Permission mapping ────────────────────────────────────────────────────
  // Frontend catalog ids (e.g. "farmers.approve") → backend { module, action }
  // Module values MUST match Permission.Module enum exactly:
  //   BRANCHES | ORGANISATION_SETUP | CONFIGURATION | COLLECTIONS | FARMERS
  //   AGENTS | COLLECTION_HUBS | INVENTORY | FINANCE | USER_MANAGEMENT
  //   ROLES_AND_PERMISSIONS | REPORTS

  private toBackendPermissions(): { module: string; action: string; description: string }[] {
    const moduleMap: Record<string, string> = {
      dashboard: 'REPORTS',
      organisation: 'ORGANISATION_SETUP',
      configuration: 'CONFIGURATION',
      collections: 'COLLECTIONS',
      farmers: 'FARMERS',
      agents: 'AGENTS',
      collection_hubs: 'COLLECTION_HUBS',
      branches: 'BRANCHES',
      inventory: 'INVENTORY',
      finance: 'FINANCE',
      users: 'USER_MANAGEMENT',
      roles: 'ROLES_AND_PERMISSIONS',
      reports: 'REPORTS',
      cooperatives: 'BRANCHES', // no COOPERATIVES module on backend
      settings: 'CONFIGURATION', // no SETTINGS module on backend
    };

    // Action values MUST match Permission.Action enum: VIEW | CREATE | EDIT | APPROVE | DELETE
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
      request: 'CREATE',
      issue: 'CREATE',
      generate: 'CREATE',
      build: 'CREATE',
      edit: 'EDIT',
      transfer: 'EDIT',
      adjust: 'EDIT',
      assign: 'EDIT',
      submit: 'EDIT',
      grade: 'EDIT',
      process: 'EDIT',
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

  // ── Reverse mapping (backend → frontend ids for edit pre-fill) ────────────
  // RoleResponse.permissions is { module, action }[] — map back to catalog ids
  // so the permission tabs render the correct checked state.

  private fromBackendPermissions(permissions: { module: string; action: string }[]): string[] {
    const reverseModule: Record<string, string> = {
      BRANCHES: 'branches',
      ORGANISATION_SETUP: 'organisation',
      CONFIGURATION: 'configuration',
      COLLECTIONS: 'collections',
      FARMERS: 'farmers',
      AGENTS: 'agents',
      COLLECTION_HUBS: 'collection_hubs',
      INVENTORY: 'inventory',
      FINANCE: 'finance',
      USER_MANAGEMENT: 'users',
      ROLES_AND_PERMISSIONS: 'roles',
      REPORTS: 'reports',
    };
    const reverseAction: Record<string, string> = {
      VIEW: 'view',
      CREATE: 'create',
      EDIT: 'edit',
      APPROVE: 'approve',
      DELETE: 'delete',
    };

    return permissions
      .map((p) => {
        const m = reverseModule[p.module];
        const a = reverseAction[p.action];
        return m && a ? `${m}.${a}` : null;
      })
      .filter((id): id is string => id !== null);
  }
}
