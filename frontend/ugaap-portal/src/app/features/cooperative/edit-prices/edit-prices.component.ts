import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ToastService } from '../../../core/services/toast.service';
import { BranchService, BranchResponse } from '../../../core/services/branch.service';
import { CommodityService, CommodityResponse } from '../../../core/services/commodity.service';
import { GradeService, GradeResponse } from '../../../core/services/grade.service';
import { PriceService, PriceResponse } from '../../../core/services/price.service';
import { SessionService } from '../../../core/services/session.service';

import {
  DataTableComponent,
  TableColumn,
} from '../../../shared/components/data-table/data-table.component';
import { CellDirective } from '../../../shared/components/data-table/cell.directive';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../shared/components/input/input.component';

// ── Row shapes derived from PriceResponse for display ──────────────────────────
interface FlatPriceRow {
  id: string;
  commodityId: string;
  commodity: string;
  pricePerKg: number;
  branch: string; // branch NAME (matches what's stored on the backend)
}

interface GradePriceRow {
  id: string;
  commodityId: string;
  commodity: string;
  gradeId: string;
  gradeCode: string;
  gradeName: string;
  pricePerKg: number;
  branch: string;
}

@Component({
  selector: 'app-edit-prices',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    CellDirective,
    ButtonComponent,
    ModalComponent,
    InputComponent,
  ],
  templateUrl: './edit-prices.component.html',
  styleUrl: './edit-prices.component.css',
})
export class EditPricesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private branchService = inject(BranchService);
  private commodityService = inject(CommodityService);
  private gradeService = inject(GradeService);
  private priceService = inject(PriceService);
  private session = inject(SessionService);

  // ── Mode toggle ────────────────────────────────────────────────────────────
  gradeMode = signal(false);

  toggleMode(): void {
    this.gradeMode.update((v) => !v);
    this.closeModal();
  }

  // ── Loading state ────────────────────────────────────────────────────────
  isLoading = signal(true);

  // ── Datasets (now loaded from the backend, not seeded) ──────────────────
  flatEntries = signal<FlatPriceRow[]>([]);
  gradeEntries = signal<GradePriceRow[]>([]);

  get activeRows(): (FlatPriceRow | GradePriceRow)[] {
    return this.gradeMode() ? this.gradeEntries() : this.flatEntries();
  }

  // ── Table columns ──────────────────────────────────────────────────────────
  get columns(): TableColumn[] {
    const cols: TableColumn[] = [{ key: 'commodity', header: 'Commodity' }];
    if (this.gradeMode()) {
      cols.push({ key: 'grade', header: 'Grade' });
    }
    return [
      ...cols,
      { key: 'pricePerKg', header: 'Price / kg (UGX)', align: 'right' },
      { key: 'branch', header: 'Branch' },
      { key: 'actions', header: '', width: '80px' },
    ];
  }

  // ── Reference data — loaded from backend ────────────────────────────────
  commodityOptions: CommodityResponse[] = [];
  gradeOptions: GradeResponse[] = [];
  branchOptions: BranchResponse[] = [];

  branchLabel(name: string): string {
    return name;
  }

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    const tenantId = this.session.tenantId();
    if (!tenantId) {
      this.toast.error('No tenant context', 'Cannot load pricing data without a tenant context.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    forkJoin({
      commodities: this.commodityService.list(),
      grades: this.gradeService.list(),
      branches: this.branchService.listBranches(tenantId),
      prices: this.priceService.getAll(),
    }).subscribe({
      next: ({ commodities, grades, branches, prices }) => {
        this.commodityOptions = commodities;
        this.gradeOptions = grades;
        this.branchOptions = branches;
        this.splitPrices(prices);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error(
          'Failed to load pricing data',
          'Could not reach the configuration service.',
        );
        this.isLoading.set(false);
      },
    });
  }

  private splitPrices(prices: PriceResponse[]): void {
    const flat: FlatPriceRow[] = [];
    const grade: GradePriceRow[] = [];

    for (const p of prices) {
      const commodity = this.commodityOptions.find((c) => c.code === p.commodityCode);
      const commodityId = commodity?.id ?? '';

      if (p.gradeCode) {
        const gradeRef = this.gradeOptions.find((g) => g.code === p.gradeCode);
        grade.push({
          id: p.id,
          commodityId,
          commodity: p.commodityName,
          gradeId: gradeRef?.id ?? '',
          gradeCode: p.gradeCode,
          gradeName: p.gradeName ?? '',
          pricePerKg: p.newPrice,
          branch: p.branchName,
        });
      } else {
        flat.push({
          id: p.id,
          commodityId,
          commodity: p.commodityName,
          pricePerKg: p.newPrice,
          branch: p.branchName,
        });
      }
    }

    this.flatEntries.set(flat);
    this.gradeEntries.set(grade);
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  showModal = signal(false);
  editingId = signal<string | null>(null);
  isSaving = signal(false);

  form = this.fb.group({
    commodityId: ['', Validators.required],
    gradeId: [''],
    pricePerKg: [null as number | null, [Validators.required, Validators.min(1)]],
    branch: ['', Validators.required], // holds the branch NAME, not an id
  });

  get modalTitle(): string {
    return this.editingId() ? 'Edit Price Entry' : 'Add Price Entry';
  }

  get modalSubtitle(): string {
    return this.gradeMode()
      ? 'Set a price for a commodity and quality grade combination.'
      : 'Set a flat price for a commodity at a branch.';
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.reset();
    this.syncGradeValidator();
    this.showModal.set(true);
  }

  openEdit(row: FlatPriceRow | GradePriceRow): void {
    this.editingId.set(row.id);
    const g = row as GradePriceRow;
    this.form.patchValue({
      commodityId: row.commodityId,
      gradeId: g.gradeId ?? '',
      pricePerKg: row.pricePerKg,
      branch: row.branch,
    });
    this.syncGradeValidator();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const v = this.form.value;
    const commodity = this.commodityOptions.find((c) => c.id === v.commodityId);
    if (!commodity) {
      this.isSaving.set(false);
      return;
    }

    const request$ = this.gradeMode()
      ? this.priceService.setGradePrice({
          commodityId: v.commodityId!,
          gradeId: v.gradeId!,
          pricePerKg: v.pricePerKg!,
          branchName: v.branch!,
        })
      : this.priceService.setFlatPrice({
          commodityId: v.commodityId!,
          pricePerKg: v.pricePerKg!,
          branchName: v.branch!,
        });

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success(
          this.editingId() ? 'Price updated' : 'Price added',
          `${commodity.name} price has been saved successfully.`,
        );
        this.closeModal();
        this.loadAll(); // refresh from backend rather than mutating local state
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.error('Save failed', 'Could not save the price entry. Please try again.');
      },
    });
  }

  deleteRow(row: FlatPriceRow | GradePriceRow): void {
    // No DELETE endpoint exists yet on PriceController — flag for backend work.
    this.toast.error('Not yet supported', 'Deleting price entries is not yet available.');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  formatUGX(value: number): string {
    return new Intl.NumberFormat('en-UG').format(value);
  }

  getFieldError(field: string): string {
    const c = this.form.get(field);
    if (c?.touched && c.errors) {
      if (c.errors['required']) return 'This field is required';
      if (c.errors['min']) return 'Price must be greater than 0';
    }
    return '';
  }

  private syncGradeValidator(): void {
    const ctrl = this.form.get('gradeId')!;
    if (this.gradeMode()) {
      ctrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }
}
