// ─────────────────────────────────────────────────────────────────────────────
// features/cooperative/grading/grading.component.ts
//
// Define and manage quality grading rules for this cooperative's produce.
// Uses inject() so FormBuilder is available when `form` is initialised as a
// class field (field initialisers run before constructor parameter-properties).
// ─────────────────────────────────────────────────────────────────────────────

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient }          from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';

export interface GradingRule {
  id:          string;
  grade:       string;       // e.g. 'A', 'B', 'C'
  description: string;
  minMoisture: number;
  maxMoisture: number;
  minWeight:   number;
  pricePerKg:  number;
  isActive:    boolean;
}

@Component({
  selector: 'app-grading',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './grading.component.html',
})
export class GradingComponent implements OnInit {

  // Use inject() so fb is available when `form` is initialised below
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  // ── Form — initialised at field level because fb is already set via inject()
  form = this.fb.group({
    grade:       ['', Validators.required],
    description: ['', Validators.required],
    minMoisture: [0, [Validators.required, Validators.min(0)]],
    maxMoisture: [100, [Validators.required, Validators.max(100)]],
    minWeight:   [0, [Validators.required, Validators.min(0)]],
    pricePerKg:  [0, [Validators.required, Validators.min(0)]],
  });

  // ── State ─────────────────────────────────────────────────────────────────
  rules    = signal<GradingRule[]>([]);
  loading  = signal(false);
  saving   = signal(false);
  error    = signal<string | null>(null);
  showForm = signal(false);

  ngOnInit(): void { this.loadRules(); }

  loadRules(): void {
    this.loading.set(true);
    this.http.get<GradingRule[]>(API_ENDPOINTS.COOPERATIVE.GRADING).subscribe({
      next:  data => { this.rules.set(data);        this.loading.set(false); },
      error: err  => { this.error.set(err.message);  this.loading.set(false); },
    });
  }

  openForm(): void  { this.form.reset(); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); }

  saveRule(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.http.post<GradingRule>(API_ENDPOINTS.COOPERATIVE.GRADING, this.form.value).subscribe({
      next: rule => {
        this.rules.update(r => [...r, rule]);
        this.saving.set(false);
        this.closeForm();
      },
      error: err => { this.error.set(err.message); this.saving.set(false); },
    });
  }
}
