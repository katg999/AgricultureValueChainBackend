// inject() is the modern Angular way to pull in services.
// Think of it like saying "give me the tools I need" before doing any work.
// We declare these at the top so everything below can use them freely.
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentBatchService } from '../services/payment-batch.service';
import { FarmerRecord, BatchFilterCriteria } from '../models/batch.models';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-batch-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, InputComponent, ButtonComponent],
  templateUrl: './batch-create.component.html',
  styleUrls: ['./batch-create.component.css'],
})
export class BatchCreateComponent implements OnInit {
  // inject() asks Angular's DI system for these — no constructor needed.
  // fb = FormBuilder helps us build the form without writing boilerplate.
  // batchService = where all batch logic and data live (separated from the UI on purpose).
  // router = lets us navigate between pages programmatically.
  private readonly fb = inject(FormBuilder);
  private readonly batchService = inject(PaymentBatchService);
  private readonly router = inject(Router);

  // matchFarmers()/createBatch() below read the farmer pool synchronously, so kick off
  // the background fetch as early as possible — same fire-and-forget hydration every
  // other list page does before reading its service's BehaviorSubject directly.
  ngOnInit(): void {
    this.batchService.getAllFarmers().subscribe();
  }

  // Static dropdown options — hardcoded for now, would come from an API later.
  seasons = ['Season A 2024', 'Season B 2024', 'Season A 2025'];
  commodities = ['All Commodities', 'Coffee', 'Maize'];

  // A branch can only ever create a batch for itself — shown read-only for context,
  // not a choice. batchService derives the actual branchId from the session, not this.
  readonly branchName = this.batchService.getOwnBranchName();

  // signal() is Angular's reactive variable — when you call .set() on it,
  // every part of the template that reads it automatically re-renders.
  // Think of it like useState() in React if you've seen that before.
  previewEligible = signal<FarmerRecord[]>([]); // farmers who CAN be paid
  previewExcluded = signal<FarmerRecord[]>([]); // farmers skipped (missing bank details)
  hasPreviewed = signal(false);                 // controls whether the preview table shows
  createdBatchId = signal<string | null>(null); // null until a batch is actually saved

  // fb is already set above via inject(), so we can safely use this.fb here.
  // Each field: [defaultValue, validators]. Validators.required = can't be empty.
  form = this.fb.group({
    batchName:       ['', [Validators.required, Validators.minLength(3)]],
    season:          ['Season B 2024', Validators.required],
    openingDate:     ['', Validators.required],
    closingDate:     ['', Validators.required],
    commodityFilter: ['All Commodities', Validators.required],
  });

  // A getter is just a computed value — recalculates every time the template reads it.
  // reduce() walks the array and adds up all netPayable values into one total.
  get totalEligibleAmount(): number {
    return this.previewEligible().reduce((sum, f) => sum + f.netPayable, 0);
  }

  // Intl.NumberFormat is the browser's built-in currency formatter.
  // 'en-UG' = Uganda locale, 'UGX' = Uganda shillings, 0 decimal places (no cents).
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Returns an error string for <app-input>'s [error] binding.
  // Empty string = no error shown. Called after invalid && touched so errors only appear once the user leaves the field.
  getError(controlName: string): string {
    const ctrl = this.form.get(controlName);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return '';
    if (ctrl.hasError('required')) return 'Required.';
    if (ctrl.hasError('minlength')) {
      const min = ctrl.errors!['minlength'].requiredLength as number;
      return `Min ${min} characters.`;
    }
    return 'Invalid value.';
  }

  // "Preview" = show who would be in this batch WITHOUT actually saving anything.
  // Useful so the user can review before committing.
  onPreviewFarmers(): void {
    // Stop here if any required field is empty — markAllAsTouched() makes
    // the red error messages appear on every field the user skipped.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // getRawValue() reads all form fields as a plain object.
    // We cast it to BatchFilterCriteria so TypeScript knows the shape.
    const criteria = this.form.getRawValue() as BatchFilterCriteria;

    // The service does the actual filtering — returns two groups: eligible and excluded.
    // Destructuring pulls both out of the returned object in one line.
    const { eligible, excluded } = this.batchService.matchFarmers(criteria);

    // Update the signals — the template re-renders automatically.
    this.previewEligible.set(eligible);
    this.previewExcluded.set(excluded);
    this.hasPreviewed.set(true);
    // Clear any previous "batch created" banner since we're just previewing again.
    this.createdBatchId.set(null);
  }

  // "Create" = actually save the batch as a Draft in the service (and eventually the backend).
  onCreateBatch(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const criteria = this.form.getRawValue() as BatchFilterCriteria;

    // createBatch() persists the batch and returns it with a generated ID.
    const newBatch = this.batchService.createBatch(criteria);

    // Store the ID so the success banner can display it.
    this.createdBatchId.set(newBatch.id);

    // Re-run the filter so the preview table matches exactly what was saved.
    const { eligible, excluded } = this.batchService.matchFarmers(criteria);
    this.previewEligible.set(eligible);
    this.previewExcluded.set(excluded);
    this.hasPreviewed.set(true);
  }

  // Navigate to the batch list — used by the success banner's "Go to Batch List" link.
  onGoToBatchList(): void {
    this.router.navigate(['/branch/finance/batch-processing']);
  }

  // Cancel just takes the user back without saving anything.
  onCancel(): void {
    this.router.navigate(['/branch/finance/batch-processing']);
  }
}
