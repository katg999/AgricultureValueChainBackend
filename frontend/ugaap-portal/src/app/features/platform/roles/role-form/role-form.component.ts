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
import { RolesService } from '../../../../core/services/roles.service';
import { USE_MOCK } from '../../../../core/mock/mock-config';

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
    private rolesService: RolesService,
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
        );
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

    this.router.navigate(['/platform/roles']);
  }
}
