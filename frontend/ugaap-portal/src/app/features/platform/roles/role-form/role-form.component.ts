// features/platform/roles/role-form/role-form.component.ts
//
// Create / edit a platform-level role.
//
// Layout follows the shared <app-form-wizard> shell (the farmer-register
// design): role details → permissions. Permissions are picked through
// <app-permission-tabs> (scope="platform") — one tab per service, each broken
// down into granular actions. Selected ids are plain strings like
// "cooperatives.approve".

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { FormWizardComponent, WizardStep } from '../../../../shared/components/form-wizard/form-wizard.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PermissionTabsComponent } from '../../../../shared/components/permission-tabs/permission-tabs.component';

/** Form controls validated before leaving each step */
const STEP_FIELDS: string[][] = [
  ['name', 'description', 'tenantId'],
  [],   // permissions step is validated by selection count on save
];

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormWizardComponent,
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

  readonly steps: WizardStep[] = [
    { label: 'Role details' },
    { label: 'Permissions' },
  ];
  currentStep = 0;

  /** Permission ids granted to this role — two-way bound to the tab picker */
  readonly selectedPermissions = signal<string[]>([]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;
    this.initForm();

    if (!this.isEditMode) {
      const navigation = this.router.getCurrentNavigation();
      const state = navigation?.extras?.state || history.state;
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
      name: ['', Validators.required],
      description: ['', Validators.required],
      tenantId: ['', Validators.required],
    });
  }

  // ── Step navigation ───────────────────────────────────────────────────────

  /** Moving forward validates the current step's controls first */
  nextStep(): void {
    if (!this.validateStep(this.currentStep)) return;
    this.currentStep = Math.min(this.currentStep + 1, this.steps.length - 1);
  }

  prevStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 0);
  }

  /** Sidebar clicks: backward always allowed, forward gated by validation */
  goToStep(index: number): void {
    if (index <= this.currentStep) {
      this.currentStep = index;
      return;
    }
    if (this.validateStep(this.currentStep)) {
      this.currentStep = index;
    }
  }

  private validateStep(step: number): boolean {
    const fields = STEP_FIELDS[step] ?? [];
    let valid = true;
    for (const field of fields) {
      const ctrl = this.roleForm.get(field);
      ctrl?.markAsTouched();
      if (ctrl?.invalid) valid = false;
    }
    return valid;
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadRoleData(): void {
    if (!this.roleId) return;
    this.errorMessage = '';

    // Fetch role details
    this.http.get<any>(`${API_ENDPOINTS.ACCESS.ROLES}/${this.roleId}`).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          name: role.name,
          description: role.description,
          tenantId: role.tenantId,
        });
        // After role details, load assigned permissions
        this.loadRolePermissions();
      },
      error: (err) => {
        console.error('Failed to load role:', err);
        this.errorMessage = err?.error?.message || 'Failed to load role data';
      },
    });
  }

  loadRolePermissions(): void {
    if (!this.roleId) return;
    this.http.get<any[]>(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(this.roleId)).subscribe({
      next: (permissions) => {
        // Accept either plain ids ("farmers.view") or legacy
        // { module, action } pairs ("FARMERS"/"VIEW" → "farmers.view").
        const ids = permissions.map(p =>
          typeof p === 'string'
            ? p
            : `${String(p.module).toLowerCase()}.${String(p.action).toLowerCase()}`,
        );
        this.selectedPermissions.set(ids);
      },
      error: (err) => {
        console.error('Failed to load permissions:', err);
        this.errorMessage = err?.error?.message || 'Failed to load permissions';
        this.isLoading = false;
      },
    });
  }

  get selectedPermissionsCount(): number {
    return this.selectedPermissions().length;
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  getFieldError(fieldName: string): string {
    const control = this.roleForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
    }
    return '';
  }

  cancel(): void {
    this.router.navigate(['/platform/roles']);
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

    const rolePayload = {
      name: this.roleForm.value.name,
      description: this.roleForm.value.description,
      tenantId: this.roleForm.value.tenantId,
    };
    const permissionsPayload = { permissions: this.selectedPermissions() };
    this.router.navigate(['/platform/roles']);

    // if (this.isEditMode && this.roleId) {
    //   // UPDATE existing role
    //   this.http.post(`${API_ENDPOINTS.ACCESS.ROLES}/${this.roleId}`, rolePayload).subscribe({
    //     next: () => {
    //       this.http.post(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(this.roleId!), permissionsPayload).subscribe({
    //         next: () => this.router.navigate(['/platform/roles']),
    //         error: (err) => {
    //           console.error('Failed to update permissions:', err);
    //           this.errorMessage = err?.error?.message || 'Role updated but permissions failed';
    //         },
    //       });
    //     },
    //     error: (err) => {
    //       console.error('Failed to update role:', err);
    //       this.errorMessage = err?.error?.message || 'Failed to update role';
    //     },
    //   });
    // } else {
    //   // CREATE new role
    //   this.http.post(API_ENDPOINTS.ACCESS.ROLES, rolePayload).subscribe({
    //     next: (roleResponse: any) => {
    //       const newRoleId = roleResponse.roleId;
    //       this.http.post(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(newRoleId), permissionsPayload).subscribe({
    //         next: () => this.router.navigate(['/platform/roles'], { queryParams: { created: 'true' } }),
    //         error: (err) => {
    //           console.error('Permission assignment failed:', err);
    //           this.errorMessage = err?.error?.message || 'Role created but permissions failed';
    //         },
    //       });
    //     },
    //     error: (err) => {
    //       console.error('Role creation failed:', err);
    //       this.errorMessage = err?.error?.message || 'Failed to create role';
    //     },
    //   });
    // }
  }
}
