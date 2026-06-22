// layouts/admin-layout/admin-layout.component.ts
//
// Protected-page shell: sidebar + topbar + router outlet.
//
// HOW THE SIDEBAR MENU IS CHOSEN:
//   The menu is driven by the URL prefix, NOT the user's session role.
//   On every NavigationEnd event we inspect router.url:
//     /platform/*    → platform admin menu
//     /cooperative/* → cooperative admin menu
//     /branch/*      → branch menu
//     anything else  → fall back to the session role (shared routes like /collections)
//
//   This means the sidebar adapts automatically if a platform admin impersonates
//   a cooperative context, or if roles are extended in the future.

import {
  Component, OnInit, inject, signal, computed, DestroyRef,
} from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SessionService }                          from '../../core/services/session.service';
import { DashboardConfigService, NavItem, UserLevel } from '../../core/services/dashboard-config.service';
import { PermissionsService }                      from '../../core/services/permissions.service';
import { AuthService }                             from '../../core/services/auth.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ToastComponent }   from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl:    './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {

  // ── Services ────────────────────────────────────────────────────────────────
  private router          = inject(Router);
  private session         = inject(SessionService);
  private dashboardConfig = inject(DashboardConfigService);
  private permissions     = inject(PermissionsService);
  private authService     = inject(AuthService);
  private destroyRef      = inject(DestroyRef);

  // ── Template signals ────────────────────────────────────────────────────────

  /** Logged-in user — drives topbar name and avatar */
  readonly user = this.session.currentUser;

  /**
   * Area-level nav items for the current URL prefix (unfiltered).
   * Updated whenever the URL prefix changes; starts empty and is
   * populated immediately in ngOnInit.
   */
  private readonly areaNavItems = signal<NavItem[]>([]);

  /**
   * Nav items actually shown in the sidebar — the area menu filtered down to
   * what the logged-in user holds permissions for. Re-computes automatically
   * when either the URL area or the session permissions change, so a user
   * with no "farmers.*" grants never sees the Farmers entry.
   */
  readonly navItems = computed<NavItem[]>(() =>
    this.permissions.filterNav(this.areaNavItems()),
  );
  

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Set the correct menu for wherever the user lands first
    this.syncMenuToUrl(this.router.url);

    // Re-sync whenever navigation completes (catches cross-prefix jumps)
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(e => {
      this.syncMenuToUrl(e.urlAfterRedirects);
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Inspects the URL, resolves the matching UserLevel, and pushes the correct
   * nav items into the sidebar signal.
   */
  private syncMenuToUrl(url: string): void {
    const level = this.resolveLevel(url);
    const config = this.dashboardConfig.getConfig(level);
    this.areaNavItems.set(config.navItems);
  }

  /**
   * Derives a UserLevel from the URL prefix.
   * Shared routes (/collections, /farmers, /users, /inventory) don't belong to
   * any single area, so we fall back to whatever the session role says.
   */
  private resolveLevel(url: string): UserLevel {
    if (url.startsWith('/platform'))    return 'platform';
    if (url.startsWith('/cooperative')) return 'cooperative';
    if (url.startsWith('/cooperatives')) return 'cooperative'; // org-setup section
    if (url.startsWith('/branch'))      return 'branch';

    // Shared routes — use the session role as tiebreaker
    return this.dashboardConfig.levelForRole(this.session.userRole());
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  onLogout(): void {
    this.authService.logout().subscribe({
      error: () => this.session.logout(),
    });
  }
}
