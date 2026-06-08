import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { LogoComponent } from '../../../../shared/components/logo/logo.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';

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
    LogoComponent,
    InputComponent,
    ButtonComponent,
    InfoCardComponent
  ],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.css']
})
export class RoleFormComponent implements OnInit {
  roleId: string | null = null;
  isEditMode = false;
  roleForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  cooperativeInfo: any = null;

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
        name: 'System Settings', icon: '⚙️',
        permissions: [
          { id: 'settings.view',  label: 'View settings',  checked: false },
          { id: 'settings.edit',  label: 'Edit settings',  checked: false },
          { id: 'settings.roles', label: 'Manage roles',   checked: false },
        ],
      },
    ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;
    this.initForm();

    if (!this.isEditMode) {
      const navigation = this.router.getCurrentNavigation();
      const state = navigation?.extras?.state || history.state;
      if (state?.tenantId) {
        this.cooperativeInfo = state;
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
      tenantId: ['', Validators.required]
    });
  }

  loadRoleData(): void {
    if (!this.roleId) return;
    // this.isLoading = true;
    this.errorMessage = '';

    // Fetch role details
    this.http.get<any>(`${API_ENDPOINTS.ACCESS.ROLES}/${this.roleId}`).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          name: role.name,
          description: role.description,
          tenantId: role.tenantId
        });
        // After role details, load assigned permissions
        this.loadRolePermissions();
      },
      error: (err) => {
        console.error('Failed to load role:', err);
        this.errorMessage = err?.error?.message || 'Failed to load role data';
        // this.isLoading = false;
      }
    });
  }

  loadRolePermissions(): void {
    if (!this.roleId) return;
    this.http.get<any[]>(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(this.roleId)).subscribe({
      next: (permissions) => {
        // Reset all checkboxes
        this.permissionModules.forEach(module =>
          module.permissions.forEach(p => p.checked = false)
        );
        // Mark checked based on loaded permissions
        permissions.forEach(perm => {
          const permId = `${perm.module.toLowerCase()}.${perm.action.toLowerCase()}`;
          for (const module of this.permissionModules) {
            const found = module.permissions.find(p => p.id === permId);
            if (found) found.checked = true;
          }
        });
        // this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load permissions:', err);
        this.errorMessage = err?.error?.message || 'Failed to load permissions';
        this.isLoading = false;
      }
    });
  }

  toggleModulePermissions(module: PermissionModule, checked: boolean): void {
    module.permissions.forEach(p => p.checked = checked);
  }

  isModuleFullySelected(module: PermissionModule): boolean {
    return module.permissions.every(p => p.checked);
  }

  isModulePartiallySelected(module: PermissionModule): boolean {
    const selected = module.permissions.filter(p => p.checked).length;
    return selected > 0 && selected < module.permissions.length;
  }

  get selectedPermissionsCount(): number {
    return this.permissionModules.reduce(
      (count, module) => count + module.permissions.filter(p => p.checked).length,
      0
    );
  }

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

  getFormattedPermissions(): any[] {
    const moduleMappings: Record<string, string> = {
      membership: 'MEMBERSHIP',
      coops: 'BRANCHES',
      inventory: 'INVENTORY',
      reports: 'REPORTING',
      settings: 'ACCESS_MANAGEMENT'
    };
    const actionMappings: Record<string, string> = {
      view: 'VIEW',
      create: 'CREATE',
      edit: 'EDIT',
      delete: 'DELETE',
      add: 'CREATE',
      generate: 'CREATE',
      transfer: 'EDIT',
      roles: 'EDIT'
    };
    const formatted: any[] = [];

    for (const module of this.permissionModules) {
      for (const perm of module.permissions) {
        if (perm.checked) {
          const [moduleName, actionName] = perm.id.split('.');
          const mappedModule = moduleMappings[moduleName];
          const mappedAction = actionMappings[actionName];
          if (mappedModule && mappedAction) {
            formatted.push({
              module: mappedModule,
              action: mappedAction,
              description: perm.label
            });
          } else {
            console.warn(`Skipping permission "${perm.id}" – missing mapping`);
          }
        }
      }
    }
    return formatted;
  }

  saveRole(): void {
    console.log('saveROLE called:', this.roleForm.valid);

    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }
    if (this.selectedPermissionsCount === 0) {
      alert('Please select at least one permission');
      return;
    }

    // this.isLoading = true;
    // this.errorMessage = '';

    const rolePayload = {
      name: this.roleForm.value.name,
      description: this.roleForm.value.description,
      tenantId: this.roleForm.value.tenantId
    };
    const permissionsPayload = { permissions: this.getFormattedPermissions() };
      this.router.navigate(['/platform/roles']);

    // if (this.isEditMode && this.roleId) {
    //   // UPDATE existing role
    //   this.http.post(`${API_ENDPOINTS.ACCESS.ROLES}/${this.roleId}`, rolePayload).subscribe({
    //     next: () => {
    //       // After updating role details, update permissions
    //       this.http.post(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(this.roleId!), permissionsPayload).subscribe({
    //         next: () => {
    //           this.isLoading = false;
    //           this.router.navigate(['/platform/roles']);
    //         },
    //         error: (err) => {
    //           console.error('Failed to update permissions:', err);
    //           this.isLoading = false;
    //           this.errorMessage = err?.error?.message || 'Role updated but permissions failed';
    //         }
    //       });
    //     },
    //     error: (err) => {
    //       console.error('Failed to update role:', err);
    //       this.isLoading = false;
    //       this.errorMessage = err?.error?.message || 'Failed to update role';
    //     }
    //   });
    // } else {
      // CREATE new role
      // this.http.post(API_ENDPOINTS.ACCESS.ROLES, rolePayload).subscribe({
      //   next: (roleResponse: any) => {
      //     const newRoleId = roleResponse.roleId;
      //     this.http.post(API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(newRoleId), permissionsPayload).subscribe({
      //       next: () => {
      //         this.isLoading = false;
      //         this.router.navigate(['/platform/roles'],{
      //           queryParams: { created: 'true' },
      //         });
      //       },
      //       error: (err) => {
      //         console.error('Permission assignment failed:', err);
      //         this.isLoading = false;
      //         this.errorMessage = err?.error?.message || 'Role created but permissions failed';
      //       }
      //     });
      //   },
      //   error: (err) => {
      //     console.error('Role creation failed:', err);
      //     this.isLoading = false;
      //     this.errorMessage = err?.error?.message || 'Failed to create role';
      //   }
      // });
  //   }
  }

  getSelectedPermissions(): string[] {
    const selected: string[] = [];
    this.permissionModules.forEach(module => {
      module.permissions.forEach(permission => {
        if (permission.checked) selected.push(permission.id);
      });
    });
    return selected;
  }
}