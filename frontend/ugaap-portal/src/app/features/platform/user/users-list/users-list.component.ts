import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Shared components
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';
import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

/**
 * User interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  lastLogin: string;
  avatar?: string;
}

/**
 * Allowed badge variants used by getRoleBadgeVariant
 */
type BadgeVariant = 'info' | 'active' | 'pending' | 'inactive' | 'suspended' | 
                    'overdue' | 'settled' | 'partial' | 'verified' | 
                    'failed' | 'draft' | 'open' | 'closed' | 'healthy' | 'low';

/**
 * Users List Component
 * 
 * Displays all platform and cooperative admin users in a table.
 * Features search, filtering, pagination, and quick actions.
 * 
 * Features:
 * - Statistics cards (Total, Active, Inactive, Locked)
 * - Search by name, ID, or manager
 * - Filter by role and cooperation
 * - Sortable table columns
 * - Pagination
 * - Row actions (view, edit, delete)
 * - Add new user button
 * 
 * Flow:
 * List → Add User / View User Details
 */
@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StatsCardComponent,
    // TableComponent,
    BadgeComponent,
    ButtonComponent
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {

  /**
   * Search query
   */
  searchQuery = '';

  /**
   * Selected role filter
   */
  selectedRole = 'All Roles';

  /**
   * Selected cooperation filter
   */
  selectedCooperation = 'All Cooperations';

  /**
   * Role options
   */
  roleOptions = [
    'All Roles',
    'PLATFORM ADMIN',
    'COOPERATIVE ADMIN',
    'LOGISTICS MANAGER',
    'ACCOUNTANT'
  ];

  /**
   * Cooperation options
   */
  cooperationOptions = [
    'All Cooperations',
    'UGAAP Central',
    'Kasese Coffee Coop',
    'Mubende Warehouse Central'
  ];

  /**
   * Table columns configuration
   */
  tableColumns: TableColumn[] = [
    { key: 'name', label: 'NAME', sortable: true },
    { key: 'email', label: 'EMAIL', sortable: true },
    { key: 'phone', label: 'PHONE NUMBER', sortable: false },
    { key: 'role', label: 'ROLE', sortable: true },
    { key: 'organization', label: 'ORGANISATION', sortable: true },
    { key: 'lastLogin', label: 'LAST LOGIN', sortable: true },
    { key: 'actions', label: 'ACTIONS', sortable: false }
  ];

  /**
   * Users data
   */
  users: User[] = [
    {
      id: '1',
      name: 'Sarah Namubiru',
      email: 's.namubiru@ugaap-ug',
      phone: '+25670144567­8',
      role: 'PLATFORM ADMIN',
      organization: 'UGAAP Central',
      lastLogin: '2 mins ago'
    },
    {
      id: '2',
      name: 'Sarah Namubiru',
      email: 's.namubiru@ugaap-ug',
      phone: '+25670144567­8',
      role: 'COOPERATIVE ADMIN',
      organization: 'Kasese Coffee Coop',
      lastLogin: '2 mins ago'
    },
    {
      id: '3',
      name: 'Sarah Namubiru',
      email: 's.namubiru@ugaap-ug',
      phone: '+25670144567­8',
      role: 'PLATFORM ADMIN',
      organization: 'UGAAP Central',
      lastLogin: '2 mins ago'
    },
    {
      id: '4',
      name: 'Sarah Namubiru',
      email: 's.namubiru@ugaap-ug',
      phone: '+25670144567­8',
      role: 'COOPERATIVE ADMIN',
      organization: 'Kasese Coffee Coop',
      lastLogin: '2 mins ago'
    }
  ];

  /**
   * Loading state
   */
  isLoading = false;

  /**
   * Current page
   */
  currentPage = 1;

  /**
   * Total items
   */
  totalItems = 12;

  /**
   * Items per page
   */
  itemsPerPage = 4;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialize component
  }

  /**
   * Navigate to add user page
   */
  addNewUser(): void {
    this.router.navigate(['/platform/users/add-user']);
  }

  /**
   * Handle table row click
   */
  onRowClicked(user: User): void {
    this.router.navigate(['/platform/users/user', user.id]);
  }

  /**
   * Handle sort change
   */
  onSortChanged(event: { column: string; direction: 'asc' | 'desc' }): void {
    console.log('Sort changed:', event);
    // TODO: Implement sorting
  }

  /**
   * Handle search
   */
  onSearch(): void {
    console.log('Search:', this.searchQuery);
    // TODO: Implement search
  }

  /**
   * Handle role filter change
   */
  onRoleFilterChange(): void {
    console.log('Role filter:', this.selectedRole);
    // TODO: Implement filtering
  }

  /**
   * Handle cooperation filter change
   */
  onCooperationFilterChange(): void {
    console.log('Cooperation filter:', this.selectedCooperation);
    // TODO: Implement filtering
  }

  /**
   * View user details
   */
  viewUser(user: User, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/platform/users/user', user.id]);
  }

  /**
   * More actions menu
   */
  moreActions(user: User, event: Event): void {
    event.stopPropagation();
    console.log('More actions for:', user);
    // TODO: Implement actions menu
  }

/**
 * Get role badge variant
 */
getRoleBadgeVariant(role: string): BadgeVariant {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'active';
    case 'moderator':
      return 'info';
    case 'user':
      return 'healthy';
    // Add more mappings...
    default:
      return 'info';   // fallback that exists in the union
  }
}

  /**
   * Get user initials for avatar
   */
  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
