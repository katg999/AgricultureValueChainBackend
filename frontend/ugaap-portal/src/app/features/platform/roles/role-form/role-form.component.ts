import { Component, OnInit, inject, signal } from '@angular/core';
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

  private toast = inject(ToastService);
  private session = inject(SessionService);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toast: ToastService,
    private rolesService: RolesService,
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;
    this.initForm();

    if (this.isEditMode) {
      this.loadRoleData();
    }
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
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

  getFieldError(fieldName: string): string {
    const ctrl = this.roleForm.get(fieldName);
    if (ctrl?.touched && ctrl?.errors) {
      if (ctrl.errors['required']) return 'This field is required';
    }
    return '';
  }

  cancel(): void {
    this.router.navigate(['/platform/roles']);
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadRoleData(): void {
    if (!this.roleId) return;
    this.http.get<any>(API_ENDPOINTS.ACCESS.ROLE_BY_ID(this.roleId)).subscribe({
      next: (role) => {
        this.roleForm.patchValue({ name: role.name, description: role.description });
        if (role.permissions?.length) {
          this.selectedPermissions.set(this.fromBackendPermissions(role.permissions));
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Failed to load role data';
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
      this.toast.warning(
        'No permissions selected',
        'Please select at least one permission before saving.',
      );
      return;
    }

    const tenantId = this.session.tenantId();
    if (!tenantId) {
      this.toast.error('No tenant context', 'Cannot save role without a tenant context.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { name, description } = this.roleForm.value;
    const payload = { name, description, tenantId, permissions: this.toBackendPermissions() };

    const request$ = this.isEditMode
      ? this.http.put<any>(API_ENDPOINTS.ACCESS.ROLE_BY_ID(this.roleId!), payload)
      : this.http.post<any>(API_ENDPOINTS.ACCESS.ROLES, payload);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success(
          this.isEditMode ? 'Role updated' : 'Role created',
          `"${name}" has been ${this.isEditMode ? 'updated' : 'created'} successfully.`,
        );
        this.router.navigate(['/platform/roles']);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message ?? 'Failed to save the role. Please try again.';
        this.errorMessage = msg;
        this.toast.error('Save failed', msg);
      },
    });
  }

  // ── Permission mapping (frontend ids → backend { module, action }) ─────────

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
      cooperatives: 'BRANCHES',
      settings: 'CONFIGURATION',
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
