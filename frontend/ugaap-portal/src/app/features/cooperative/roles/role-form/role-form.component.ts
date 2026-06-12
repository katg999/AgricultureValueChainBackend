// features/cooperative/roles/role-form/role-form.component.ts
//
// Create / edit a cooperative role.
//
// Permissions are picked through the shared <app-permission-tabs> component:
// one tab per service (Farmers, Inventory, …) showing every granular action
// available under it. The selected ids drive the sidebar + guards at login
// time, so a role with nothing under "farmers" never sees the Farmers menu.

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { InputComponent }   from '../../../../shared/components/input/input.component';
import { ButtonComponent }  from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { PermissionTabsComponent } from '../../../../shared/components/permission-tabs/permission-tabs.component';
import { ToastService }     from '../../../../core/services/toast.service';

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
      // this.loadRoleData();
    }
  }

  get selectedPermissionsCount(): number {
    return this.selectedPermissions().length;
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
    this.router.navigate(['/cooperative/roles']);

    // this.isLoading = true;
    // this.errorMessage = '';

    const rolePayload = {
      name:        this.roleForm.value.name,
      description: this.roleForm.value.description,
      tenantId:    this.roleForm.value.tenantId,
      permissions: this.selectedPermissions(),
    };

    // this.http.post(API_ENDPOINTS.ACCESS.ROLES, rolePayload).subscribe({
    //   next: (res: any) => {
    //     const roleId = res.roleId;
    //     this.http.post(
    //       API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(roleId),
    //       { permissions: this.selectedPermissions() },
    //     ).subscribe({
    //       next: () => {
    //         this.isLoading = false;
    //         this.toast.success('Role saved', `"${this.roleForm.value.name}" has been ${this.isEditMode ? 'updated' : 'created'} successfully.`);
    //         this.router.navigate(['/cooperative/roles']);
    //       },
    //       error: (err) => {
    //         this.isLoading = false;
    //         const msg = err?.error?.message ?? 'Role was created but permissions could not be assigned.';
    //         this.errorMessage = msg;
    //         this.toast.error('Permissions failed', msg);
    //       },
    //     });
    //   },
    //   error: (err) => {
    //     this.isLoading = false;
    //     const msg = err?.error?.message ?? 'Failed to save the role. Please try again.';
    //     this.errorMessage = msg;
    //     this.toast.error('Save failed', msg);
    //   },
    // });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  // private loadRoleData(): void {
  //   // Stub — replace with real API call when endpoint is available.
  //   // On load, push the role's granted ids into the picker:
  //   //   this.selectedPermissions.set(role.permissions);
  //   this.roleForm.patchValue({
  //     name: 'Logistics Manager',
  //     description: 'Manage inventory, shipments, and logistics',
  //   });
  // }
}
