import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { SessionService } from '../../../../core/services/session.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { Season } from '../../collections/branch.delivery.model';
import { BatchRecord } from '../batch.model';
import { BatchService } from '../batch.service';

@Component({
  selector: 'app-batch-processing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, ModalComponent],
  templateUrl: './batch-processing.html',
  styleUrls: ['./batch-processing.css'],
})
export class BatchProcessingComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isModalOpen = false;
  batchForm!: FormGroup;
  batches: BatchRecord[] = [];

  selectedSeason: '' | Season = '';
  readonly seasons: Season[] = ['Wet Season', 'Dry Season'];

  get filteredBatches(): BatchRecord[] {
    if (!this.selectedSeason) return this.batches;
    return this.batches.filter(b => b.season === this.selectedSeason);
  }

  get groupedBatches(): { season: Season; batches: BatchRecord[] }[] {
    return this.seasons
      .map(season => ({ season, batches: this.filteredBatches.filter(b => b.season === season) }))
      .filter(g => g.batches.length > 0);
  }

  get totalGross(): number    { return this.filteredBatches.reduce((s, b) => s + b.grossAmount, 0); }
  get totalDeductions(): number { return this.filteredBatches.reduce((s, b) => s + b.deductions, 0); }
  get totalNetPayable(): number { return this.filteredBatches.reduce((s, b) => s + b.netPayable, 0); }
  get pendingCount(): number  { return this.filteredBatches.filter(b => b.status === 'pending').length; }

  constructor(
    private readonly fb: FormBuilder,
    private readonly batchService: BatchService,
    private readonly router: Router,
    private readonly session: SessionService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.batchService.batchesForRole$(this.session.branchId(), this.session.userRole())
      .pipe(takeUntil(this.destroy$))
      .subscribe(batches => { this.batches = batches; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setSeasonFilter(season: '' | Season): void {
    this.selectedSeason = season;
  }

  seasonClass(season: Season): string {
    return season === 'Wet Season' ? 'season-wet' : 'season-dry';
  }

  goToFarmers(batch: BatchRecord): void {
    this.router.navigate(['/branch/finance/batch', batch.id, 'farmers']);
  }

  openModal(): void {
    this.batchForm.reset();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmit(): void {
    if (this.batchForm.invalid) {
      this.batchForm.markAllAsTouched();
      return;
    }
    const raw = this.batchForm.getRawValue();
    this.batchService.addBatch({
      batchId: raw.batchId,
      batchName: raw.batchName,
      season: raw.season,
      branchId: this.session.branchId() ?? '',
    });
    this.closeModal();
  }

  trackByBatchId(_i: number, b: BatchRecord): string { return b.id; }
  trackBySeason(_i: number, g: { season: Season }): string { return g.season; }

  formatUGX(value: number): string {
    return new Intl.NumberFormat('en-UG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  private initForm(): void {
    this.batchForm = this.fb.group({
      batchName: ['', Validators.required],
      batchId:   ['', Validators.required],
      season:    ['', Validators.required],
    });
  }
}
