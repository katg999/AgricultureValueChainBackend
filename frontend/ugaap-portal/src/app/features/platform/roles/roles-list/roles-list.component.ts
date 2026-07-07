import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { StatCardComponent, StatCardData } from '../../../../shared/components/stat-card/stat-card.component';
import { RoleCardData } from '../../../../shared/components/role-card/role-card.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { RolesService, RoleRecord } from '../../../../core/services/roles.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonComponent,
    InputComponent,
    StatCardComponent,
    DataTableComponent,
    CellDirective,
  ],
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.css']
})
export class RolesListComponent implements OnInit {

  searchQuery = '';
  stats: StatCardData[] = [];

  cols: TableColumn[] = [
    { key: 'name',             header: 'Role' },
    { key: 'type',             header: 'Type' },
    { key: 'permissionsCount', header: 'Permissions', align: 'right' },
    { key: 'usersCount',       header: 'Users',       align: 'right' },
    { key: 'actions',          header: '',            width: '80px' },
  ];

  roles: RoleRecord[] = [];

  private buildStats(): StatCardData[] {
    const systemCount = this.roles.filter(r => r.isSystem).length;
    const customCount = this.roles.filter(r => !r.isSystem).length;
    const totalUsers  = this.roles.reduce((sum, r) => sum + r.usersCount, 0);
    return [
      {
        label:  'Total Roles',
        value:  this.roles.length,
        icon:   'shield',
        trend:  'All role definitions',
        status: 'active',
      },
      {
        label:  'System Roles',
        value:  systemCount,
        icon:   'settings',
        trend:  'Built-in · read-only',
        status: 'active',
      },
      {
        label:  'Custom Roles',
        value:  customCount,
        icon:   'clipboard',
        trend:  'Editable by admins',
        status: 'active',
      },
      {
        label:     'Users Assigned',
        value:     totalUsers,
        icon:      'users',
        trend:     'Tap to view all users',
        trendUp:   true,
        status:    'active',
        clickable: true,
        route:     '/platform/users',
      },
    ];
  }

  get filteredRoles(): RoleCardData[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.roles;
    return this.roles.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q),
    );
  }

  private toast = inject(ToastService);
  private rolesService = inject(RolesService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.rolesService.list().subscribe(roles => {
      this.roles = roles;
      this.stats = this.buildStats();
    });
  }

  createNewRole(): void {
    this.router.navigate(['/platform/roles/create']);
  }

  editRole(role: RoleRecord): void {
    if (role.isSystem) {
      this.toast.warning('Cannot edit system role', `"${role.name}" is a built-in role and cannot be modified.`);
      return;
    }
    this.router.navigate(['/platform/roles', role.id, 'edit']);
  }

  deleteRole(role: RoleRecord): void {
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
      this.stats = this.buildStats();
      this.toast.success('Role deleted', `"${role.name}" has been removed.`);
    }
  }

  viewRole(role: RoleRecord): void {
    this.router.navigate(['/platform/roles', role.id]);
  }

  trackById(_: number, role: RoleRecord): string {
    return role.id;
  }
}