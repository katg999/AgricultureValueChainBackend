import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../../shared/components/data-table/cell.directive';
import { PlatformUsersService, PlatformUser } from '../../../../core/services/platform-users.service';

export type { PlatformUser as User };

type BadgeVariant = 'info' | 'active' | 'pending' | 'inactive' | 'suspended' |
                    'overdue' | 'settled' | 'partial' | 'verified' |
                    'failed' | 'draft' | 'open' | 'closed' | 'healthy' | 'low';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StatCardComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    CellDirective,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {

  private usersService = inject(PlatformUsersService);

  searchQuery          = '';
  selectedRole         = 'All Roles';
  selectedCooperation  = 'All Cooperations';

  roleOptions = ['All Roles', 'PLATFORM ADMIN', 'COOPERATIVE ADMIN', 'LOGISTICS MANAGER', 'ACCOUNTANT'];
  cooperationOptions = ['All Cooperations', 'UGAAP Central', 'Kasese Coffee Coop', 'Mubende Warehouse Central'];

  userCols: TableColumn[] = [
    { key: 'name',         header: 'NAME' },
    { key: 'email',        header: 'EMAIL' },
    { key: 'phone',        header: 'PHONE NUMBER' },
    { key: 'role',         header: 'ROLE' },
    { key: 'organization', header: 'ORGANISATION' },
    { key: 'lastLogin',    header: 'LAST LOGIN' },
    { key: 'actions',      header: 'ACTIONS', width: '80px' },
  ];

  users: PlatformUser[] = [];

  currentPage = 1;
  readonly itemsPerPage = 5;

  get filteredUsers(): PlatformUser[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.organization.toLowerCase().includes(q),
    );
  }

  get paginatedUsers(): PlatformUser[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  get totalItems(): number { return this.filteredUsers.length; }

  get startIndex(): number { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }

  get endIndex(): number { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }

  get pagesArray(): number[] {
    return Array.from({ length: Math.max(Math.ceil(this.totalItems / this.itemsPerPage), 1) }, (_, i) => i + 1);
  }

  goToPage(page: number): void { this.currentPage = page; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.endIndex < this.totalItems) this.currentPage++; }

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.usersService.list().subscribe(users => { this.users = users; });
  }

  /**
   * Navigate to add user page
   */
  addNewUser(): void {
    this.router.navigate(['/platform/users/add-user']);
  }

  onRowClicked(user: PlatformUser): void {
    this.router.navigate(['/platform/users/user', user.id]);
  }

  onSortChanged(event: { column: string; direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', event);
  }

  onSearch(): void { this.currentPage = 1; }
  onRoleFilterChange(): void { /* TODO: filter */ }
  onCooperationFilterChange(): void { /* TODO: filter */ }

  viewUser(user: PlatformUser, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/platform/users/user', user.id]);
  }

  moreActions(user: PlatformUser, event: Event): void {
    event.stopPropagation();
    this.toggleActionsMenu(user);
  }

  getRoleBadgeVariant(_role: string): BadgeVariant { return 'info'; }

  getUserInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  selectedUser: PlatformUser | null = null;

  toggleActionsMenu(user: PlatformUser): void {
    this.selectedUser = this.selectedUser === user ? null : user;
  }

  editUser(user: PlatformUser): void {
    this.selectedUser = null;
    this.router.navigate(['/platform/users/edit', user.id]);
  }

  deleteUser(user: PlatformUser): void {
    this.selectedUser = null;
    if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
      this.usersService.delete(user.id).subscribe(() => {
        this.users = this.users.filter(u => u.id !== user.id);
      });
    }
  }
}
