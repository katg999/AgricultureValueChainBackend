// ─────────────────────────────────────────────────────────────────────────────
// features/cooperative/pricing/pricing.component.ts
//
// Set seasonal produce prices per grade.
// Uses inject() so FormBuilder is available at field-initialiser time.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule }         from '@angular/common';
import { ReactiveFormsModule }  from '@angular/forms';
import { HttpClient }           from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';

import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';

export interface PricingRule {
  id:            string;
  season:        string;
  grade:         string;
  pricePerKg:    number;
  effectiveFrom: string;
  effectiveTo:   string;
  isActive:      boolean;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pricing.component.html',
})
export class PricingComponent implements OnInit {

  // Use inject() so fb is available when `form` is initialised below
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  // ── Form ──────────────────────────────────────────────────────────────────
  form = this.fb.group({
    season:        ['', Validators.required],
    grade:         ['', Validators.required],
    pricePerKg:    [0, [Validators.required, Validators.min(1)]],
    effectiveFrom: ['', Validators.required],
    effectiveTo:   ['', Validators.required],
  });

  // ── State ─────────────────────────────────────────────────────────────────
  pricing  = signal<PricingRule[]>([]);
  loading  = signal(false);
  saving   = signal(false);
  error    = signal<string | null>(null);
  showForm = signal(false);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.http.get<PricingRule[]>(API_ENDPOINTS.COOPERATIVE.PRICING).subscribe({
      next:  data => { this.pricing.set(data);      this.loading.set(false); },
      error: err  => { this.error.set(err.message);  this.loading.set(false); },
    });
  }

  openForm(): void  { this.form.reset(); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.http.post<PricingRule>(API_ENDPOINTS.COOPERATIVE.PRICING, this.form.value).subscribe({
      next: rule => {
        this.pricing.update(p => [...p, rule]);
        this.saving.set(false);
        this.closeForm();
      },
      error: err => { this.error.set(err.message); this.saving.set(false); },
    });
  }
}
