// ─────────────────────────────────────────────────────────────────────────────
// features/collections/farmer-delivery/farmer-delivery.component.ts
//
// Create / View / Edit form for a single farmer delivery record.
//
// Mode is resolved from the URL:
//   /collections/farmer-delivery/create      → create mode
//   /collections/farmer-delivery/:id         → view mode  (form disabled)
//   /collections/farmer-delivery/:id/edit    → edit mode
//
// API calls:
//   create → POST   /api/v1/branch/collections
//   view   → GET    /api/v1/branch/collections/:id
//   edit   → PUT    /api/v1/branch/collections/:id
// ─────────────────────────────────────────────────────────────────────────────

import { Component, OnInit }    from '@angular/core';
import { CommonModule }         from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder, FormGroup, Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent }     from '../../../../shared/components/button/button.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

import { DeliveryService }         from '../farmer-delivery.service';
import { DeliveryRegistrationForm } from '../farmer-delivery.model';

type DeliveryFormMode = 'create' | 'view' | 'edit';

@Component({
  selector: 'app-farmer-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, ButtonComponent],
  templateUrl: './farmer-delivery.component.html',
  styleUrls:   ['./farmer-delivery.component.css'],
})
export class FarmerDeliveryComponent implements OnInit {

  deliveryForm!: FormGroup;
  mode:       DeliveryFormMode = 'create';
  deliveryId: string | null    = null;

  isSaving  = false;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb:              FormBuilder,
    private deliveryService: DeliveryService,
    private route:           ActivatedRoute,
    private router:          Router,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.initForm();
    this.resolveMode();
  }

  // ── Form setup ────────────────────────────────────────────────────────────

  private initForm(): void {
    this.deliveryForm = this.fb.group({
      isActive:          [true],
      farmerName:        ['', [Validators.required, Validators.minLength(3)]],
      commodityCategory: ['maize', Validators.required],
      quantity:          [null,    [Validators.required, Validators.min(0.1)]],
      unitOfMeasure:     ['KG',    Validators.required],
      estimatedValue:    [null,    [Validators.required, Validators.min(0)]],
      repaymentRule:     ['standard', Validators.required],
      notes:             ['',      Validators.maxLength(500)],
    });
  }

  private resolveMode(): void {
    this.deliveryId = this.route.snapshot.paramMap.get('id');

    // Determine mode from URL shape
    if (!this.deliveryId) {
      this.mode = 'create';
      this.deliveryForm.enable();
      return;
    }

    this.mode = this.route.snapshot.url.some(s => s.path === 'edit') ? 'edit' : 'view';

    // Load the existing record from the backend
    this.isLoading = true;
    this.deliveryService.getById(this.deliveryId).subscribe({
      next: delivery => {
        this.isLoading = false;
        this.deliveryForm.patchValue({
          isActive:          delivery.isActive,
          farmerName:        delivery.farmerName,
          commodityCategory: delivery.commodityCategory,
          quantity:          delivery.quantity,
          unitOfMeasure:     delivery.unitOfMeasure,
          estimatedValue:    delivery.estimatedValue,
          repaymentRule:     delivery.repaymentRule,
          notes:             delivery.notes ?? '',
        });

        // Lock the form in view mode
        this.mode === 'view' ? this.deliveryForm.disable() : this.deliveryForm.enable();
      },
      error: err => {
        this.isLoading = false;
        this.error = err?.error?.message ?? 'Could not load delivery record.';
        this.navigateToList();
      },
    });
  }

  // ── Template computed properties ──────────────────────────────────────────

  /** Section heading rendered inside the form card */
  get formSectionTitle(): string {
    const titles: Record<DeliveryFormMode, string> = {
      create: 'Delivery Details',
      view:   'Delivery Details',
      edit:   'Edit Delivery Details',
    };
    return titles[this.mode];
  }

  get pageTitle(): string {
    const titles: Record<DeliveryFormMode, string> = {
      create: 'New Farmer Delivery',
      view:   'View Farmer Delivery',
      edit:   'Edit Farmer Delivery',
    };
    return titles[this.mode];
  }

  get breadcrumb(): string[] {
    return ['Home', 'Collections', this.pageTitle];
  }

  get helperText(): string {
    if (this.mode === 'view') return 'Review the captured delivery details.';
    if (this.mode === 'edit') return 'Update the delivery details and save the changes.';
    return 'Please ensure all fields are filled out accurately before submitting.';
  }

  get submitLabel(): string {
    return this.mode === 'edit' ? 'Save changes' : 'Save delivery';
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  isFieldInvalid(field: string): boolean {
    const c = this.deliveryForm.get(field);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.mode === 'view') return;

    if (this.deliveryForm.invalid) {
      this._touchAll(this.deliveryForm);
      return;
    }

    const formValue = this.deliveryForm.getRawValue() as DeliveryRegistrationForm;

    this.isSaving = true;
    this.error    = null;

    if (this.mode === 'edit' && this.deliveryId) {
      // PUT /api/v1/branch/collections/:id
      this.deliveryService.update(this.deliveryId, formValue).subscribe({
        next:  () => { this.isSaving = false; this.navigateToList(); },
        error: err => { this.isSaving = false; this.error = err?.error?.message ?? 'Update failed.'; },
      });
    } else {
      // POST /api/v1/branch/collections
      this.deliveryService.create(formValue).subscribe({
        next:  () => { this.isSaving = false; this.navigateToList(); },
        error: err => { this.isSaving = false; this.error = err?.error?.message ?? 'Save failed.'; },
      });
    }
  }

  onCancel(): void {
    this.navigateToList();
  }

  onEdit(): void {
    if (this.deliveryId) {
      this.router.navigate(['/collections/farmer-delivery', this.deliveryId, 'edit']);
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private navigateToList(): void {
    this.router.navigate(['/collections/delivery-list']);
  }

  private _touchAll(group: FormGroup): void {
    Object.values(group.controls).forEach(c => {
      c.markAsTouched();
      if ((c as any).controls) this._touchAll(c as FormGroup);
    });
  }
}
