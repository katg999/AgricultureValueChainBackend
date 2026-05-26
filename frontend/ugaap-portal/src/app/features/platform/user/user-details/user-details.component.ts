import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

// Shared components
import { BadgeComponent }    from '../../../../shared/components/badge/badge';
import { ButtonComponent }   from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { AlertComponent }    from '../../../../shared/components/alert/alert.component';
// TableColumn is used as a type for loginColumns; TableComponent is rendered via the template
import { TableColumn }       from '../../../../shared/components/table/table.component';

/**
 * Login history entry
 */
export interface LoginHistory {
  dateTime: string;
  ipAddress: string;
  device: string;
  status: 'success' | 'failed';
}

/**
 * User Details Component
 * 
 * Displays detailed user profile information.
 * Shows personal details, account access, and login history.
 * 
 * Sections:
 * 1. Header - User photo, name, email, status badge
 * 2. Personal Details - Full info with labels
 * 3. Account Access - Role, cooperative, 2FA status, password info
 * 4. Recent Login History - Table of last 5 logins
 * 
 * Features:
 * - User status badge (Active/Inactive)
 * - Edit profile button
 * - Deactivate account button
 * - Security alerts
 * - Login history table with status
 * - Download full audit log
 * - Breadcrumb navigation
 * 
 * Flow:
 * User List → User Details → Edit / Deactivate
 */
@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BadgeComponent,
    ButtonComponent,
    InfoCardComponent,
    AlertComponent
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {

  /**
   * User ID from route
   */
  userId: string | null = null;

  /**
   * User details
   */
  user = {
    name: 'Sarah Namubiru',
    email: 's.namubiru@ugaap-logistics.ug',
    phone: '+256 772 458 902',
    nationalId: 'CM8902•••••24X',
    dateOfBirth: '14 May 1988',
    dateRegistered: '02 January 2023',
    lastLogin: '2024-05-24 09:14:22',
    role: 'Logistics Manager',
    cooperative: 'Mubende Warehouse Central',
    twoFAStatus: 'Enabled',
    lastPasswordChange: '04 April 2024',
    failedLoginAttempts: 0,
    status: 'active' as 'active' | 'inactive',
    avatar: ''
  };

  /**
   * Login history table columns
   */
  loginColumns: TableColumn[] = [
    { key: 'dateTime', label: 'DATE AND TIME', sortable: true },
    { key: 'ipAddress', label: 'IP ADDRESS', sortable: false },
    { key: 'device', label: 'DEVICE / OS', sortable: false },
    { key: 'status', label: 'STATUS', sortable: true }
  ];

  /**
   * Login history data
   */
  loginHistory: LoginHistory[] = [
    {
      dateTime: '2024-05-24 09:14:22',
      ipAddress: '197.232.44.112',
      device: 'MacBook Pro · Chrome 125',
      status: 'success'
    },
    {
      dateTime: '2024-05-23 18:22:05',
      ipAddress: '197.232.44.112',
      device: 'iPhone 15 Pro · Safari Mobile',
      status: 'success'
    },
    {
      dateTime: '2024-05-23 18:21:44',
      ipAddress: '197.232.44.112',
      device: 'iPhone 15 Pro · Safari Mobile',
      status: 'failed'
    },
    {
      dateTime: '2024-05-22 08:45:10',
      ipAddress: '41.210.154.38',
      device: 'MacBook Pro · Chrome 125',
      status: 'success'
    },
    {
      dateTime: '2024-05-21 14:30:55',
      ipAddress: '41.210.154.38',
      device: 'iPad Pro · Chrome iOS',
      status: 'success'
    }
  ];

  /**
   * Show security alert if password not rotated
   */
  showSecurityAlert = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    // TODO: Load user details from API
  }

  /**
   * Navigate back to users list
   */
  goBack(): void {
    this.router.navigate(['/users']);
  }

  /**
   * Edit user profile
   */
  editProfile(): void {
    this.router.navigate(['/users', this.userId, 'edit']);
  }

  /**
   * Deactivate user account
   */
  deactivateAccount(): void {
    const confirmed = confirm(`Are you sure you want to deactivate ${this.user.name}'s account?`);
    if (confirmed) {
      console.log('Deactivating account...');
      // TODO: Implement deactivation
    }
  }

  /**
   * Download full audit log
   */
  downloadAuditLog(): void {
    console.log('Downloading audit log...');
    // TODO: Implement download
  }

  /**
   * Get user initials
   */
  get userInitials(): string {
    return this.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Get status badge variant
   */
  get statusBadgeVariant(): 'active' | 'suspended' {
    return this.user.status === 'active' ? 'active' : 'suspended';
  }

  /**
   * Get login status badge variant
   */
  getLoginStatusVariant(status: string): 'active' | 'failed' {
    return status === 'success' ? 'active' : 'failed';
  }
}
