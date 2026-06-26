import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { RoleCardData } from '../../../../shared/components/role-card/role-card.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';

interface AssignedUser {
  id: string;
  name: string;
  email: string;
  branch: string;
  assignedAt: string;
}

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, DataTableComponent, CellDirective],
  templateUrl: './role-detail.component.html',
  styleUrl: './role-detail.component.css',
})
export class RoleDetailComponent implements OnInit {

  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  role: RoleCardData | null = null;
  users: AssignedUser[] = [];

  userCols: TableColumn[] = [
    { key: 'name',       header: 'Name' },
    { key: 'email',      header: 'Email',    class: 'muted' },
    { key: 'branch',     header: 'Branch' },
    { key: 'assignedAt', header: 'Assigned', class: 'muted' },
  ];

  // Shared mock roles — same data as roles-list
  private readonly allRoles: RoleCardData[] = [
    { id: '1', name: 'Platform Admin',      description: 'Full system access with all permissions',           permissionsCount: 48, usersCount: 12, isSystem: true,  createdAt: '2023-01-15' },
    { id: '2', name: 'Cooperative Admin',   description: 'Manage cooperative operations and members',         permissionsCount: 32, usersCount: 45, isSystem: true,  createdAt: '2023-01-15' },
    { id: '3', name: 'Logistics Manager',   description: 'Manage inventory, shipments, and logistics',        permissionsCount: 24, usersCount: 18, isSystem: false, createdAt: '2023-03-20' },
    { id: '4', name: 'Accountant',          description: 'Financial reporting and transaction management',     permissionsCount: 16, usersCount: 8,  isSystem: false, createdAt: '2023-04-10' },
    { id: '5', name: 'Field Officer',       description: 'On-ground data collection and farmer registration', permissionsCount: 12, usersCount: 67, isSystem: false, createdAt: '2024-02-05' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.role = this.allRoles.find(r => r.id === id) ?? null;

    if (this.role) {
      this.users = this.mockUsersForRole(this.role);
    }
  }

  editRole(): void {
    this.router.navigate(['/platform/roles', this.role!.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/platform/roles']);
  }

  viewUser(user: AssignedUser): void {
    this.router.navigate(['/platform/users/user', user.id]);
  }

  private mockUsersForRole(role: RoleCardData): AssignedUser[] {
    const count = Math.min(role.usersCount, 8);
    const firstNames = ['Sarah', 'James', 'Grace', 'David', 'Alice', 'Peter', 'Lydia', 'Moses'];
    const lastNames  = ['Nakato', 'Ochieng', 'Atim', 'Wafula', 'Apio', 'Ssali', 'Nambi', 'Kato'];
    const branches   = ['Kampala Branch', 'Jinja Branch', 'Mbale Branch', 'Fort Portal Branch', 'Adjumani Branch'];
    return Array.from({ length: count }, (_, i) => ({
      id: `u${i + 1}`,
      name: `${firstNames[i]} ${lastNames[i]}`,
      email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@coop.ug`,
      branch: branches[i % branches.length],
      assignedAt: '2024-01-' + String(i + 1).padStart(2, '0'),
    }));
  }
}
