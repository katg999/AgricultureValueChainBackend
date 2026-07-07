// ─────────────────────────────────────────────────────────────────────────────
// features/branch/daily-grading/daily-grading.component.ts
//
// Record and review today's produce grading entries for this branch.
// Uses inject() so FormBuilder is available at field-initialiser time.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule }         from '@angular/common';
import { ReactiveFormsModule }  from '@angular/forms';
import { HttpClient }           from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { USE_MOCK } from '../../../core/mock/mock-config';

export interface DailyGradingEntry {
  id:          string;
  farmerId:    string;
  farmerName:  string;
  grade:       string;
  weightKg:    number;
  moisture:    number;
  pricePerKg:  number;
  totalAmount: number;
  gradedAt:    string;
  gradedBy:    string;
}

@Component({
  selector: 'app-daily-grading',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './daily-grading.component.html',
  styles: [`.page-header { display: flex; justify-content: flex-end; margin-bottom: 24px; }`],
})
export class DailyGradingComponent implements OnInit {

  // Use inject() so fb is available when `form` is initialised below
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  // ── Form ──────────────────────────────────────────────────────────────────
  form = this.fb.group({
    farmerId: ['', Validators.required],
    grade:    ['', Validators.required],
    weightKg: [0, [Validators.required, Validators.min(0.1)]],
    moisture: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  // ── State ─────────────────────────────────────────────────────────────────
  entries  = signal<DailyGradingEntry[]>([]);
  loading  = signal(false);
  saving   = signal(false);
  error    = signal<string | null>(null);
  showForm = signal(false);

  /** Formatted date label shown in the page header */
  today = new Date().toLocaleDateString('en-UG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  ngOnInit(): void { this.loadEntries(); }

  loadEntries(): void {
    this.loading.set(true);
    if (USE_MOCK) {
      // No seed data exists yet for this feature — start from an empty list.
      this.entries.set([]);
      this.loading.set(false);
      return;
    }
    this.http.get<DailyGradingEntry[]>(API_ENDPOINTS.BRANCH.DAILY_GRADING).subscribe({
      next:  data => { this.entries.set(data);       this.loading.set(false); },
      error: err  => { this.error.set(err.message);   this.loading.set(false); },
    });
  }

  openForm(): void  { this.form.reset({ moisture: 0, weightKg: 0 }); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); }

  submitGrading(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    if (USE_MOCK) {
      const v = this.form.value;
      const entry: DailyGradingEntry = {
        id: `DG-${Date.now()}`,
        farmerId: v.farmerId ?? '',
        farmerName: v.farmerId ?? '',
        grade: v.grade ?? '',
        weightKg: v.weightKg ?? 0,
        moisture: v.moisture ?? 0,
        pricePerKg: 0,
        totalAmount: 0,
        gradedAt: new Date().toISOString(),
        gradedBy: '',
      };
      this.entries.update(e => [entry, ...e]);
      this.saving.set(false);
      this.closeForm();
      return;
    }

    this.http.post<DailyGradingEntry>(API_ENDPOINTS.BRANCH.DAILY_GRADING, this.form.value).subscribe({
      next: entry => {
        this.entries.update(e => [entry, ...e]);   // Prepend so latest is at top
        this.saving.set(false);
        this.closeForm();
      },
      error: err => { this.error.set(err.message); this.saving.set(false); },
    });
  }

  // ── Running totals shown in summary bar ───────────────────────────────────

  get totalWeight(): number {
    return this.entries().reduce((s, e) => s + e.weightKg, 0);
  }

  get totalAmount(): number {
    return this.entries().reduce((s, e) => s + e.totalAmount, 0);
  }
}
