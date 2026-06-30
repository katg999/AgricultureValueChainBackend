import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { BadgeComponent }    from '../../../../shared/components/badge/badge';
import { ButtonComponent }   from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { AlertComponent }    from '../../../../shared/components/alert/alert.component';
import { TableColumn }       from '../../../../shared/components/table/table.component';
import { ToastService }      from '../../../../core/services/toast.service';
import { UsersService, User, UserStatus, LoginHistoryEntry } from '../users.service';

export type { LoginHistoryEntry as LoginHistory };

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

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(UsersService);
  private toast = inject(ToastService);

  userId: string | null = null;
  user: User | null = null;
  isLoading = true;
  loginHistory: LoginHistoryEntry[] = [];
  showSecurityAlert = true;

  loginColumns: TableColumn[] = [
    { key: 'dateTime',  label: 'DATE AND TIME',  sortable: true  },
    { key: 'ipAddress', label: 'IP ADDRESS',      sortable: false },
    { key: 'device',    label: 'DEVICE / OS',     sortable: false },
    { key: 'status',    label: 'STATUS',          sortable: true  },
  ];

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (!this.userId) {
      this.router.navigate(['/cooperative/users']);
      return;
    }
    this.usersService.getLoginHistory(this.userId).subscribe(h => { this.loginHistory = h; });
    this.usersService.getById(this.userId).subscribe({
      next: user => {
        this.isLoading = false;
        if (!user) {
          this.toast.error('User not found', 'The user you are looking for does not exist.');
          this.router.navigate(['/cooperative/users']);
          return;
        }
        this.user = user;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to load user', 'Could not retrieve user details.');
        this.router.navigate(['/cooperative/users']);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/cooperative/users']);
  }

  editProfile(): void {
    this.router.navigate(['/cooperative/users', this.userId, 'edit']);
  }

  deactivateAccount(): void {
    if (!this.user) return;
    const confirmed = confirm(`Are you sure you want to deactivate ${this.user.name}'s account?`);
    if (!confirmed) return;
    const next: UserStatus = this.user.status === 'active' ? 'inactive' : 'active';
    this.usersService.setStatus(this.user.id, next).subscribe({
      next: () => {
        if (this.user) this.user = { ...this.user, status: next };
        this.toast.success(
          next === 'active' ? 'Account reactivated' : 'Account deactivated',
          `${this.user?.name} is now ${next}.`,
        );
      },
      error: () => this.toast.error('Action failed', 'Could not update account status.'),
    });
  }

  downloadAuditLog(): void {
    this.toast.info('Coming soon', 'Audit log download will be available shortly.');
  }

  get userInitials(): string {
    return (this.user?.name ?? '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  get statusBadgeVariant(): 'active' | 'suspended' {
    return this.user?.status === 'active' ? 'active' : 'suspended';
  }

  getLoginStatusVariant(status: string): 'active' | 'failed' {
    return status === 'success' ? 'active' : 'failed';
  }
}
