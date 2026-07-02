// Holds the configured delivery session windows (start/end hour for the
// morning/midday/afternoon slots) for the current cooperative.
//
// Cooperative-wide, no per-branch override: every branch under a cooperative
// reads the same windows from here. Tries the real API first; falls back to
// (and mirrors into) localStorage per cooperativeId so it still works — and
// survives a page reload — before that endpoint exists or while it's down.

import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';
import { SessionService } from './session.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { USE_MOCK } from '../mock/mock-config';
import {
  DeliverySession,
  DeliverySessionWindow,
  DEFAULT_SESSION_WINDOWS,
} from '../models/delivery-session.model';

const STORAGE_PREFIX = 'ugaap_session_windows_';

@Injectable({ providedIn: 'root' })
export class DeliverySessionConfigService {
  private readonly windowsSignal = signal<DeliverySessionWindow[]>(DEFAULT_SESSION_WINDOWS);

  readonly windows = computed(() => this.windowsSignal());

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {
    this.windowsSignal.set(this.loadFromStorage());
    if (!USE_MOCK) this.refreshFromServer();
  }

  getWindows(): DeliverySessionWindow[] {
    return this.windowsSignal();
  }

  getWindow(id: DeliverySession): DeliverySessionWindow | undefined {
    return this.windowsSignal().find(w => w.id === id);
  }

  // e.g. "Morning (6am - 9am)" — used anywhere a session id needs to be shown to a user.
  // Accepts undefined so callers reading an older/partial record don't need their own fallback.
  getLabel(id: DeliverySession | undefined): string {
    if (!id) return '—';
    const window = this.getWindow(id);
    if (!window) return id;
    return `${window.label} (${this.formatHourRange(window.startHour, window.endHour)})`;
  }

  // A session can no longer be picked for a brand-new delivery once its window
  // has ended for today. Editing an existing delivery is exempt from this check.
  isSessionPassed(id: DeliverySession | undefined, now: Date = new Date()): boolean {
    if (!id) return false;
    const window = this.getWindow(id);
    if (!window) return false;
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return currentHour >= window.endHour;
  }

  // Validates and saves a full replacement set of windows (always all 3 slots).
  // Returns an error message if invalid, or null on success.
  updateWindows(windows: DeliverySessionWindow[]): string | null {
    const error = this.validate(windows);
    if (error) return error;

    this.windowsSignal.set(windows);
    this.saveToStorage(windows);

    // Fire-and-forget — optimistic update, same pattern as PaymentBatchService.updateBatchStatus().
    if (!USE_MOCK) {
      this.http.put(API_ENDPOINTS.COOPERATIVE.SESSION_CONFIG, windows).pipe(
        timeout(3000),
        catchError(() => of(null)),
      ).subscribe();
    }

    return null;
  }

  resetToDefaults(): void {
    this.updateWindows(DEFAULT_SESSION_WINDOWS);
  }

  formatHourRange(startHour: number, endHour: number): string {
    return `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`;
  }

  // e.g. 6 -> "6am", 13 -> "1pm" — used to label the hour dropdowns on the config form.
  formatHour(hour: number): string {
    const normalized = ((hour % 24) + 24) % 24;
    const period = normalized < 12 ? 'am' : 'pm';
    const displayHour = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${displayHour}${period}`;
  }

  // Tries the real endpoint once at startup; keeps the local/default value on any failure
  // (no endpoint yet, timeout, invalid payload) — never throws, never blocks construction.
  private refreshFromServer(): void {
    this.http.get<DeliverySessionWindow[]>(API_ENDPOINTS.COOPERATIVE.SESSION_CONFIG).pipe(
      timeout(3000),
      catchError(() => of(null)),
    ).subscribe(windows => {
      if (!windows || this.validate(windows)) return;
      this.windowsSignal.set(windows);
      this.saveToStorage(windows);
    });
  }

  private validate(windows: DeliverySessionWindow[]): string | null {
    if (windows.length !== DEFAULT_SESSION_WINDOWS.length) return 'All 3 session windows are required.';

    for (const window of windows) {
      if (window.startHour < 0 || window.startHour > 23 || window.endHour < 0 || window.endHour > 23) {
        return `${window.label}: hours must be between 0 and 23.`;
      }
      if (window.endHour <= window.startHour) {
        return `${window.label}: end time must be after the start time.`;
      }
    }
    return null;
  }

  private get storageKey(): string {
    return `${STORAGE_PREFIX}${this.session.cooperativeId() ?? 'default'}`;
  }

  private loadFromStorage(): DeliverySessionWindow[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return DEFAULT_SESSION_WINDOWS;
      const parsed = JSON.parse(raw) as DeliverySessionWindow[];
      return this.validate(parsed) ? DEFAULT_SESSION_WINDOWS : parsed;
    } catch {
      return DEFAULT_SESSION_WINDOWS;
    }
  }

  private saveToStorage(windows: DeliverySessionWindow[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(windows));
    } catch {
      // Storage unavailable (e.g. private browsing quota) — config stays in-memory only.
    }
  }
}
