import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';
import { BadgeComponent }     from '../../../../shared/components/badge/badge';
import { ButtonComponent }    from '../../../../shared/components/button/button.component';
import { ToastService }       from '../../../../core/services/toast.service';

export interface User {
  id:           string;
  name:         string;
  email:        string;
  phone:        string;
  role:         string;
  organization: string;
  lastLogin:    string;
}

type BadgeVariant = 'info' | 'active' | 'pending' | 'inactive' | 'suspended' |
                    'overdue' | 'settled' | 'partial' | 'verified' |
                    'failed' | 'draft' | 'open' | 'closed' | 'healthy' | 'low';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatsCardComponent, BadgeComponent, ButtonComponent],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
})
export class UsersListComponent implements OnInit {

  private router = inject(Router);
  private toast  = inject(ToastService);

  searchQuery         = '';
  selectedRole        = 'All Roles';
  selectedCooperation = 'All Cooperations';
  currentPage         = 1;
  itemsPerPage        = 4;
  totalItems          = 12;

  readonly roleOptions        = ['All Roles', 'MANAGER', 'COOPERATIVE ADMIN', 'LOGISTICS MANAGER', 'ACCOUNTANT'];
  readonly cooperationOptions = ['All Cooperations', 'UGAAP Central', 'Kasese Coffee Coop', 'Mubende Warehouse Central'];

  users: User[] = [
    { id: '1', name: 'Sarah Namubiru',   email: 's.namubiru@ugaap.co.ug',  phone: '+256 701 445 678', role: 'COOPERATIVE ADMIN', organization: 'UGAAP Central',            lastLogin: '2 mins ago' },
    { id: '2', name: 'James Okello',     email: 'j.okello@ugaap.co.ug',    phone: '+256 754 123 456', role: 'LOGISTICS MANAGER', organization: 'Kasese Coffee Coop',        lastLogin: '1 hour ago' },
    { id: '3', name: 'Mary Atim',        email: 'm.atim@ugaap.co.ug',      phone: '+256 772 987 654', role: 'ACCOUNTANT',        organization: 'Mubende Warehouse Central', lastLogin: 'Yesterday'  },
    { id: '4', name: 'Robert Ssemakula', email: 'r.ssemakula@ugaap.co.ug', phone: '+256 700 654 321', role: 'COOPERATIVE ADMIN', organization: 'Kasese Coffee Coop',        lastLogin: '3 days ago' },
  ];

  ngOnInit(): void {}

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
