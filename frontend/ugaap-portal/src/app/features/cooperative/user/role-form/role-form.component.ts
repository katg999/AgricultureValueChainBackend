import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';   // HttpHeaders no longer needed — interceptor handles auth

// API endpoint constants — never write raw URLs in components
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';

// Shared components
import { LogoComponent }    from '../../../../shared/components/logo/logo.component';
import { InputComponent }   from '../../../../shared/components/input/input.component';
import { ButtonComponent }  from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { ToastService }      from '../../../../core/services/toast.service';


/**
 * Permission interface
 */
export interface Permission {
  id: string;
  label: string;
  checked: boolean;
}

/**
 * Permission module interface
 */
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

  errorMessage: string = '';

  permissionModules: PermissionModule[] = [
    {
      name: 'Users Management',
      icon: 'users',
      permissions: [
        { id: 'membership.view', label: 'View users', checked: false },
        { id: 'membership.create', label: 'Create users', checked: false },
        { id: 'membership.edit', label: 'Edit users', checked: false },
        { id: 'membership.delete', label: 'Delete users', checked: false }
      ]
    },
    {
      name: 'Cooperatives',
      icon: 'building',
      permissions: [
        { id: 'coops.view', label: 'View cooperatives', checked: false },
        { id: 'coops.create', label: 'Create cooperatives', checked: false },
        { id: 'coops.edit', label: 'Edit cooperatives', checked: false },
        { id: 'coops.delete', label: 'Delete cooperatives', checked: false }
      ]
    },
    {
  name: 'Financial Reports',
  icon: 'chart',
  permissions: [
    { id: 'reports.view',   label: 'View reports',     checked: false },
    { id: 'reports.create', label: 'Generate reports',  checked: false }, // mapped to CREATE
  ]
},
{
  name: 'Inventory Management',
  icon: 'box',
  permissions: [
    { id: 'inventory.view',   label: 'View inventory',   checked: false },
    { id: 'inventory.create', label: 'Add stock',         checked: false },
    { id: 'inventory.edit',   label: 'Edit/Transfer stock', checked: false },
    { id: 'inventory.delete', label: 'Delete stock',      checked: false }
  ]
},
    {
      name: 'System Settings',
      icon: 'settings',
      permissions: [
        { id: 'settings.view', label: 'View settings', checked: false },
        { id: 'settings.edit', label: 'Edit settings', checked: false },
        { id: 'settings.roles', label: 'Manage roles', checked: false }
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

cooperativeInfo: any = null;
private toast = inject(ToastService);

ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;

    this.initForm();

    // Read state passed from cooperative onboarding
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.tenantId) {
        this.cooperativeInfo = state;
        // Pre-fill tenantId
        this.roleForm.patchValue({
            tenantId: state.tenantId
        });
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
    this.roleForm.patchValue({
      name: 'Logistics Manager',
      description: 'Manage inventory, shipments, and logistics'
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
    this.router.navigate(['/roles']);
  }

  getFormattedPermissions(): any[] {
  console.log('=== getFormattedPermissions() called ===');

  const moduleMappings: any = {
    membership: 'MEMBERSHIP',
    coops: 'BRANCHES',
    inventory: 'INVENTORY',
    reports: 'REPORTING',
    settings: 'ACCESS_MANAGEMENT'
  };

  const actionMappings: any = {
  view:     'VIEW',
  create:   'CREATE',
  edit:     'EDIT',
  delete:   'DELETE',
  add:      'CREATE',   // inventory "Add stock" → CREATE
  export:   'VIEW',     // closest valid action for exporting
  generate: 'CREATE',   // generating a report → CREATE
  transfer: 'EDIT',     // transferring stock → EDIT
  roles:    'EDIT'      // managing roles → EDIT
};

  console.log('moduleMappings:', moduleMappings);
  console.log('actionMappings:', actionMappings);

  const formatted: any[] = [];

  this.permissionModules.forEach(module => {
    console.log(`\n--- Processing module: "${module.name}" ---`);

    module.permissions.forEach(permission => {
      console.log(`  Permission: id="${permission.id}", label="${permission.label}", checked=${permission.checked}`);

      if (permission.checked) {
        const parts = permission.id.split('.');
        console.log(`    Split result:`, parts, `(length: ${parts.length})`);

        const moduleName = parts[0];
        const actionName = parts[1];
        console.log(`    moduleName="${moduleName}", actionName="${actionName}"`);

        const mappedModule = moduleMappings[moduleName];
        const mappedAction = actionMappings[actionName];
        console.log(`    mappedModule="${mappedModule}", mappedAction="${mappedAction}"`);

        if (!mappedModule) {
          console.error(`    ❌ NO MAPPING FOUND for moduleName="${moduleName}" in moduleMappings! This will cause a backend NPE.`);
        }

        if (!mappedAction) {
          console.error(`    ❌ NO MAPPING FOUND for actionName="${actionName}" in actionMappings! This will cause a backend NPE.`);
        }

        if (!mappedModule || !mappedAction) {
          console.warn(`    ⚠️ Skipping permission "${permission.id}" due to missing mapping.`);
          return;
        }

        const entry = {
          module: mappedModule,
          action: mappedAction,
          description: permission.label
        };

        console.log(`    ✅ Mapped successfully:`, entry);
        formatted.push(entry);
      }
    });
  });

  console.log('\n=== Final formatted permissions payload ===');
  console.log(JSON.stringify(formatted, null, 2));
  console.log(`Total: ${formatted.length} permission(s) to be sent`);

  return formatted;
}

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

  // Token is attached automatically by authInterceptor — no manual header needed
  const rolePayload = {
    name:        this.roleForm.value.name,
    description: this.roleForm.value.description,
    tenantId:    this.roleForm.value.tenantId,
  };

  // STEP 1: CREATE ROLE — POST /api/v1/access/roles
  this.http.post(
    API_ENDPOINTS.ACCESS.ROLES,
    rolePayload,
  ).subscribe({

    next: (roleResponse: any) => {

      const roleId = roleResponse.roleId;

      const permissionsPayload = {
        permissions: this.getFormattedPermissions(),
      };

      // STEP 2: ASSIGN PERMISSIONS — POST /api/v1/access/roles/:id/permissions
      this.http.post(
        API_ENDPOINTS.ACCESS.ROLE_PERMISSIONS(roleId),
        permissionsPayload,
      ).subscribe({

        next: (permResponse: any) => {

          console.log('Role + permissions created:', permResponse);

          this.isLoading = false;

          this.router.navigate(['/cooperatives']);
        },

        error: (err) => {

          console.error('Permission assignment failed:', err);

          this.isLoading = false;

          this.errorMessage =
            err?.error?.message ||
            err?.message ||
            'Role created but failed to assign permissions';
        }
      });
    },

    error: (err) => {

      console.error('Role creation failed:', err);

      this.isLoading = false;

      this.errorMessage =
        err?.error?.message ||
        err?.message ||
        'Failed to create role';
    }
  });
}

  getSelectedPermissions(): string[] {

    const selected: string[] = [];

    this.permissionModules.forEach(module => {
      module.permissions.forEach(permission => {
        if (permission.checked) {
          selected.push(permission.id);
        }
      });
    });

    return selected;
  }
}