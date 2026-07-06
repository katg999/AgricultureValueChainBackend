import { Component, OnInit, signal } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;
    this.initForm();

    if (!this.isEditMode) {
      const state = this.router.getCurrentNavigation()?.extras?.state ?? history.state;
      if (state?.tenantId) {
        this.roleForm.patchValue({ tenantId: state.tenantId });
      }
    }

    if (this.isEditMode) {
      this.loadRoleData();
    }
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      name:        ['', Validators.required],
      description: ['', Validators.required],
      tenantId:    ['', Validators.required],
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get selectedPermissionsCount(): number { return this.selectedPermissions().length; }

  get permissionsDesc(): string {
    const n = this.selectedPermissionsCount;
    return `${n} permission${n === 1 ? '' : 's'} selected`;
  }

  getFieldError(fieldName: string): string {
    const ctrl = this.roleForm.get(fieldName);
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'This field is required';
    }
    return '';
  }

  cancel(): void { this.router.navigate(['/platform/roles']); }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadRoleData(): void {
    if (!this.roleId) return;

    if (USE_MOCK) {
      const role = this.rolesService.findById(this.roleId);
      if (!role) {
        this.errorMessage = 'Failed to load role data';
        return;
      }
      this.roleForm.patchValue({ name: role.name, description: role.description });
      this.selectedPermissions.set(this.rolesService.getPermissionsForRole(role));
      return;
    }

    this.http.get<any>(`${API_ENDPOINTS.ACCESS.ROLES}/${this.roleId}`).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          name: role.name,
          description: role.description,
          tenantId: role.tenantId,
        });
        this.loadRolePermissions();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load role data';
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
        ).filter(id => !id.startsWith('dashboard'));
        this.selectedPermissions.set(ids);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load permissions';
      },
    });
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  saveRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }
    if (this.selectedPermissionsCount === 0) {
      alert('Please select at least one permission');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isEditMode) {
      this.updateRole();
      return;
    }

    const { name, description, tenantId } = this.roleForm.value;

    this.http.post<any>(API_ENDPOINTS.ACCESS.ROLES, { name, description, tenantId }).subscribe({
      next: (roleRes) => {
        this.http.post<any>(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(roleRes.roleId || roleRes.id), {
          permissions: this.toBackendPermissions(),
        }).subscribe({
          next: () => {
            this.isLoading = false;
            this.toast.success('Role created', `"${name}" has been created successfully.`);
            this.router.navigate(['/platform/roles']);
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
            this.router.navigate(['/platform/roles']);
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

  private toBackendPermissions(): { module: string; action: string; description: string }[] {
    const moduleMap: Record<string, string> = {
      organisation: 'BRANCHES', configuration: 'ACCESS_MANAGEMENT',
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
