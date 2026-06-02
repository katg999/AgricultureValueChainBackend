import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { InputComponent }   from '../../../../shared/components/input/input.component';
import { ButtonComponent }  from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { ToastService }     from '../../../../core/services/toast.service';

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

  permissionModules: PermissionModule[] = [
    {
      name: 'Users Management', icon: '👥',
      permissions: [
        { id: 'membership.view',   label: 'View users',   checked: false },
        { id: 'membership.create', label: 'Create users', checked: false },
        { id: 'membership.edit',   label: 'Edit users',   checked: false },
        { id: 'membership.delete', label: 'Delete users', checked: false },
      ],
    },
    {
      name: 'Cooperatives', icon: '🏢',
      permissions: [
        { id: 'coops.view',   label: 'View cooperatives',   checked: false },
        { id: 'coops.create', label: 'Create cooperatives', checked: false },
        { id: 'coops.edit',   label: 'Edit cooperatives',   checked: false },
        { id: 'coops.delete', label: 'Delete cooperatives', checked: false },
      ],
    },
    {
      name: 'Financial Reports', icon: '📊',
      permissions: [
        { id: 'reports.view',   label: 'View reports',     checked: false },
        { id: 'reports.create', label: 'Generate reports', checked: false },
      ],
    },
    {
      name: 'Inventory Management', icon: '📦',
      permissions: [
        { id: 'inventory.view',   label: 'View inventory',      checked: false },
        { id: 'inventory.create', label: 'Add stock',            checked: false },
        { id: 'inventory.edit',   label: 'Edit / Transfer stock', checked: false },
        { id: 'inventory.delete', label: 'Delete stock',         checked: false },
      ],
    },
    {
      name: 'System Settings', icon: '⚙️',
      permissions: [
        { id: 'settings.view',  label: 'View settings',  checked: false },
        { id: 'settings.edit',  label: 'Edit settings',  checked: false },
        { id: 'settings.roles', label: 'Manage roles',   checked: false },
      ],
    },
  ];

  private toast = inject(ToastService);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;

    this.roleForm = this.fb.group({
      name:        ['', Validators.required],
      description: ['', Validators.required],
      tenantId:    ['', Validators.required],
    });

    // Accept tenantId passed via router state (e.g. from onboarding)
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
    module.permissions.forEach(p => (p.checked = checked));
  }

  isModuleFullySelected(module: PermissionModule): boolean {
    return module.permissions.every(p => p.checked);
  }

  isModulePartiallySelected(module: PermissionModule): boolean {
    const n = module.permissions.filter(p => p.checked).length;
    return n > 0 && n < module.permissions.length;
  }

  get selectedPermissionsCount(): number {
    return this.permissionModules.reduce(
      (sum, m) => sum + m.permissions.filter(p => p.checked).length, 0,
    );
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  getFieldError(field: string): string {
    const ctrl = this.roleForm.get(field);
    return (ctrl?.touched && ctrl?.errors?.['required']) ? 'This field is required' : '';
  }

  cancel(): void {
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

    const rolePayload = {
      name:        this.roleForm.value.name,
      description: this.roleForm.value.description,
      tenantId:    this.roleForm.value.tenantId,
    };

    this.http.post(API_ENDPOINTS.ACCESS.ROLES, rolePayload).subscribe({
      next: (res: any) => {
        const roleId = res.roleId;
        this.http.post(
          API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(roleId),
          { permissions: this.getFormattedPermissions() },
        ).subscribe({
          next: () => {
            this.isLoading = false;
            this.toast.success('Role saved', `"${this.roleForm.value.name}" has been ${this.isEditMode ? 'updated' : 'created'} successfully.`);
            this.router.navigate(['/cooperative/roles']);
          },
          error: (err) => {
            this.isLoading = false;
            const msg = err?.error?.message ?? 'Role was created but permissions could not be assigned.';
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
    // Stub — replace with real API call when endpoint is available
    this.roleForm.patchValue({
      name: 'Logistics Manager',
      description: 'Manage inventory, shipments, and logistics',
    });
  }

  private getFormattedPermissions(): any[] {
    const modMap: Record<string, string> = {
      membership: 'MEMBERSHIP',
      coops:      'BRANCHES',
      inventory:  'INVENTORY',
      reports:    'REPORTING',
      settings:   'ACCESS_MANAGEMENT',
    };
    const actMap: Record<string, string> = {
      view: 'VIEW', create: 'CREATE', edit: 'EDIT', delete: 'DELETE',
      generate: 'CREATE', transfer: 'EDIT', roles: 'EDIT',
    };

    const out: any[] = [];
    this.permissionModules.forEach(mod => {
      mod.permissions.forEach(p => {
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
