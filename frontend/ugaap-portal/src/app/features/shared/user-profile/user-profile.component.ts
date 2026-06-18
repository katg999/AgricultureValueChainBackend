// features/shared/user-profile/user-profile.component.ts
//
// "My Profile" — the logged-in user's own account page, shared by every area
// (platform / cooperative / branch). Reached from the sidebar user chip.
// Shows identity, role and granted permissions; password changes reuse the
// existing forgot-password flow.

import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SessionService } from '../../../core/services/session.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { PERMISSION_CATALOG } from '../../../core/constants/permissions';

interface PermissionGroup {
  service: string;
  granted: string[];
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, InfoCardComponent, ButtonComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent {

  private session = inject(SessionService);
  private permissions = inject(PermissionsService);
  private router = inject(Router);

  readonly user = this.session.currentUser;
  readonly isFullAccess = this.permissions.isFullAccess;

  get userInitial(): string {
    return (this.user()?.fullName ?? 'U')[0].toUpperCase();
  }

  /** Human-readable role, e.g. "cooperative_admin" → "Cooperative Admin" */
  get roleLabel(): string {
    const role = this.user()?.role ?? '';
    return role
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /** The user's granted permissions grouped by service, using catalog labels */
  readonly permissionGroups = computed<PermissionGroup[]>(() => {
    if (this.isFullAccess()) return [];
    const granted = new Set(this.permissions.granted());

    return PERMISSION_CATALOG
      .map(service => ({
        service: service.name,
        granted: service.permissions
          .filter(p => granted.has(p.id))
          .map(p => p.label),
      }))
      .filter(group => group.granted.length > 0);
  });

  changePassword(): void {
    // Reuses the existing reset flow — sends an OTP to the user's email/phone
    this.router.navigate(['/auth/forgot-password']);
  }
}
