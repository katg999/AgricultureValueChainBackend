import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { RoleCardData } from '../../../../shared/components/role-card/role-card.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { ToastService } from '../../../../core/services/toast.service';
import { RolesService, RoleRecord } from '../../../../core/services/roles.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent, DataTableComponent, CellDirective],
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.css'],
})
export class RolesListComponent implements OnInit {

  private router       = inject(Router);
  private toast        = inject(ToastService);
  private rolesService = inject(RolesService);

  searchQuery = '';
  roles: RoleRecord[] = [];

  cols: TableColumn[] = [
    { key: 'name',             header: 'Role' },
    { key: 'type',             header: 'Type' },
    { key: 'permissionsCount', header: 'Permissions', align: 'right' },
    { key: 'usersCount',       header: 'Users',       align: 'right' },
    { key: 'actions',          header: '',            width: '80px' },
  ];

  ngOnInit(): void {
    this.rolesService.roles$.subscribe(roles => this.roles = roles);
    this.rolesService.list().subscribe({
      error: () => this.toast.error('Failed to load roles', 'Could not reach the server. Please try again.'),
    });
  }

  get filteredRoles(): RoleRecord[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.roles;
    return this.roles.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q),
    );
  }

  createNewRole(): void {
    this.router.navigate(['/cooperative/roles/create']);
  }

  editRole(role: RoleRecord): void {
    if (role.isSystem) {
      this.toast.warning('Cannot edit system role', `"${role.name}" is a built-in role and cannot be modified.`);
      return;
    }
    this.router.navigate(['/cooperative/roles', role.id, 'edit'], { state: { role } });
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
      this.rolesService.deleteRole(role.id).subscribe({
        next: () => this.toast.success('Role deleted', `"${role.name}" has been removed.`),
        error: () => this.toast.error('Delete failed', `Could not delete "${role.name}". Please try again.`),
      });
    }
  }

  viewRole(role: RoleRecord): void {
    this.router.navigate(['/cooperative/roles', role.id]);
  }

  trackById(_: number, role: RoleRecord): string {
    return role.id;
  }
}
