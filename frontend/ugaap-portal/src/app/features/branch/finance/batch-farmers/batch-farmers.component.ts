import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, take, takeUntil } from 'rxjs';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SessionService } from '../../../../core/services/session.service';
import { Season } from '../../collections/branch.delivery.model';
import { FarmerDelivery } from '../../collections/farmer.delivery.model';
import { FarmerDeliveryService } from '../../collections/farmer.delivery.service';
import {
  BankAccountPayment,
  BatchFarmerRecord,
  BatchRecord,
  MobileMoneyPayment,
  PaymentInfo,
} from '../batch.model';
import { BatchExportService } from '../batch-export.service';
import { BatchService } from '../batch.service';

const COMMODITIES = ['Coffee', 'Maize', 'Beans', 'Vanilla', 'Sesame', 'Tea', 'Sunflower', 'Cocoa'];

@Component({
  selector: 'app-batch-farmers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, ModalComponent],
  templateUrl: './batch-farmers.component.html',
  styleUrls: ['./batch-farmers.component.css'],
})
export class BatchFarmersComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  batch: BatchRecord | null = null;
  farmers$!: Observable<BatchFarmerRecord[]>;

  isModalOpen = false;
  editingFarmer: BatchFarmerRecord | null = null;
  farmerForm!: FormGroup;
  openMenuId: string | null = null;

  /** Tracks which payment method section is shown in the modal. */
  selectedPaymentMethod: 'mobile_money' | 'bank_account' | '' = '';

  /** Farmer deliveries matching the batch season, excluding already-added farmers. */
  availableDeliveries: FarmerDelivery[] = [];

  readonly commodities = COMMODITIES;
  readonly statusOptions = ['pending', 'processed', 'settled'] as const;

  get modalTitle(): string {
    return this.editingFarmer ? 'Edit Farmer Entry' : 'Add Farmer to Batch';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly batchService: BatchService,
    private readonly exportService: BatchExportService,
    private readonly deliveryService: FarmerDeliveryService,
    private readonly session: SessionService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();
    const batchId = this.route.snapshot.paramMap.get('id') ?? '';
    this.batch = this.batchService.getBatch(batchId) ?? null;
    this.farmers$ = this.batchService.farmersForBatch$(batchId);

    this.batchService.batches$
      .pipe(takeUntil(this.destroy$))
      .subscribe(batches => {
        const updated = batches.find(b => b.id === batchId);
        if (updated) this.batch = updated;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click')
  onDocumentClick(): void { this.closeMenu(); }

  seasonClass(season: Season): string {
    return season === 'Wet Season' ? 'season-wet' : 'season-dry';
  }

  goBack(): void {
    this.router.navigate(['/branch/finance/batch-processing']);
  }

  // ── Export ─────────────────────────────────────────────────────

  exportCsv(farmers: BatchFarmerRecord[]): void {
    if (!this.batch) return;
    this.exportService.exportBatchFarmers(this.batch, farmers);
  }

  // ── Kebab menu ─────────────────────────────────────────────────

  toggleMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  closeMenu(): void {
    this.openMenuId = null;
  }

  // ── Payment method ─────────────────────────────────────────────

  setPaymentMethod(method: 'mobile_money' | 'bank_account' | ''): void {
    this.selectedPaymentMethod = method;
    this.clearPaymentValidators();

    if (method === 'mobile_money') {
      this.farmerForm.get('mmProvider')!.setValidators(Validators.required);
      this.farmerForm.get('mmAccountName')!.setValidators(Validators.required);
    } else if (method === 'bank_account') {
      this.farmerForm.get('bankName')!.setValidators(Validators.required);
      this.farmerForm.get('accountNumber')!.setValidators(Validators.required);
      this.farmerForm.get('accountHolderName')!.setValidators(Validators.required);
    }
    this.farmerForm.get('mmProvider')!.updateValueAndValidity();
    this.farmerForm.get('mmAccountName')!.updateValueAndValidity();
    this.farmerForm.get('bankName')!.updateValueAndValidity();
    this.farmerForm.get('accountNumber')!.updateValueAndValidity();
    this.farmerForm.get('accountHolderName')!.updateValueAndValidity();
  }

  private clearPaymentValidators(): void {
    for (const field of ['mmProvider', 'mmAccountName', 'bankName', 'accountNumber', 'accountHolderName']) {
      this.farmerForm.get(field)!.clearValidators();
    }
  }

  paymentLabel(farmer: BatchFarmerRecord): string {
    if (!farmer.payment) return '—';
    if (farmer.payment.method === 'mobile_money') return farmer.payment.provider;
    return 'Bank';
  }

  paymentDetail(farmer: BatchFarmerRecord): string {
    if (!farmer.payment) return '';
    if (farmer.payment.method === 'mobile_money') return farmer.payment.mobileMoneyName;
    return farmer.payment.bankName;
  }

  paymentBadgeClass(farmer: BatchFarmerRecord): string {
    if (!farmer.payment) return '';
    return farmer.payment.method === 'mobile_money'
      ? (farmer.payment.provider === 'MTN' ? 'pay-badge--mtn' : 'pay-badge--airtel')
      : 'pay-badge--bank';
  }

  // ── Modal ──────────────────────────────────────────────────────

  openAddModal(): void {
    if (!this.batch) return;
    this.editingFarmer = null;
    this.selectedPaymentMethod = '';
    this.clearPaymentValidators();
    this.farmerForm.reset({ status: 'pending' });
    this.farmerForm.get('netPayable')?.setValue(null, { emitEvent: false });

    // Build the picker: season-matched deliveries minus farmers already in this batch.
    this.batchService.farmersForBatch$(this.batch.id).pipe(take(1)).subscribe(existing => {
      const alreadyAdded = new Set(existing.map(f => f.farmerId));
      this.deliveryService.allForRole$(this.session.branchId(), this.session.userRole()).pipe(take(1)).subscribe(deliveries => {
        this.availableDeliveries = deliveries.filter(
          d => d.season === this.batch!.season && !alreadyAdded.has(d.farmerId)
        );
      });
    });

    this.isModalOpen = true;
  }

  onDeliverySelect(deliveryId: string): void {
    if (!deliveryId) return;
    const d = this.availableDeliveries.find(fd => fd.id === deliveryId);
    if (!d) return;
    this.farmerForm.patchValue({
      farmerId:    d.farmerId,
      farmerName:  d.farmerName,
      phone:       d.phone,
      commodity:   d.commodity,
      grossAmount: d.estimatedValue,
    });
    this.recalcNet();
  }

  openEditModal(farmer: BatchFarmerRecord): void {
    this.closeMenu();
    this.editingFarmer = farmer;

    const pm = farmer.payment?.method ?? '';
    this.setPaymentMethod(pm as 'mobile_money' | 'bank_account' | '');

    this.farmerForm.patchValue({
      farmerId:    farmer.farmerId,
      farmerName:  farmer.farmerName,
      phone:       farmer.phone,
      commodity:   farmer.commodity,
      grossAmount: farmer.grossAmount,
      deductions:  farmer.deductions,
      netPayable:  farmer.netPayable,
      status:      farmer.status,
      // mobile money
      mmProvider:      farmer.payment?.method === 'mobile_money' ? farmer.payment.provider        : '',
      mmAccountName:   farmer.payment?.method === 'mobile_money' ? farmer.payment.mobileMoneyName : '',
      // bank
      bankName:         farmer.payment?.method === 'bank_account' ? farmer.payment.bankName          : '',
      accountNumber:    farmer.payment?.method === 'bank_account' ? farmer.payment.accountNumber     : '',
      accountHolderName: farmer.payment?.method === 'bank_account' ? farmer.payment.accountHolderName : '',
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingFarmer = null;
    this.selectedPaymentMethod = '';
  }

  onSubmit(): void {
    if (this.farmerForm.invalid || !this.batch) {
      this.farmerForm.markAllAsTouched();
      return;
    }

    const raw = this.farmerForm.getRawValue();
    const payment = this.buildPaymentInfo(raw);

    const data = {
      farmerId:    raw.farmerId,
      farmerName:  raw.farmerName,
      phone:       raw.phone,
      commodity:   raw.commodity,
      grossAmount: Number(raw.grossAmount),
      deductions:  Number(raw.deductions),
      status:      raw.status,
      ...(payment ? { payment } : {}),
    };

    if (this.editingFarmer) {
      this.batchService.updateFarmer(this.editingFarmer.id, data);
    } else {
      this.batchService.addFarmer(this.batch.id, data);
    }
    this.closeModal();
  }

  onRemove(farmer: BatchFarmerRecord): void {
    this.closeMenu();
    if (!confirm(`Remove ${farmer.farmerName} from this batch?`)) return;
    this.batchService.removeFarmer(farmer.id);
  }

  trackByFarmerId(_i: number, f: BatchFarmerRecord): string { return f.id; }

  formatUGX(value: number): string {
    return new Intl.NumberFormat('en-UG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  private buildPaymentInfo(raw: Record<string, unknown>): PaymentInfo | undefined {
    if (this.selectedPaymentMethod === 'mobile_money') {
      return {
        method: 'mobile_money',
        provider: raw['mmProvider'] as 'MTN' | 'Airtel',
        mobileMoneyName: raw['mmAccountName'] as string,
      } satisfies MobileMoneyPayment;
    }
    if (this.selectedPaymentMethod === 'bank_account') {
      return {
        method: 'bank_account',
        bankName: raw['bankName'] as string,
        accountNumber: raw['accountNumber'] as string,
        accountHolderName: raw['accountHolderName'] as string,
      } satisfies BankAccountPayment;
    }
    return undefined;
  }

  private initForm(): void {
    this.farmerForm = this.fb.group({
      farmerId:    [''],
      farmerName:  ['', Validators.required],
      phone:       [''],
      commodity:   ['', Validators.required],
      grossAmount: [null, [Validators.required, Validators.min(0)]],
      deductions:  [null, [Validators.required, Validators.min(0)]],
      netPayable:  [{ value: null, disabled: true }],
      status:      ['pending', Validators.required],
      // payment fields — validators applied dynamically via setPaymentMethod()
      mmProvider:        [''],
      mmAccountName:     [''],
      bankName:          [''],
      accountNumber:     [''],
      accountHolderName: [''],
    });

    this.farmerForm.get('grossAmount')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalcNet());

    this.farmerForm.get('deductions')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalcNet());
  }

  private recalcNet(): void {
    const gross = Number(this.farmerForm.get('grossAmount')?.value) || 0;
    const ded   = Number(this.farmerForm.get('deductions')?.value)  || 0;
    this.farmerForm.get('netPayable')?.setValue(gross - ded, { emitEvent: false });
  }
}
