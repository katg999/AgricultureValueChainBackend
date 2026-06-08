import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Shared components
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { RoleCardComponent, RoleCardData } from '../../../../shared/components/role-card/role-card.component';

/**
 * Roles List Component
 * 
 * Displays all system and custom roles with their permissions.
 * Allows creating new roles and editing existing ones.
 * 
 * Features:
 * - List of all roles (system + custom)
 * - Permission count per role
 * - Users assigned count
 * - System role badges (non-editable)
 * - Create new role button
 * - Edit/Delete actions
 * - Search roles
 * 
 * Flow:
 * Roles List → Create Role / Edit Role
 */

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonComponent,
    RoleCardComponent
  ],
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.css']
})
export class RolesListComponent implements OnInit {

  /**
   * Search query
   */
  searchQuery = '';

  /**
   * Roles data
   */
  roles: RoleCardData[] = [
    {
      id: '1',
      name: 'Platform Admin',
      description: 'Full system access with all permissions',
      permissionsCount: 48,
      usersCount: 12,
      isSystem: true,
      createdAt: '2023-01-15'
    },
    {
      id: '2',
      name: 'Cooperative Admin',
      description: 'Manage cooperative operations and members',
      permissionsCount: 32,
      usersCount: 45,
      isSystem: true,
      createdAt: '2023-01-15'
    },
    {
      id: '3',
      name: 'Logistics Manager',
      description: 'Manage inventory, shipments, and logistics',
      permissionsCount: 24,
      usersCount: 18,
      isSystem: false,
      createdAt: '2023-03-20'
    },
    {
      id: '4',
      name: 'Accountant',
      description: 'Financial reporting and transaction management',
      permissionsCount: 16,
      usersCount: 8,
      isSystem: false,
      createdAt: '2023-04-10'
    },
    {
      id: '5',
      name: 'Field Officer',
      description: 'On-ground data collection and farmer registration',
      permissionsCount: 12,
      usersCount: 67,
      isSystem: false,
      createdAt: '2024-02-05'
    }
  ];

  /**
   * Filtered roles
   */
  get filteredRoles(): RoleCardData[] {
    if (!this.searchQuery) {
      return this.roles;
    }
    
    const query = this.searchQuery.toLowerCase();
    return this.roles.filter(role =>
      role.name.toLowerCase().includes(query) ||
      role.description.toLowerCase().includes(query)
    );
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialize component
  }



  /**
   * Navigate to create role page
   * Route: /platform/roles/role-form
   */
  RoleForm(): void {
    this.router.navigate(['/platform/roles/role-form']);
  }

  /**
   * Navigate to edit role page
   * Route: /platform/roles/:id/edit
   */
  editRole(role: RoleCardData): void {
    if (role.isSystem) {
      alert('System roles cannot be edited');
      return;
    }
    this.router.navigate(['/platform/roles/role-form', role.id]);
  }

  /**
   * Delete role
   * Shows confirmation before deletion
   */
  deleteRole(role: RoleCardData): void {
    if (role.isSystem) {
      alert('System roles cannot be deleted');
      return;
    }

    if (role.usersCount > 0) {
      alert(`Cannot delete role. ${role.usersCount} users are currently assigned this role.`);
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete the "${role.name}" role?`);
    if (confirmed) return;
      console.log('Deleting role:', role.id);
      // TODO: Implement deletion API call
      // After successful deletion, remove from list:
      // this.roles = this.roles.filter(r => r.id !== role.id);
  
      //remove from local array after deletion
      this.roles = this.roles.filter(r => r.id !== role.id);
  }

  /**
   * View role details
   * Route: /platform/roles/:id
   * Note: This route is not yet implemented
   */
  viewRole(role: RoleCardData): void {
    console.log('View role details:', role);
    // TODO: Implement role details page
    // this.router.navigate(['/platform/roles', role.id]);
  }
}
