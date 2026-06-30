import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { from } from 'rxjs';
import { fetchRoleFilterOptions, fetchCooperationOptions } from '../../../../core/mock/mock-reference-data';

import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { BadgeComponent }     from '../../../../shared/components/badge/badge';
import { ButtonComponent }    from '../../../../shared/components/button/button.component';
import { ToastService }       from '../../../../core/services/toast.service';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { UsersService, User } from '../users.service';

type BadgeVariant = 'info' | 'active' | 'pending' | 'inactive' | 'suspended' |
                    'overdue' | 'settled' | 'partial' | 'verified' |
                    'failed' | 'draft' | 'open' | 'closed' | 'healthy' | 'low';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent, BadgeComponent, ButtonComponent, DataTableComponent, CellDirective],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
})
export class UsersListComponent implements OnInit {

  private usersService = inject(UsersService);
  private router = inject(Router);
  private toast  = inject(ToastService);

  searchQuery         = '';
  selectedRole        = 'All Roles';
  selectedCooperation = 'All Cooperations';
  currentPage         = 1;
  itemsPerPage        = 4;
  totalItems          = 12;

  roleOptions:        string[] = [];
  cooperationOptions: string[] = [];

  cols: TableColumn[] = [
    { key: 'name',         header: 'NAME' },
    { key: 'email',        header: 'EMAIL',        class: 'text-muted' },
    { key: 'phone',        header: 'PHONE NUMBER', class: 'text-muted' },
    { key: 'role',         header: 'ROLE' },
    { key: 'organization', header: 'ORGANISATION' },
    { key: 'lastLogin',    header: 'LAST LOGIN',   class: 'text-muted' },
    { key: 'actions',      header: 'ACTIONS' },
  ];

  users: User[] = [];

  ngOnInit(): void {
    // Load filter dropdown options from async mock fetch (swap for real HTTP calls when API is ready)
    from(fetchRoleFilterOptions()).subscribe(v   => this.roleOptions        = v);
    from(fetchCooperationOptions()).subscribe(v  => this.cooperationOptions = v);

    this.usersService.users$.subscribe(users => this.users = users);
    this.usersService.list().subscribe({
      error: () => this.toast.error('Failed to load users', 'Could not reach the server. Please try again.'),
    });
  }

  addNewUser(): void {
    this.router.navigate(['/cooperative/users/add-user']);
  }

  onRowClicked(user: User): void {
    this.router.navigate(['/cooperative/users/user', user.id]);
  }

  viewUser(user: User, e: Event): void {
    e.stopPropagation();
    this.router.navigate(['/cooperative/users/user', user.id]);
  }

  moreActions(user: User, e: Event): void {
    e.stopPropagation();
    this.toast.info('Coming soon', `Actions menu for ${user.name} will be available shortly.`);
  }

  onSearch(): void {}
  onRoleFilterChange(): void {}
  onCooperationFilterChange(): void {}

  getRoleBadgeVariant(role: string): BadgeVariant {
    const r = role?.toLowerCase();
    if (r?.includes('admin'))     return 'active';
    if (r?.includes('logistics')) return 'info';
    if (r?.includes('account'))   return 'pending';
    return 'info';
  }

  getUserInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}
