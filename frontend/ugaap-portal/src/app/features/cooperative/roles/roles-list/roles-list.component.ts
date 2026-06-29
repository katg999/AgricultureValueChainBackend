import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { RoleCardData } from '../../../../shared/components/role-card/role-card.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent, DataTableComponent, CellDirective],
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.css'],
})
export class RolesListComponent {

  searchQuery = '';

  cols: TableColumn[] = [
    { key: 'name',             header: 'Role' },
    { key: 'type',             header: 'Type' },
    { key: 'permissionsCount', header: 'Permissions', align: 'right' },
    { key: 'usersCount',       header: 'Users',       align: 'right' },
    { key: 'actions',          header: '',            width: '80px' },
  ];

  roles: RoleCardData[] = [
    {
      id: '1',
      name: 'Platform Admin',
      description: 'Full system access with all permissions',
      permissionsCount: 48,
      usersCount: 12,
      isSystem: true,
      createdAt: '2023-01-15',
    },
    {
      id: '2',
      name: 'Cooperative Admin',
      description: 'Manage cooperative operations and members',
      permissionsCount: 32,
      usersCount: 45,
      isSystem: true,
      createdAt: '2023-01-15',
    },
    {
      id: '3',
      name: 'Logistics Manager',
      description: 'Manage inventory, shipments, and logistics',
      permissionsCount: 24,
      usersCount: 18,
      isSystem: false,
      createdAt: '2023-03-20',
    },
    {
      id: '4',
      name: 'Accountant',
      description: 'Financial reporting and transaction management',
      permissionsCount: 16,
      usersCount: 8,
      isSystem: false,
      createdAt: '2023-04-10',
    },
    {
      id: '5',
      name: 'Field Officer',
      description: 'On-ground data collection and farmer registration',
      permissionsCount: 12,
      usersCount: 67,
      isSystem: false,
      createdAt: '2024-02-05',
    },
  ];

  get filteredRoles(): RoleCardData[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.roles;
    return this.roles.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q),
    );
  }

  private toast = inject(ToastService);

  constructor(private router: Router) {}

  createNewRole(): void {
    this.router.navigate(['/cooperative/roles/create']);
  }

  editRole(role: RoleCardData): void {
    if (role.isSystem) {
      this.toast.warning('Cannot edit system role', `"${role.name}" is a built-in role and cannot be modified.`);
      return;
    }
    this.router.navigate(['/cooperative/roles', role.id, 'edit'], { state: { role } });
  }

  deleteRole(role: RoleCardData): void {
    if (role.isSystem) {
      this.toast.warning('Cannot delete system role', `"${role.name}" is a built-in role and cannot be removed.`);
      return;
    }
    if (role.usersCount > 0) {
      this.toast.error(
        'Role in use',
        `${role.usersCount} user${role.usersCount === 1 ? ' is' : 's are'} assigned to "${role.name}". Reassign them before deleting.`,
      );
      return;
    }
    if (confirm(`Delete the "${role.name}" role? This cannot be undone.`)) {
      this.roles = this.roles.filter(r => r.id !== role.id);
      this.toast.success('Role deleted', `"${role.name}" has been removed.`);
    }
  }

  viewRole(role: RoleCardData): void {
    this.router.navigate(['/cooperative/roles', role.id]);
  }

  trackById(_: number, role: RoleCardData): string {
    return role.id;
  }
}
