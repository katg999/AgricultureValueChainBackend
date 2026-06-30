// core/services/platform-dashboard.service.ts
//
// Supplies all data for the Platform Admin home screen.
// Automatically switches between mock and HTTP endpoints based on global config.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
//import the global toggle flag for mock vs real data
import {USE_MOCK} from '../mock/mock-config';

import {
  MOCK_PLATFORM_STATS,
  MOCK_ONBOARDING_ITEMS,
  MOCK_PLATFORM_HEALTH,
  MOCK_PLATFORM_ACTIVITIES,
  OnboardingItem,
  PlatformHealthItem,
  PlatformActivity,
} from '../mock/mock-platform';
import { StatCardData } from '../../shared/components/stat-card/stat-card.component';

export type { OnboardingItem, PlatformHealthItem, PlatformActivity };

@Injectable({ providedIn: 'root' })
export class PlatformDashboardService {
  private apiUrl = 'http://localhost:8083/api/v1/platform-dashboard';
  //http client is injected into the service constructor
  constructor(private http: HttpClient) {}

  getStats(): Observable<StatCardData[]> {
    if (USE_MOCK) {
      return of([...MOCK_PLATFORM_STATS]);
    }
    // Return real HTTP call here when API is ready
    return this.http.get<StatCardData[]>(`${this.apiUrl}/stats`).pipe(
      catchError(() => of([])),
    );
  }

  getOnboardingItems(): Observable<OnboardingItem[]> {
    if (USE_MOCK) {
      return of([...MOCK_ONBOARDING_ITEMS]);
    }
    // Return real HTTP call here when API is ready
    return this.http.get<OnboardingItem[]>(`${this.apiUrl}/onboarding-items`).pipe(
      catchError(() => of([])),
    );
  }

  getPlatformHealth(): Observable<PlatformHealthItem[]> {
    if (USE_MOCK) {
      return of([...MOCK_PLATFORM_HEALTH]);
    }
    // Return real HTTP call here when API is ready
    return this.http.get<PlatformHealthItem[]>(`${this.apiUrl}/platform-health`).pipe(
      catchError(() => of([])),
    );
  }

  getRecentActivity(): Observable<PlatformActivity[]> {
    if (USE_MOCK) {
      return of([...MOCK_PLATFORM_ACTIVITIES]);
    }
    // Return real HTTP call here when API is ready
    return this.http.get<PlatformActivity[]>(`${this.apiUrl}/recent-activity`).pipe(
      catchError(() => of([])),
    );
  }
}
