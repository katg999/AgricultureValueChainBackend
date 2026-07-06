import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { BadgeComponent }    from '../../../../shared/components/badge/badge';
import { ButtonComponent }   from '../../../../shared/components/button/button.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { AlertComponent }    from '../../../../shared/components/alert/alert.component';
import { TableColumn }       from '../../../../shared/components/table/table.component';
import {
  PlatformUsersService,
  PlatformUserDetail,
  LoginHistoryEntry,
} from '../../../../core/services/platform-users.service';

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
    AlertComponent,
  ],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private usersService = inject(PlatformUsersService);

  userId: string | null = null;
  user: PlatformUserDetail | null = null;
  loginHistory: LoginHistoryEntry[] = [];
  showSecurityAlert = true;

  loginColumns: TableColumn[] = [
    { key: 'dateTime',  label: 'DATE AND TIME', sortable: true  },
    { key: 'ipAddress', label: 'IP ADDRESS',    sortable: false },
    { key: 'device',    label: 'DEVICE / OS',   sortable: false },
    { key: 'status',    label: 'STATUS',        sortable: true  },
  ];

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    const id = this.userId ?? '1';
    this.usersService.getById(id).subscribe(u => { this.user = u ?? null; });
    this.usersService.getLoginHistory(id).subscribe(h => { this.loginHistory = h; });
  }

  goBack(): void {
    this.router.navigate(['/platform/users']);
  }

  editProfile(): void {
    this.router.navigate(['/platform/users/edit', this.userId]);
  }

  deactivateAccount(): void {
    if (!this.user) return;
    if (confirm(`Are you sure you want to deactivate ${this.user.name}'s account?`)) {
      console.log('Deactivating account…');
    }
  }

  downloadAuditLog(): void {
    console.log('Downloading audit log…');
  }

  get userInitials(): string {
    return (this.user?.name ?? '')
      .split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  get statusBadgeVariant(): 'active' | 'suspended' {
    return this.user?.status === 'active' ? 'active' : 'suspended';
  }

  getLoginStatusVariant(status: string): 'active' | 'failed' {
    return status === 'success' ? 'active' : 'failed';
  }
}
