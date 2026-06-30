import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ToastService }    from '../../../core/services/toast.service';
import { GradingService }  from '../../../core/services/grading.service';
import { USE_MOCK }        from '../../../core/mock/mock-config';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { CellDirective }   from '../../../shared/components/data-table/cell.directive';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ModalComponent }  from '../../../shared/components/modal/modal.component';
import { InputComponent }  from '../../../shared/components/input/input.component';

// ── Data models ───────────────────────────────────────────────────────────────

// One row in the table when grade mode is OFF — commodity has a single flat price.
export interface FlatPriceEntry {
  id: string;
  commodity: string;
  pricePerKg: number;
  // 'all' = applies cooperative-wide; a branchId = applies to that branch only
  // (branch-specific rows override the 'all' row for the same commodity)
  branch: string;
  effectiveFrom: string;
  effectiveTo: string;
}

// One row in the table when grade mode is ON — price depends on commodity AND grade.
export interface GradePriceEntry {
  id: string;
  commodity: string;
  gradeCode: string;  // e.g. 'A'
  gradeName: string;  // e.g. 'Premium' — resolved from grade definitions
  pricePerKg: number;
  branch: string;
  effectiveFrom: string;
  effectiveTo: string;
}

// ── Seed data (replaced by real API responses in production) ─────────────────

const SEED_FLAT: FlatPriceEntry[] = [
  { id: 'FP-1', commodity: 'Maize',  pricePerKg: 2_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'FP-2', commodity: 'Coffee', pricePerKg: 6_000, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'FP-3', commodity: 'Beans',  pricePerKg: 2_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'FP-4', commodity: 'Rice',   pricePerKg: 3_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
];

const SEED_GRADE: GradePriceEntry[] = [
  { id: 'GP-1', commodity: 'Maize',  gradeCode: 'A', gradeName: 'Premium',   pricePerKg: 3_250, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-2', commodity: 'Maize',  gradeCode: 'B', gradeName: 'Standard',  pricePerKg: 2_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-3', commodity: 'Maize',  gradeCode: 'C', gradeName: 'Low Grade', pricePerKg: 1_750, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-4', commodity: 'Coffee', gradeCode: 'A', gradeName: 'Premium',   pricePerKg: 7_800, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-5', commodity: 'Coffee', gradeCode: 'B', gradeName: 'Standard',  pricePerKg: 6_000, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-6', commodity: 'Beans',  gradeCode: 'A', gradeName: 'Premium',   pricePerKg: 3_250, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  { id: 'GP-7', commodity: 'Beans',  gradeCode: 'B', gradeName: 'Standard',  pricePerKg: 2_500, branch: 'all', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
];

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
export class EditPricesComponent {

  private fb      = inject(FormBuilder);
  private toast   = inject(ToastService);
  private grading = inject(GradingService);

  // ── Mode toggle ────────────────────────────────────────────────────────────

  // true = grade mode (Commodity + Grade + Price); false = flat mode (Commodity + Price only)
  gradeMode = signal(false);

  toggleMode(): void {
    this.gradeMode.update(v => !v);
    // Close any open modal when switching modes so the form doesn't carry stale values.
    this.closeModal();
  }

  // ── Datasets ───────────────────────────────────────────────────────────────

  // Two completely separate datasets — the table shows only the active one.
  // Start empty when mock mode is off — real API responses will populate these.
  flatEntries  = signal<FlatPriceEntry[]>(USE_MOCK  ? [...SEED_FLAT]  : []);
  gradeEntries = signal<GradePriceEntry[]>(USE_MOCK ? [...SEED_GRADE] : []);

  get activeRows(): (FlatPriceEntry | GradePriceEntry)[] {
    return this.gradeMode() ? this.gradeEntries() : this.flatEntries();
  }

  // ── Table columns ──────────────────────────────────────────────────────────

  // The Grade column is added between Commodity and Price only when grade mode is ON.
  get columns(): TableColumn[] {
    const cols: TableColumn[] = [{ key: 'commodity', header: 'Commodity' }];
    if (this.gradeMode()) {
      cols.push({ key: 'grade', header: 'Grade' });
    }
    return [
      ...cols,
      { key: 'pricePerKg',    header: 'Price / kg (UGX)', align: 'right' },
      { key: 'branch',        header: 'Branch' },
      { key: 'effectiveFrom', header: 'Eff. From' },
      { key: 'effectiveTo',   header: 'Eff. To' },
      { key: 'actions',       header: '', width: '80px' },
    ];
  }

  // ── Reference data ─────────────────────────────────────────────────────────

  // Grade dropdown options come from GradingService so they reflect the configured grade definitions.
  get gradeOptions() { return this.grading.grades; }

  readonly branchOptions = [
    { id: 'all',    name: 'All Branches' },
    { id: 'BR-KLA', name: 'Kampala Central Branch' },
    { id: 'BR-JIN', name: 'Jinja Branch' },
    { id: 'BR-MBA', name: 'Mbarara Branch' },
    { id: 'BR-FTP', name: 'Fort Portal Branch' },
    { id: 'BR-ADJ', name: 'Adjumani Branch' },
    { id: 'BR-GUL', name: 'Gulu Branch' },
    { id: 'BR-MBL', name: 'Mbale Branch' },
  ];

  branchLabel(id: string): string {
    return this.branchOptions.find(b => b.id === id)?.name ?? id;
  }

  // ── Modal ──────────────────────────────────────────────────────────────────

  showModal = signal(false);
  editingId = signal<string | null>(null); // null means "adding a new row"
  isSaving  = signal(false);

  form = this.fb.group({
    commodity:     ['', Validators.required],
    gradeCode:     [''],  // validator is added/removed dynamically based on gradeMode
    pricePerKg:    [null as number | null, [Validators.required, Validators.min(1)]],
    branch:        ['all', Validators.required],
    effectiveFrom: ['', Validators.required],
    effectiveTo:   ['', Validators.required],
  });

  get modalTitle(): string {
    return this.editingId() ? 'Edit Price Entry' : 'Add Price Entry';
  }

  get modalSubtitle(): string {
    return this.gradeMode()
      ? 'Set a price for a commodity and quality grade combination.'
      : 'Set a flat price for a commodity across branches.';
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.reset({ branch: 'all' });
    this.syncGradeValidator();
    this.showModal.set(true);
  }

  openEdit(row: FlatPriceEntry | GradePriceEntry): void {
    this.editingId.set(row.id);
    const g = row as GradePriceEntry;
    this.form.patchValue({
      commodity:     row.commodity,
      gradeCode:     g.gradeCode ?? '',
      pricePerKg:    row.pricePerKg,
      branch:        row.branch,
      effectiveFrom: row.effectiveFrom,
      effectiveTo:   row.effectiveTo,
    });
    this.syncGradeValidator();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.form.reset({ branch: 'all' });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSaving.set(true);
    const v = this.form.value;

    // Simulate the async API round-trip — replace with real HTTP call later.
    setTimeout(() => {
      if (this.gradeMode()) {
        const grade = this.gradeOptions.find(g => g.code === v.gradeCode)!;
        const entry: GradePriceEntry = {
          id:            this.editingId() ?? `GP-${Date.now()}`,
          commodity:     v.commodity!,
          gradeCode:     grade.code,
          gradeName:     grade.name,
          pricePerKg:    v.pricePerKg!,
          branch:        v.branch!,
          effectiveFrom: v.effectiveFrom!,
          effectiveTo:   v.effectiveTo!,
        };
        if (this.editingId()) {
          this.gradeEntries.update(rows => rows.map(r => r.id === entry.id ? entry : r));
        } else {
          this.gradeEntries.update(rows => [...rows, entry]);
        }
      } else {
        const entry: FlatPriceEntry = {
          id:            this.editingId() ?? `FP-${Date.now()}`,
          commodity:     v.commodity!,
          pricePerKg:    v.pricePerKg!,
          branch:        v.branch!,
          effectiveFrom: v.effectiveFrom!,
          effectiveTo:   v.effectiveTo!,
        };
        if (this.editingId()) {
          this.flatEntries.update(rows => rows.map(r => r.id === entry.id ? entry : r));
        } else {
          this.flatEntries.update(rows => [...rows, entry]);
        }
      }

      this.isSaving.set(false);
      this.toast.success(
        this.editingId() ? 'Price updated' : 'Price added',
        `${v.commodity} price has been ${this.editingId() ? 'updated' : 'saved'} successfully.`,
      );
      this.closeModal();
    }, 400);
  }

  deleteRow(row: FlatPriceEntry | GradePriceEntry): void {
    if (!confirm(`Remove the price entry for "${row.commodity}"? This cannot be undone.`)) return;
    if (this.gradeMode()) {
      this.gradeEntries.update(rows => rows.filter(r => r.id !== row.id));
    } else {
      this.flatEntries.update(rows => rows.filter(r => r.id !== row.id));
    }
    this.toast.success('Entry removed', 'The price entry has been deleted.');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  formatUGX(value: number): string {
    return new Intl.NumberFormat('en-UG').format(value);
  }

  getFieldError(field: string): string {
    const c = this.form.get(field);
    if (c?.touched && c.errors) {
      if (c.errors['required']) return 'This field is required';
      if (c.errors['min'])      return 'Price must be greater than 0';
    }
    return '';
  }

  // gradeCode is only required in grade mode — keep validators in sync with the toggle.
  private syncGradeValidator(): void {
    const ctrl = this.form.get('gradeCode')!;
    if (this.gradeMode()) {
      ctrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }
}
