import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Stats Card Component
 *
 * Displays a KPI card with label, value, trend, SVG icon, and optional status badge.
 * Used across the platform, cooperative, and branch dashboards.
 *
 * @example
 * ```html
 * <app-stats-card
 *   label="Total Members"
 *   value="4820"
 *   trend="+8%"
 *   icon="users"
 *   variant="success">
 * </app-stats-card>
 * ```
 */
@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.css']
})
export class StatsCardComponent implements OnChanges {

  /** Card label / title */
  @Input() label: string = '';

  /** Main metric value — number or string; large numbers are auto-abbreviated */
  @Input() value: string | number = '0';

  /** Trend text e.g. "+12%", "Last 30 days" */
  @Input() trend: string = '';

  /** Controls trend arrow colour */
  @Input() trendType: 'positive' | 'negative' | 'neutral' = 'neutral';

  /** Card accent variant */
  @Input() variant: 'default' | 'success' | 'warning' | 'danger' = 'default';

  /** Icon name — mapped to SVG path internally (e.g. 'users', 'box', 'wallet') */
  @Input() icon: string = 'chart';

  /** Makes the card clickable with hover effect */
  @Input() clickable: boolean = false;

  /** Optional badge text shown top-right (e.g. 'ACTIVE', 'WARNING') */
  @Input() status: string = '';

  @Output() cardClicked = new EventEmitter<void>();

  /** Abbreviated display value */
  displayValue: string = '';

  /** Full original value — shown in HTML title tooltip */
  fullValue: string = '';

  // ── SVG icon path map ────────────────────────────────────────────────────

  readonly iconMap: Record<string, string> = {
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

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.processValue();
    }
  }

  // ── Value processing ─────────────────────────────────────────────────────

  /**
   * Abbreviates large numeric values; preserves strings that contain letters.
   * Examples: 450000000 → "450M", 4820 → "4.8K", "540 MT" → "540 MT"
   */
  private processValue(): void {
    const raw = String(this.value);
    this.fullValue = raw;

    // If value contains letters or % (e.g. "540 MT", "78%"), show as-is
    if (/[a-zA-Z%]/.test(raw)) {
      this.displayValue = raw;
      return;
    }

    // Strip commas and parse
    const num = parseFloat(raw.replace(/,/g, ''));

    if (isNaN(num)) {
      this.displayValue = raw;
      return;
    }

    if (num >= 1_000_000_000) {
      this.displayValue = (num / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
    } else if (num >= 1_000_000) {
      this.displayValue = (num / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    } else if (num >= 10_000) {
      this.displayValue = (num / 1_000).toFixed(1).replace('.0', '') + 'K';
    } else if (num >= 1_000) {
      this.displayValue = num.toLocaleString();
    } else {
      this.displayValue = raw;
    }
  }

  // ── Icon helpers ─────────────────────────────────────────────────────────

  getIconPath(): string {
    return this.iconMap[this.icon] ?? this.iconMap['chart'];
  }

  getIconBgColor(): string {
    switch (this.variant) {
      case 'success': return '#DCFCE7';
      case 'warning': return '#FEF3C7';
      case 'danger':  return '#FEE2E2';
      default:        return '#FEF3F2';
    }
  }

  getIconColor(): string {
    switch (this.variant) {
      case 'success': return '#15803D';
      case 'warning': return '#B45309';
      case 'danger':  return '#B91C1C';
      default:        return '#F25D27';
    }
  }

  // ── Value font size ───────────────────────────────────────────────────────

  /**
   * Scales the value font down when the string is longer than 6 chars
   * so the text always fits inside the fixed-height value container.
   *  ≤ 6 chars  →  28px  ("37", "450M", "540 MT", "81%")
   *  7–9 chars  →  20px  ("15.6 MT", "36.8M UGX")
   *  ≥ 10 chars →  16px  ("168.5M UGX", "2,340 MT")
   */
  getValueFontSize(): string {
    const len = (this.displayValue ?? '').length;
    if (len <= 6) return '28px';
    if (len <= 9) return '20px';
    return '16px';
  }

  // ── Click handler ─────────────────────────────────────────────────────────

  onClick(): void {
    if (this.clickable) {
      this.cardClicked.emit();
    }
  }
}
