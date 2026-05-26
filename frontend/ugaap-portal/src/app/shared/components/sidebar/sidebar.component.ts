// shared/components/sidebar/sidebar.component.ts
//
// Self-contained navigation sidebar.
// The parent layout passes in menu items; this component owns
// submenu expand/collapse and the mobile overlay toggle internally.
// No external state management needed — signals handle it all.

import {
  Component, Input, signal, inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgTemplateOutlet }             from '@angular/common';

import { NavItem }        from '../../../core/services/dashboard-config.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthService }    from '../../../core/services/auth.service';
import { LogoComponent }  from '../logo/logo.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet, LogoComponent],
  templateUrl: './sidebar.component.html',
  styleUrl:    './sidebar.component.scss',
})
export class SidebarComponent {

  /** Role-specific nav items injected by the parent layout */
  @Input() menuItems: NavItem[] = [];

  // ── Services ────────────────────────────────────────────────────────────────
  private session     = inject(SessionService);
  private authService = inject(AuthService);

  /** Reactive user object for the footer chip */
  readonly user = this.session.currentUser;

  // ── Internal state ──────────────────────────────────────────────────────────

  /** Route of the parent item whose submenu is currently open */
  expandedRoute = signal<string | null>(null);

  /** Controls the mobile slide-in overlay */
  mobileOpen = signal(false);

  // ── Submenu helpers ─────────────────────────────────────────────────────────

  /** Open or close a submenu — clicking the already-open one collapses it */
  toggleSubmenu(route: string): void {
    this.expandedRoute.update(current => current === route ? null : route);
  }

  isExpanded(route: string): boolean {
    return this.expandedRoute() === route;
  }

  // ── Mobile overlay ──────────────────────────────────────────────────────────

  openMobile():  void { this.mobileOpen.set(true);  }
  closeMobile(): void { this.mobileOpen.set(false); }

  /** Called when the user taps a leaf nav link — closes the mobile drawer */
  onLeafNavClick(): void {
    this.mobileOpen.set(false);
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

  onLogout(): void {
    // Try server-side invalidation; fall back to local clear on network error
    this.authService.logout().subscribe({
      error: () => this.session.logout(),
    });
  }

  // ── Template helpers ────────────────────────────────────────────────────────

  /** First letter of the user's name for the avatar circle */
  get userInitial(): string {
    return (this.user()?.fullName ?? 'U')[0].toUpperCase();
  }

  /**
   * Returns the full CSS class string for a badge pill.
   * Defaults to the primary (orange) variant when none is supplied.
   */
  badgeClass(variant: NavItem['badgeVariant'] = 'primary'): string {
    const map: Record<NonNullable<NavItem['badgeVariant']>, string> = {
      primary: 'badge--primary',
      warning: 'badge--warning',
      success: 'badge--success',
      danger:  'badge--danger',
    };
    return `badge ${map[variant]}`;
  }
}
