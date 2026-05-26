// shared/components/stat-card/stat-card.component.ts
//
// Reusable KPI card.
// • Accepts a single [data] input and an optional [delay] (ms) for stagger.
// • Numeric values animate from 0 → target via requestAnimationFrame.
// • Colors (icon bg, value text, left border) track the status field.
// • Critical cards pulse continuously to demand attention.

import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface StatCardData {
  label: string;
  value: string | number;
  /** Emoji shown in the icon box */
  icon: string;
  trend?: string;
  trendUp?: boolean;
  status?: 'active' | 'warning' | 'critical';
  clickable?: boolean;
  route?: string;
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="stat-card"
      [class.clickable]="data.clickable"
      [class.status-warning]="data.status === 'warning'"
      [class.status-critical]="data.status === 'critical'"
      [class.status-active]="data.status === 'active'"
      [style.--stagger]="delay + 'ms'"
      (click)="handleClick()">

      <!-- Header row: icon left, status badge right.
           min-height keeps header zone the same size with or without a badge. -->
      <div class="stat-header">
        <div class="stat-icon" [class]="'icon-' + (data.status ?? 'default')">
          {{ data.icon }}
        </div>
        <span
          *ngIf="data.status"
          class="status-badge"
          [class]="'badge-' + data.status">
          {{ data.status | uppercase }}
        </span>
        <span *ngIf="!data.status" class="badge-placeholder" aria-hidden="true"></span>
      </div>

      <!-- Content pushed to the bottom of the flex column -->
      <div class="stat-content">
        <div class="stat-label">{{ data.label }}</div>
        <div class="stat-value">{{ displayValue }}</div>

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
    }

    /* ── Entrance animation ────────────────────────────────────────────────── */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0);    }
    }

    /* ── Critical pulse ────────────────────────────────────────────────────── */
    @keyframes pulseCritical {
      0%, 100% { box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
      50%      { box-shadow: 0 0 0 5px rgba(239,68,68,0.10), 0 1px 6px rgba(0,0,0,0.08); }
    }

    /* ── Warning shimmer ───────────────────────────────────────────────────── */
    @keyframes shimmerWarning {
      0%, 100% { box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
      50%      { box-shadow: 0 0 0 5px rgba(245,158,11,0.10), 0 1px 6px rgba(0,0,0,0.06); }
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
      /* entrance — delay comes from the --stagger CSS variable set by [delay] input */
      animation: fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) var(--stagger, 0ms) both;
      transition: box-shadow 0.2s ease, transform 0.2s ease, border-left-color 0.2s ease;
    }

    /* ── Status left-border + continuous ambient animation ─────────────────── */
    .stat-card.status-warning {
      border-left-color: #F59E0B;
      animation:
        fadeInUp       0.45s cubic-bezier(0.22, 1, 0.36, 1) var(--stagger, 0ms) both,
        shimmerWarning 3s   ease-in-out                      calc(var(--stagger, 0ms) + 800ms) infinite;
    }

    .stat-card.status-critical {
      border-left-color: #EF4444;
      animation:
        fadeInUp       0.45s cubic-bezier(0.22, 1, 0.36, 1) var(--stagger, 0ms) both,
        pulseCritical  2.4s  ease-in-out                     calc(var(--stagger, 0ms) + 800ms) infinite;
    }

    .stat-card.status-active {
      border-left-color: #10B981;
    }

    /* ── Hover lift ────────────────────────────────────────────────────────── */
    .stat-card.clickable { cursor: pointer; }
    .stat-card.clickable:hover {
      box-shadow: 0 6px 20px rgba(242, 93, 39, 0.14);
      transform: translateY(-3px);
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
      font-size: 24px;
      flex-shrink: 0;
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
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #200B26;
      line-height: 1.2;
    }

    .status-active   .stat-value { color: #065F46; }   /* rich green */
    .status-warning  .stat-value { color: #92400E; }   /* deep amber */
    .status-critical .stat-value { color: #991B1B; }   /* deep red */

    /* ── Trend row ─────────────────────────────────────────────────────────── */
    /* Always rendered — min-height reserves space when there is no trend text */
    .stat-trend {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      margin-top: 8px;
      min-height: 20px;
    }

    .trend-indicator { font-weight: 600; }
    .trend-up   { color: #10B981; }
    .trend-down { color: #EF4444; }
    .trend-text { color: #6B7280; }
  `]
})
export class StatCardComponent implements OnInit, OnDestroy {

  @Input() data!: StatCardData;

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

  handleClick(): void {
    // Navigation handled by parent via routerLink or route input
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Returns true when the value is a plain integer (with optional comma thousands) */
  private isAnimatable(v: string | number): boolean {
    if (typeof v === 'number') return Number.isFinite(v) && v >= 0;
    return /^\d{1,3}(,\d{3})*$|^\d+$/.test(String(v).trim());
  }

  /** Strip commas and parse to float */
  private toNumber(v: string | number): number {
    if (typeof v === 'number') return v;
    return parseFloat(String(v).replace(/,/g, '')) || 0;
  }

  /** Format n with thousands commas (e.g. 3200 → "3,200") */
  private fmt(n: number): string {
    return Math.round(n).toLocaleString('en-US');
  }

  /**
   * Counts displayValue from 0 → target over ~1 s using easeOutCubic,
   * respecting the stagger delay so the number starts when the card appears.
   */
  private runCountUp(target: number): void {
    const DURATION   = 1100;                          // ms
    const startDelay = this.delay + 200;              // let the card fade in first
    let startTime: number | null = null;

    this.displayValue = this.fmt(0);

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed  = now - startTime;

      if (elapsed < startDelay) {
        this.displayValue = this.fmt(0);
        this.rafId = requestAnimationFrame(tick);
        return;
      }

      const active   = elapsed - startDelay;
      const progress = Math.min(active / DURATION, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      this.displayValue = this.fmt(eased * target);
      this.cdr.markForCheck();

      if (progress < 1) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        // Snap to the exact original string (may include original commas/format)
        this.displayValue = this.data.value;
        this.cdr.markForCheck();
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }
}
