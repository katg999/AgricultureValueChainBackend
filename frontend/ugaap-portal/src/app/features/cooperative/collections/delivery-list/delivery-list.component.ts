// ─────────────────────────────────────────────────────────────────────────────
// features/collections/delivery-list/delivery-list.component.ts
//
// Lists all farmer delivery records for the current branch.
// Supports live client-side filtering by search text and commodity category.
//
// Data pipeline:
//   DeliveryService.list() → HTTP GET → one-shot Observable
//   combineLatest([search$, category$, data$]) → filtered view
//
// Because list() completes after one emission, combineLatest continues
// re-filtering on every subsequent search/category change using the last
// emitted dataset.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Component, OnInit, OnDestroy,
  Inject, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule }         from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router }               from '@angular/router';

import { Subject, combineLatest } from 'rxjs';
import {
  startWith, takeUntil, map,
  debounceTime, distinctUntilChanged,
} from 'rxjs/operators';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent }     from '../../../../shared/components/button/button.component';

import { DeliveryService } from '../farmer-delivery.service';
import { DeliveryRecord }  from '../farmer-delivery.model';

@Component({
  selector: 'app-delivery-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, ButtonComponent],
  templateUrl: './delivery-list.component.html',
  styleUrls:   ['./delivery-list.component.css'],
})
export class DeliveryListComponent implements OnInit, OnDestroy {

  // ── Filter controls ───────────────────────────────────────────────────────
  searchControl   = new FormControl('',    { nonNullable: true });
  categoryFilter  = new FormControl('all', { nonNullable: true });

  // ── Filtered result ───────────────────────────────────────────────────────
  filteredDeliveries: DeliveryRecord[] = [];
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    // @Inject kept for backwards compatibility — it's the same as type injection here
    @Inject(DeliveryService) private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loading = true;
    this.buildFilterPipeline();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Pipeline ──────────────────────────────────────────────────────────────

  private buildFilterPipeline(): void {
    const search$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(200),
      distinctUntilChanged(),
    );

    const category$ = this.categoryFilter.valueChanges.pipe(
      startWith(this.categoryFilter.value),
      distinctUntilChanged(),
    );

    // GET /api/v1/branch/collections — emits once, then completes
    const data$ = this.deliveryService.list();

    combineLatest([search$, category$, data$])
      .pipe(
        takeUntil(this.destroy$),
        map(([term, cat, deliveries]) => {
          this.loading = false;
          const t = term.toLowerCase().trim();
          const c = cat.toLowerCase().trim();

          return deliveries.filter(d => {
            const matchSearch   = d.farmerName.toLowerCase().includes(t) ||
                                  d.id.toLowerCase().includes(t);
            const matchCategory = !c || c === 'all' || c === 'all categories' ||
                                  d.commodityCategory.toLowerCase() === c;
            return matchSearch && matchCategory;
          });
        }),
      )
      .subscribe({
        next: results => {
          this.filteredDeliveries = results;
          this.cdr.detectChanges();  // Push filtered results to the view immediately
        },
        error: err => {
          this.loading = false;
          this.error   = err?.error?.message ?? 'Failed to load deliveries.';
          this.cdr.detectChanges();
        },
      });
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  getRepaymentLabel(rule: string | undefined | null): string {
    const labels: Record<string, string> = {
      standard:    'Standard Post-Harvest Deduction (15%)',
      accelerated: 'Priority Recovery Deduction (25%)',
      deferred:    'No Linked Recovery Rule (0%)',
    };
    return rule ? (labels[rule] ?? labels['standard']) : 'No Linked Recovery Rule (0%)';
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  navigateToCreate(): void {
    this.router.navigate(['/collections/farmer-delivery/create']);
  }

  onView(id: string): void {
    this.router.navigate(['/collections/farmer-delivery', id]);
  }

  onEdit(id: string): void {
    this.router.navigate(['/collections/farmer-delivery', id, 'edit']);
  }
}
