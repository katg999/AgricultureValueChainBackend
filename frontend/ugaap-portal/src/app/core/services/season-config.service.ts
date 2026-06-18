// Manages the cooperative's season configuration: which months each season covers,
// and whether a season is currently "open" (accepting new deliveries).
//
// Mirrors the pattern used by DeliverySessionConfigService:
//   – signals hold the in-memory state
//   – localStorage persists state per cooperative between page loads
//   – one fire-and-forget HTTP call syncs to the backend when available
//
// The cooperative admin MANUALLY opens or closes a season via the Sessions Management
// page.  The season tag on a delivery reflects which season was open at recording time,
// NOT which calendar month the delivery fell in.

import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';
import { SessionService } from './session.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  SeasonWindow,
  SeasonStatus,
  DEFAULT_SEASON_WINDOWS,
} from '../models/season-config.model';
import { Season } from '../../features/branch/collections/branch.delivery.model';

const STORAGE_PREFIX = 'ugaap_season_config_';

@Injectable({ providedIn: 'root' })
export class SeasonConfigService {
  private readonly windowsSignal = signal<SeasonWindow[]>(DEFAULT_SEASON_WINDOWS);
  private readonly statusSignal  = signal<SeasonStatus>({ isOpen: false, activeType: null });

  readonly windows = computed(() => this.windowsSignal());
  readonly status  = computed(() => this.statusSignal());

  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionService,
  ) {
    this.loadFromStorage();
    this.refreshFromServer();
  }

  getWindows(): SeasonWindow[] {
    return this.windowsSignal();
  }

  getStatus(): SeasonStatus {
    return this.statusSignal();
  }

  isDeliveryAllowed(): boolean {
    return this.statusSignal().isOpen;
  }

  activeSeason(): Season | null {
    return this.statusSignal().activeType;
  }

  openSeason(type: Season): void {
    const status: SeasonStatus = { isOpen: true, activeType: type };
    this.statusSignal.set(status);
    this.saveToStorage();
    this.syncToServer();
  }

  closeSeason(): void {
    const status: SeasonStatus = { isOpen: false, activeType: null };
    this.statusSignal.set(status);
    this.saveToStorage();
    this.syncToServer();
  }

  // Validates and saves a full replacement set of season windows. Returns an error string on failure.
  updateWindows(windows: SeasonWindow[]): string | null {
    const error = this.validate(windows);
    if (error) return error;
    this.windowsSignal.set(windows);
    this.saveToStorage();
    this.syncToServer();
    return null;
  }

  resetToDefaults(): void {
    this.updateWindows(DEFAULT_SEASON_WINDOWS);
  }

  private validate(windows: SeasonWindow[]): string | null {
    if (windows.length !== DEFAULT_SEASON_WINDOWS.length) return 'Both season windows are required.';
    for (const w of windows) {
      if (w.startMonth < 1 || w.startMonth > 12 || w.endMonth < 1 || w.endMonth > 12) {
        return `${w.label}: month must be between 1 and 12.`;
      }
      if (w.startMonth === w.endMonth) {
        return `${w.label}: start and end month cannot be the same.`;
      }
    }
    return null;
  }

  private get storageKey(): string {
    return `${STORAGE_PREFIX}${this.session.cooperativeId() ?? 'default'}`;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { windows: SeasonWindow[]; status: SeasonStatus };
      if (parsed.windows && !this.validate(parsed.windows)) {
        this.windowsSignal.set(parsed.windows);
      }
      if (parsed.status) {
        this.statusSignal.set(parsed.status);
      }
    } catch {
      // Storage unavailable or corrupt — stay on defaults.
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        windows: this.windowsSignal(),
        status:  this.statusSignal(),
      }));
    } catch {
      // Storage quota exceeded — state stays in-memory only.
    }
  }

  private refreshFromServer(): void {
    this.http.get<{ windows: SeasonWindow[]; status: SeasonStatus }>(
      API_ENDPOINTS.COOPERATIVE.SEASON_CONFIG,
    ).pipe(
      timeout(3000),
      catchError(() => of(null)),
    ).subscribe(data => {
      if (!data || this.validate(data.windows)) return;
      this.windowsSignal.set(data.windows);
      this.statusSignal.set(data.status);
      this.saveToStorage();
    });
  }

  private syncToServer(): void {
    this.http.put(API_ENDPOINTS.COOPERATIVE.SEASON_CONFIG, {
      windows: this.windowsSignal(),
      status:  this.statusSignal(),
    }).pipe(
      timeout(3000),
      catchError(() => of(null)),
    ).subscribe();
  }
}
