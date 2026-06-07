import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { ToastService } from '../../../../core/services/toast.service';

export interface Permission {
  id: string;
  label: string;
  checked: boolean;
}

export interface PermissionModule {
  name: string;
  icon: string;
  permissions: Permission[];
}

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
    FormsModule,
    InputComponent,
    ButtonComponent,
    InfoCardComponent,
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

  generatedCredentials: GeneratedCredentials | null = null;
  credentialsCopied = false;

  permissionModules: PermissionModule[] = [
    {
      name: 'Users Management',
      icon: '👥',
      permissions: [
        { id: 'membership.view', label: 'View users', checked: false },
        { id: 'membership.create', label: 'Create users', checked: false },
        { id: 'membership.edit', label: 'Edit users', checked: false },
        { id: 'membership.delete', label: 'Delete users', checked: false },
      ],
    },
    {
      name: 'Cooperatives',
      icon: '🏢',
      permissions: [
        { id: 'coops.view', label: 'View cooperatives', checked: false },
        { id: 'coops.create', label: 'Create cooperatives', checked: false },
        { id: 'coops.edit', label: 'Edit cooperatives', checked: false },
        { id: 'coops.delete', label: 'Delete cooperatives', checked: false },
      ],
    },
    {
      name: 'Financial Reports',
      icon: '📊',
      permissions: [
        { id: 'reports.view', label: 'View reports', checked: false },
        { id: 'reports.create', label: 'Generate reports', checked: false },
      ],
    },
    {
      name: 'Inventory Management',
      icon: '📦',
      permissions: [
        { id: 'inventory.view', label: 'View inventory', checked: false },
        { id: 'inventory.create', label: 'Add stock', checked: false },
        { id: 'inventory.edit', label: 'Edit / Transfer stock', checked: false },
        { id: 'inventory.delete', label: 'Delete stock', checked: false },
      ],
    },
    {
      name: 'System Settings',
      icon: '⚙️',
      permissions: [
        { id: 'settings.view', label: 'View settings', checked: false },
        { id: 'settings.edit', label: 'Edit settings', checked: false },
        { id: 'settings.roles', label: 'Manage roles', checked: false },
      ],
    },
  ];

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

    const state = this.router.getCurrentNavigation()?.extras?.state ?? history.state;
    if (state?.tenantId) {
      this.roleForm.patchValue({ tenantId: state.tenantId });
    }

    if (this.isEditMode) {
      this.loadRoleData();
    }
  }

  // ── Permissions helpers ───────────────────────────────────────────────────

  toggleModulePermissions(module: PermissionModule, checked: boolean): void {
    module.permissions.forEach((p) => (p.checked = checked));
  }

  isModuleFullySelected(module: PermissionModule): boolean {
    return module.permissions.every((p) => p.checked);
  }

  isModulePartiallySelected(module: PermissionModule): boolean {
    const n = module.permissions.filter((p) => p.checked).length;
    return n > 0 && n < module.permissions.length;
  }

  get selectedPermissionsCount(): number {
    return this.permissionModules.reduce(
      (sum, m) => sum + m.permissions.filter((p) => p.checked).length,
      0,
    );
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
            permissions: this.getFormattedPermissions(),
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
                    this.cdr.detectChanges(); // 👈 force view update
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

  private loadRoleData(): void {
    this.roleForm.patchValue({
      name: 'Logistics Manager',
      description: 'Manage inventory, shipments, and logistics',
    });
  }

  private getFormattedPermissions(): any[] {
    const modMap: Record<string, string> = {
      membership: 'MEMBERSHIP',
      coops: 'BRANCHES',
      inventory: 'INVENTORY',
      reports: 'REPORTING',
      settings: 'ACCESS_MANAGEMENT',
    };
    const actMap: Record<string, string> = {
      view: 'VIEW',
      create: 'CREATE',
      edit: 'EDIT',
      delete: 'DELETE',
      generate: 'CREATE',
      transfer: 'EDIT',
      roles: 'EDIT',
    };

    const out: any[] = [];
    this.permissionModules.forEach((mod) => {
      mod.permissions.forEach((p) => {
        if (!p.checked) return;
        const [modKey, actKey] = p.id.split('.');
        const module = modMap[modKey];
        const action = actMap[actKey];
        if (module && action) out.push({ module, action, description: p.label });
      });
    });
    return out;
  }
}
