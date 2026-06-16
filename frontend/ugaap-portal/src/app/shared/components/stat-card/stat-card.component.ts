// shared/components/stat-card/stat-card.component.ts
//
// Reusable KPI card.
// • Accepts a single [data] input and an optional [delay] (ms) for stagger.
// • Numeric values animate from 0 → target via requestAnimationFrame.
// • Status colors (icon bg, value text, left border) come from either:
//     - data.status (manual), or
//     - data.thresholds — computed from the value at render time. Thresholds
//       are hardcoded by callers today; the shape is ready to be fed from
//       backend config later without touching this component.
// • Tapping a card with a route navigates straight to that screen.
// • icon field accepts an icon NAME string (e.g. 'users', 'box', 'wallet')
//   mapped to inline SVG via iconMap — not an emoji.

import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

/**
 * Value thresholds that drive the card color dynamically.
 * direction 'above'  → status degrades as the value RISES past a limit
 *                      (queue sizes, overdue counts).
 * direction 'below'  → status degrades as the value FALLS past a limit
 *                      (stock levels, recovery rates).
 */
export interface StatCardThresholds {
  warning?: number;
  critical?: number;
  direction?: 'above' | 'below';
}

export interface StatCardData {
  label: string;
  value: string | number;
  /** Icon key resolved against iconMap below */
  icon: string;
  trend?: string;
  trendUp?: boolean;
  /** Manual status — ignored when thresholds are provided */
  status?: 'active' | 'warning' | 'critical';
  /** Computes status from the value — overrides `status` */
  thresholds?: StatCardThresholds;
  clickable?: boolean;
  /** Related screen — tapping the card navigates straight there */
  route?: string;
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="stat-card"
      [class.clickable]="isInteractive"
      [class.status-warning]="effectiveStatus === 'warning'"
      [class.status-critical]="effectiveStatus === 'critical'"
      [class.status-active]="effectiveStatus === 'active'"
      [style.--stagger]="delay + 'ms'"
      [attr.role]="isInteractive ? 'button' : null"
      [attr.tabindex]="isInteractive ? 0 : null"
      (click)="handleClick()"
      (keydown.enter)="handleClick()"
      (keydown.space)="$event.preventDefault(); handleClick()">

      <!-- Header row: icon left, status badge right.
           min-height keeps header zone the same size with or without a badge. -->
      <div class="stat-header">
        <div class="stat-icon" [class]="'icon-' + (effectiveStatus ?? 'default')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="getIconPath(data.icon)"></path>
          </svg>
        </div>
        <span
          *ngIf="effectiveStatus"
          class="status-badge"
          [class]="'badge-' + effectiveStatus">
          {{ effectiveStatus | uppercase }}
        </span>
        <span *ngIf="!effectiveStatus" class="badge-placeholder" aria-hidden="true"></span>
      </div>

      <!-- Content pushed to the bottom of the flex column -->
      <div class="stat-content">
        <div class="stat-label">{{ data.label }}</div>
        <div class="stat-value" [style.font-size]="getValueFontSize()">{{ displayValue }}</div>

        <!-- Trend row: always rendered so cards without a trend stay aligned -->
        <div class="stat-trend">
          <ng-container *ngIf="data.trend">
            <span
              class="trend-indicator"
              [class.trend-up]="data.trendUp"
              [class.trend-down]="!data.trendUp">
              {{ data.trendUp ? '↑' : '↓' }}
            </span>
            <span class="trend-text">{{ data.trend }}</span>
          </ng-container>

          <!-- Navigation affordance for cards that link somewhere -->
          <span *ngIf="data.route" class="nav-arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Host element ──────────────────────────────────────────────────────── */
    /* <app-stat-card> is the CSS Grid / Flex item.
       height:100% makes the inner card fill the grid cell so every
       card in a row is the same height as the tallest sibling.         */
    :host {
      display: block;
      height: 100%;
      min-width: 0; /* lets the card shrink inside tight grid tracks */
    }

    /* ── Entrance animation (one-shot only — no looping) ──────────────────── */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0);    }
    }

    /* ── Card shell ────────────────────────────────────────────────────────── */
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #E5E7EB;
      border-left: 4px solid #E5E7EB;
      min-height: 160px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      animation: fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) var(--stagger, 0ms) both;
      transition: box-shadow 0.2s ease, transform 0.2s ease, border-left-color 0.2s ease;
    }

    /* ── Status left-border colours only — no looping shadow animation ─────── */
    .stat-card.status-warning  { border-left-color: #F59E0B; }
    .stat-card.status-critical { border-left-color: #EF4444; }
    .stat-card.status-active   { border-left-color: #10B981; }

    /* ── Hover lift ────────────────────────────────────────────────────────── */
    .stat-card.clickable { cursor: pointer; }
    .stat-card.clickable:hover {
      box-shadow: 0 6px 20px rgba(242, 93, 39, 0.14);
      transform: translateY(-3px);
    }
    .stat-card.clickable:focus-visible {
      outline: 2px solid #F25D27;
      outline-offset: 2px;
    }

    /* ── Header row ────────────────────────────────────────────────────────── */
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      min-height: 48px;
    }

    /* ── Icon box ──────────────────────────────────────────────────────────── */
    .stat-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .stat-icon svg {
      width: 24px;
      height: 24px;
    }

    /* Icon background tinted to match status */
    .icon-default  { background: #FEF3F2; }           /* brand-light orange */
    .icon-active   { background: #D1FAE5; }           /* green tint */
    .icon-warning  { background: #FEF9C3; }           /* amber tint */
    .icon-critical { background: #FEE2E2; }           /* red tint */

    /* ── Status badge pill ─────────────────────────────────────────────────── */
    .status-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      font-family: 'IBM Plex Mono', monospace;
      white-space: nowrap;
      line-height: 1.4;
    }

    /* invisible 1px spacer keeps header the same height when there is no badge */
    .badge-placeholder {
      display: block;
      width: 1px;
      height: 22px;
    }

    .badge-active   { background: #D1FAE5; color: #065F46; }
    .badge-warning  { background: #FEF3C7; color: #92400E; }
    .badge-critical { background: #FEE2E2; color: #991B1B; }

    /* ── Content area ──────────────────────────────────────────────────────── */
    .stat-content { margin-top: auto; }

    .stat-label {
      font-size: 13px;
      color: #6B7280;
      margin-bottom: 4px;
      line-height: 1.4;
    }

    /* Value — base color is deep brand plum; overridden per status */
    /* CRITICAL: fixed height + tabular-nums prevents shaking during count-up.
       font-size is bound dynamically via [style.font-size] — NOT set here. */
    .stat-value {
      font-weight: 700;
      color: #200B26;
      line-height: 1;
      height: 36px;
      display: flex;
      align-items: flex-end;
      font-family: 'IBM Plex Mono', 'Inter', sans-serif;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: font-size 0.15s ease;
    }

    .status-active   .stat-value { color: #065F46; }   /* rich green */
    .status-warning  .stat-value { color: #92400E; }   /* deep amber */
    .status-critical .stat-value { color: #991B1B; }   /* deep red */

    /* ── Trend row ─────────────────────────────────────────────────────────── */
    /* Always rendered — fixed height reserves space when there is no trend text */
    .stat-trend {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      margin-top: 8px;
      min-height: 20px;
      height: 20px;
    }

    .trend-indicator { font-weight: 600; }
    .trend-up   { color: #10B981; }
    .trend-down { color: #EF4444; }
    .trend-text {
      color: #6B7280;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Arrow hints that tapping the card navigates to the related screen */
    .nav-arrow {
      margin-left: auto;
      display: inline-flex;
      color: #9CA3AF;
      transition: transform 0.2s ease, color 0.2s ease;
      flex-shrink: 0;
    }
    .stat-card.clickable:hover .nav-arrow {
      color: #F25D27;
      transform: translateX(2px);
    }

    /* ── Responsive ────────────────────────────────────────────────────────── */
    @media (max-width: 640px) {
      .stat-card { padding: 16px; min-height: 132px; }
      .stat-icon { width: 40px; height: 40px; }
      .stat-icon svg { width: 20px; height: 20px; }
      .stat-header { min-height: 42px; }
    }
  `]
})
export class StatCardComponent implements OnInit, OnDestroy {

  @Input() data!: StatCardData;

  private router = inject(Router);

  // ── SVG icon path map ────────────────────────────────────────────────────
  // icon names → SVG <path d="..."> values (24x24, stroke-based)

  private readonly iconMap: Record<string, string> = {
    'building':  'M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M6 19h.01M10 11h.01M10 15h.01M10 19h.01M14 11h.01M14 15h.01M14 19h.01M18 11h.01M18 15h.01M18 19h.01M3 7l9-4 9 4',
    'users':     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    'truck':     'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    'clipboard': 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
    'box':       'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    'clock':     'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
    'chart':     'M18 20V10M12 20V4M6 20v-6',
    'wallet':    'M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
    'shield':    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'settings':  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    'farmer':    'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 20c0-4 4-7 10-7s10 3 10 7',
    'scale':     'M12 3v18M3 7l9-4 9 4M3 7v4l9 4 9-4V7',
    'alert':     'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
    'check':     'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  };

  getIconPath(iconName: string): string {
    return this.iconMap[iconName] ?? this.iconMap['chart'];
  }

  /**
   * Animation stagger delay in milliseconds.
   * Pass `[delay]="i * 80"` from a *ngFor index to sequence entries.
   */
  @Input() delay = 0;

  /** Rendered value — either the raw string or the animated integer */
  displayValue: string | number = '';

  private rafId?: number;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.isAnimatable(this.data.value)) {
      this.runCountUp(this.toNumber(this.data.value));
    } else {
      this.displayValue = this.data.value;
    }
  }

  ngOnDestroy(): void {
    if (this.rafId !== undefined) cancelAnimationFrame(this.rafId);
  }

  // ── Interactivity ─────────────────────────────────────────────────────────

  /** Tappable when the card links somewhere */
  get isInteractive(): boolean {
    return !!this.data.route || !!this.data.clickable;
  }

  /** Tap takes the user straight to the related screen */
  handleClick(): void {
    if (this.data.route) {
      this.router.navigate([this.data.route]);
    }
  }

  // ── Status resolution ─────────────────────────────────────────────────────

  /**
   * Resolves the card status. When thresholds are present they win over the
   * manual `status` field — the color tracks the value dynamically:
   *   direction 'above' → value >= limit breaches it (queues, overdue counts)
   *   direction 'below' → value <= limit breaches it (stock, recovery rates)
   */
  get effectiveStatus(): 'active' | 'warning' | 'critical' | undefined {
    const t = this.data.thresholds;
    if (!t) return this.data.status;

    const value = this.toNumber(this.data.value);
    const dir = t.direction ?? 'above';
    const breaches = (limit?: number) =>
      limit !== undefined && (dir === 'above' ? value >= limit : value <= limit);

    if (breaches(t.critical)) return 'critical';
    if (breaches(t.warning))  return 'warning';
    return 'active';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Returns true when the value is a plain integer (with optional comma thousands) */
  private isAnimatable(v: string | number): boolean {
    if (typeof v === 'number') return Number.isFinite(v) && v >= 0;
    return /^\d{1,3}(,\d{3})*$|^\d+$/.test(String(v).trim());
  }

  /** Strip commas and parse the leading number out of strings like "2.4 MT" */
  private toNumber(v: string | number): number {
    if (typeof v === 'number') return v;
    const match = String(v).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  }

  /**
   * Abbreviate a number to a short display string.
   * Keeps the displayed value short so the card width never changes:
   *   450,000,000 → "450M"   120,000,000 → "120M"
   *   4,820       → "4.8K"   3,200       → "3.2K"
   *   540         → "540"
   */
  private abbreviate(n: number): string {
    const v = Math.round(n);
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
    if (v >= 1_000_000)     return (v / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (v >= 10_000)        return (v / 1_000).toFixed(1).replace('.0', '') + 'K';
    if (v >= 1_000)         return (v / 1_000).toFixed(1).replace('.0', '') + 'K';
    return v.toString();
  }

  /**
   * Scales font down when the abbreviated value is still long
   * (rare edge case — with abbreviation most values stay ≤ 5 chars)
   */
  getValueFontSize(): string {
    const len = String(this.displayValue).length;
    if (len <= 6) return '28px';
    if (len <= 9) return '20px';
    return '16px';
  }

  /**
   * Counts displayValue from 0 → target over ~1 s using easeOutCubic.
   * Uses abbreviate() at every frame so the string length never expands
   * mid-animation — prevents the card from shaking or resizing.
   */
  private runCountUp(target: number): void {
    const DURATION   = 1100;
    const startDelay = this.delay + 200;
    let startTime: number | null = null;

    this.displayValue = this.abbreviate(0);

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed  = now - startTime;

      if (elapsed < startDelay) {
        this.displayValue = this.abbreviate(0);
        this.rafId = requestAnimationFrame(tick);
        return;
      }

      const active   = elapsed - startDelay;
      const progress = Math.min(active / DURATION, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      this.displayValue = this.abbreviate(eased * target);
      this.cdr.markForCheck();

      if (progress < 1) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        // Snap to the final abbreviated form (never show raw "450,000,000")
        this.displayValue = this.abbreviate(target);
        this.cdr.markForCheck();
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }
}
