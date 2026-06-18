// shared/components/sidebar/sidebar.component.ts
//
// Self-contained navigation sidebar.
// The parent layout passes in menu items; this component owns
// submenu expand/collapse and the mobile overlay toggle internally.
// No external state management needed — signals handle it all.

import {
  Component, Input, signal, inject, OnChanges,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { NgTemplateOutlet }             from '@angular/common';
import { filter }                       from 'rxjs/operators';

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
export class SidebarComponent implements OnChanges {

  /** Role-specific nav items injected by the parent layout */
  @Input() menuItems: NavItem[] = [];

  // ── Services ────────────────────────────────────────────────────────────────
  private session     = inject(SessionService);
  private authService = inject(AuthService);
  private router      = inject(Router);

  /** Reactive user object for the footer chip */
  readonly user = this.session.currentUser;

  // ── Internal state ──────────────────────────────────────────────────────────

  /** Route of the parent item whose submenu is currently open */
  expandedRoute = signal<string | null>(null);

  /** Controls the mobile slide-in overlay */
  mobileOpen = signal(false);

  constructor() {
    // Auto-expand the parent whose child matches the current URL on every navigation
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.expandActiveParent();
    });
  }

  ngOnChanges(): void {
    this.expandActiveParent();
  }

  /** Expand the parent group that contains the current active child route */
  private expandActiveParent(): void {
    const url = this.router.url;
    for (const item of this.menuItems) {
      if (item.children?.some(c => url.startsWith(c.route))) {
        this.expandedRoute.set(item.route);
        return;
      }
    }
  }

  // ── Submenu helpers ─────────────────────────────────────────────────────────

  /** Navigate to the parent route AND toggle the submenu open/closed */
  toggleSubmenu(item: NavItem): void {
    this.router.navigate([item.route]);
    this.expandedRoute.update(current => current === item.route ? null : item.route);
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
