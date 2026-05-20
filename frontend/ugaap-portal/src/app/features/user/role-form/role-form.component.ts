import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

// Shared components
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';

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
  icon: string;  // ← FIXED: Added icon property
  permissions: Permission[];
}

/**
 * Create/Edit Role Component
 * 
 * Form for creating new roles or editing existing ones.
 * Allows setting role name, description, and granular permissions.
 * 
 * Features:
 * - Role name and description
 * - Permission modules (Users, Cooperatives, Inventory, Reports)
 * - Checkbox permissions per module
 * - Select all/none per module
 * - Form validation
 * - Save/Cancel actions
 * 
 * Flow:
 * Roles List → Create/Edit Role → Save → Roles List
 */
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

  /**
   * Role ID (for edit mode)
   */
  roleId: string | null = null;

  /**
   * Edit mode flag
   */
  isEditMode = false;

  /**
   * Role form
   */
  roleForm!: FormGroup;

  /**
   * Permission modules
   */
  permissionModules: PermissionModule[] = [
    {
      name: 'Users Management',
      icon: '👥',
      permissions: [
        { id: 'users.view', label: 'View users', checked: false },
        { id: 'users.create', label: 'Create users', checked: false },
        { id: 'users.edit', label: 'Edit users', checked: false },
        { id: 'users.delete', label: 'Delete users', checked: false }
      ]
    },
    {
      name: 'Cooperatives',
      icon: '🏢',
      permissions: [
        { id: 'coops.view', label: 'View cooperatives', checked: false },
        { id: 'coops.create', label: 'Create cooperatives', checked: false },
        { id: 'coops.edit', label: 'Edit cooperatives', checked: false },
        { id: 'coops.delete', label: 'Delete cooperatives', checked: false }
      ]
    },
    {
      name: 'Inventory Management',
      icon: '📦',
      permissions: [
        { id: 'inventory.view', label: 'View inventory', checked: false },
        { id: 'inventory.add', label: 'Add stock', checked: false },
        { id: 'inventory.edit', label: 'Edit stock', checked: false },
        { id: 'inventory.delete', label: 'Delete stock', checked: false },
        { id: 'inventory.transfer', label: 'Transfer stock', checked: false }
      ]
    },
    {
      name: 'Financial Reports',
      icon: '📊',
      permissions: [
        { id: 'reports.view', label: 'View reports', checked: false },
        { id: 'reports.export', label: 'Export reports', checked: false },
        { id: 'reports.generate', label: 'Generate reports', checked: false }
      ]
    },
    {
      name: 'System Settings',
      icon: '⚙️',
      permissions: [
        { id: 'settings.view', label: 'View settings', checked: false },
        { id: 'settings.edit', label: 'Edit settings', checked: false },
        { id: 'settings.roles', label: 'Manage roles', checked: false }
      ]
    }
  ];

  /**
   * Loading state
   */
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;
    
    this.initForm();

    if (this.isEditMode) {
      this.loadRoleData();
    }
  }

  /**
   * Initialize form
   */
  initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]]
    });
  }

  /**
   * Load role data for editing
   */
  loadRoleData(): void {
    // TODO: Load from API
    // Mock data for demo
    this.roleForm.patchValue({
      name: 'Logistics Manager',
      description: 'Manage inventory, shipments, and logistics'
    });

    // Check some permissions
    this.permissionModules[2].permissions[0].checked = true; // View inventory
    this.permissionModules[2].permissions[1].checked = true; // Add stock
    this.permissionModules[2].permissions[2].checked = true; // Edit stock
  }

  /**
   * Toggle all permissions in a module
   */
  toggleModulePermissions(module: PermissionModule, checked: boolean): void {
    module.permissions.forEach(p => p.checked = checked);
  }

  /**
   * Check if all permissions in module are selected
   */
  isModuleFullySelected(module: PermissionModule): boolean {
    return module.permissions.every(p => p.checked);
  }

  /**
   * Check if some permissions in module are selected
   */
  isModulePartiallySelected(module: PermissionModule): boolean {
    const selected = module.permissions.filter(p => p.checked).length;
    return selected > 0 && selected < module.permissions.length;
  }

  /**
   * Get total selected permissions count
   */
  get selectedPermissionsCount(): number {
    return this.permissionModules.reduce(
      (count, module) => count + module.permissions.filter(p => p.checked).length,
      0
    );
  }

  /**
   * Get form field error
   */
  getFieldError(fieldName: string): string {
    const control = this.roleForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
    }
    return '';
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    this.router.navigate(['/roles']);
  }

  /**
   * Save role
   */
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

    const roleData = {
      ...this.roleForm.value,
      permissions: this.getSelectedPermissions()
    };

    console.log('Saving role:', roleData);

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/roles']);
    }, 2000);
  }

  /**
   * Get selected permissions IDs
   */
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
