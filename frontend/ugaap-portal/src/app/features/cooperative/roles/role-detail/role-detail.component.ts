import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { RoleCardData } from '../../../../shared/components/role-card/role-card.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { RolesService, AssignedUser } from '../../../../core/services/roles.service';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, DataTableComponent, CellDirective],
  templateUrl: './role-detail.component.html',
  styleUrl: './role-detail.component.css',
})
export class RoleDetailComponent implements OnInit {

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private rolesService = inject(RolesService);

  role: RoleCardData | null = null;
  users: AssignedUser[] = [];

  userCols: TableColumn[] = [
    { key: 'name',       header: 'Name' },
    { key: 'email',      header: 'Email',    class: 'muted' },
    { key: 'branch',     header: 'Branch' },
    { key: 'assignedAt', header: 'Assigned', class: 'muted' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.role = this.rolesService.findById(id) as RoleCardData ?? null;

    if (this.role) {
      this.users = this.rolesService.getUsersForRole(this.role.usersCount);
    }
  }

  editRole(): void {
    this.router.navigate(['/cooperative/roles', this.role!.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/cooperative/roles']);
  }

  viewUser(user: AssignedUser): void {
    this.router.navigate(['/cooperative/users', user.id]);
  }
}
