import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_ENDPOINTS }               from '../constants/api-endpoints';
import { MOCK_GRADES, MOCK_BRANCH_GRADE_SUMMARIES } from '../mock/mock-cooperative';
import { USE_MOCK }                    from '../mock/mock-config';

// Interfaces live here so both grade-config and edit-prices can import from one place.
export interface Grade {
  id:          string;
  name:        string;
  code:        string;
  description: string;
  createdAt:   string;
  branchCount: number;
}

export interface BranchGradeSummary {
  id:         string;
  name:       string;
  region:     string;
  avgPrice:   number;
  gradeCount: number;
  grades:     { name: string; code: string; pricePerKg: number }[];
}

@Injectable({ providedIn: 'root' })
export class GradingService {

  private readonly _grades    = new BehaviorSubject<Grade[]>(USE_MOCK ? MOCK_GRADES as Grade[] : []);
  private readonly _branches  = new BehaviorSubject<BranchGradeSummary[]>(USE_MOCK ? MOCK_BRANCH_GRADE_SUMMARIES as BranchGradeSummary[] : []);

  readonly grades$   = this._grades.asObservable();
  readonly branches$ = this._branches.asObservable();

  // True while an API request is in-flight — components can show a spinner.
  readonly loading = signal(false);

  constructor(private readonly http: HttpClient) {
    // In live mode, kick off the initial load immediately at service startup.
    if (!USE_MOCK) this.loadFromApi();
  }

  get grades(): Grade[] { return this._grades.value; }

  getById(id: string): Grade | undefined {
    return this._grades.value.find(g => g.id === id);
  }

  // Used by the grade edit form — serves from the already-loaded cache when possible
  // (always the case in mock mode); falls back to a direct fetch in real mode for
  // deep-links that land before the list has loaded.
  fetchById(id: string): Observable<Grade> {
    const cached = this.getById(id);
    if (cached) return of(cached);
    if (USE_MOCK) return throwError(() => new Error('Grade not found.'));
    return this.http.get<Grade>(`${API_ENDPOINTS.COOPERATIVE.GRADING}/${id}`);
  }

  createGrade(data: { name: string; code: string; description: string }): Observable<Grade> {
    if (USE_MOCK) {
      const grade: Grade = {
        id: `GR-${Date.now()}`,
        name: data.name,
        code: data.code,
        description: data.description,
        createdAt: new Date().toISOString().slice(0, 10),
        branchCount: 0,
      };
      this._grades.next([grade, ...this._grades.value]);
      return of(grade);
    }
    return this.http.post<Grade>(API_ENDPOINTS.COOPERATIVE.GRADING, data).pipe(
      tap(grade => this._grades.next([grade, ...this._grades.value])),
    );
  }

  updateGrade(id: string, data: { name: string; code: string; description: string }): Observable<Grade> {
    if (USE_MOCK) {
      const idx = this._grades.value.findIndex(g => g.id === id);
      if (idx === -1) return throwError(() => new Error('Grade not found.'));
      const updated: Grade = { ...this._grades.value[idx], ...data };
      const next = [...this._grades.value];
      next[idx] = updated;
      this._grades.next(next);
      return of(updated);
    }
    return this.http.put<Grade>(`${API_ENDPOINTS.COOPERATIVE.GRADING}/${id}`, data).pipe(
      tap(grade => {
        const idx = this._grades.value.findIndex(g => g.id === id);
        if (idx === -1) return;
        const next = [...this._grades.value];
        next[idx] = grade;
        this._grades.next(next);
      }),
    );
  }

  loadFromApi(): void {
    this.loading.set(true);
    this.http.get<Grade[]>(API_ENDPOINTS.COOPERATIVE.GRADING).pipe(
      tap(data => this._grades.next(data)),
      catchError(() => { this._grades.next(MOCK_GRADES as Grade[]); return of([]); }),
    ).subscribe(() => this.loading.set(false));

    this.http.get<BranchGradeSummary[]>(API_ENDPOINTS.COOPERATIVE.BRANCHES).pipe(
      tap(data => this._branches.next(data)),
      catchError(() => { this._branches.next(MOCK_BRANCH_GRADE_SUMMARIES as BranchGradeSummary[]); return of([]); }),
    ).subscribe();
  }

  deleteGrade(grade: Grade): Observable<void> {
    if (USE_MOCK) {
      this._grades.next(this._grades.value.filter(g => g.id !== grade.id));
      return of(void 0);
    }
    return this.http.delete<void>(`${API_ENDPOINTS.COOPERATIVE.GRADING}/${grade.id}`).pipe(
      tap(() => this._grades.next(this._grades.value.filter(g => g.id !== grade.id))),
      // Remove locally even if the API call fails so the UI stays consistent in mock mode.
      catchError(() => {
        this._grades.next(this._grades.value.filter(g => g.id !== grade.id));
        return of(void 0);
      }),
    );
  }
}
