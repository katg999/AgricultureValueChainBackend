import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, merge, EMPTY } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SessionService } from '../../../../core/services/session.service';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';
import { SeasonConfigService } from '../../../../core/services/season-config.service';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { FarmerDeliveryService } from '../farmer.delivery.service';
import { FarmerDelivery } from '../farmer.delivery.model';
import { ALL_DELIVERY_SESSIONS, DeliverySession, Season } from '../branch.delivery.model';
import { FarmerService } from '../../../../core/services/farmer.service';
import {
  CooperativePricingService,
  GradeOption,
} from '../../../../core/services/cooperative-pricing.service';

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  branch: string;
  branchId: string | null;
  currentSeason: Season;
  currentSession?: DeliverySession;
}

const BRANCH_NAMES: Record<string, string> = {
  'BR-KLA': 'Kampala Central',
  'BR-JIN': 'Jinja East',
  'BR-MBA': 'Mbarara South',
  'BR-FTP': 'Fort Portal West',
  'BR-ADJ': 'Adjumani East',
  'BR-GUL': 'Gulu North',
  'BR-MBL': 'Mbale West',
  'BR-KIB': 'Kiboga Central',
  'BR-LIR': 'Lira Town',
  'BR-MBA2': 'Mbale East',
};

export function ugandaPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const cleaned = String(control.value).replace(/\s/g, '');
    const valid = /^(07\d{8}|\+2567\d{8})$/.test(cleaned);
    return valid ? null : { invalidPhone: true };
  };
}

export function positiveNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = parseFloat(control.value);
    if (isNaN(val) || val <= 0) return { notPositive: true };
    return null;
  };
}

@Component({
  selector: 'app-farmer-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  templateUrl: './farmer-delivery.component.html',
  styleUrls: ['./farmer-delivery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerDeliveriesComponent implements OnInit, OnDestroy {
  deliveryForm!: FormGroup;
  selectedFarmer: Farmer | null = null;
  isSearching = false;

  allFarmers: Farmer[] = [];
  filteredFarmers: Farmer[] = [];
  showDropdown = false;

  submitted = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  formSubmitAttempted = false;
  useGrades = false;

  readonly branches = Object.values(BRANCH_NAMES);
  readonly commodities = [
    'Maize',
    'Coffee',
    'Beans',
    'Rice',
    'Sunflower',
    'Cassava',
    'Tea',
    'Sesame',
    'Vanilla',
    'Sorghum',
    'Millet',
  ];
  readonly seasonOptions: Season[] = ['Wet Season', 'Dry Season'];

  get sessionOptions(): DeliverySession[] {
    return ALL_DELIVERY_SESSIONS.filter((s) => !this.sessionConfig.isSessionPassed(s));
  }

  get isSeasonBlocked(): boolean {
    return !this.seasonConfig.isDeliveryAllowed();
  }

  get isSessionBlocked(): boolean {
    return this.sessionOptions.length === 0;
  }

  get isFormBlocked(): boolean {
    return this.isSeasonBlocked || this.isSessionBlocked;
  }

  get gradeOptions(): GradeOption[] {
    return this.pricingService.gradeOptions;
  }

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly deliveryService: FarmerDeliveryService,
    private readonly session: SessionService,
    private readonly sessionConfig: DeliverySessionConfigService,
    private readonly seasonConfig: SeasonConfigService,
    public readonly pricingService: CooperativePricingService,
    private readonly farmerService: FarmerService,
  ) {}

  ngOnInit(): void {
    this.buildForm();

    this.pricingService.useGrades$.pipe(takeUntil(this.destroy$)).subscribe((v) => {
      this.useGrades = v;
      this.updateGradeValidators();
      this.cdr.markForCheck();
    });

    this.watchValueChanges();

    this.deliveryService.deliveries$.pipe(takeUntil(this.destroy$)).subscribe((records) => {
      if (records && records.length > 0) {
        this.allFarmers = this.buildFarmerRegistry(records);
        this.cdr.markForCheck();
      }
    });

    this.deliveryService.getPaginated(0, 50).pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.deliveryForm = this.fb.group({
      farmerSearch: ['', Validators.required],
      phone: ['', [ugandaPhoneValidator()]],
      branch: [BRANCH_NAMES[this.session.branchId() ?? ''] ?? '', Validators.required],
      commodity: ['', Validators.required],
      grade: [''],
      volume: [null, [Validators.required, positiveNumberValidator()]],
      volumeUnit: ['KG'],
      unitPrice: [{ value: null, disabled: true }],
      estimatedValue: [{ value: null, disabled: true }],
      notes: [''],
      season: [this.seasonConfig.activeSeason() ?? 'Wet Season', Validators.required],
      session: [this.sessionOptions[0] ?? null],
    });
  }

  private updateGradeValidators(): void {
    const gradeCtrl = this.deliveryForm?.get('grade');
    if (!gradeCtrl) return;

    if (this.useGrades) {
      gradeCtrl.setValidators([Validators.required]);
    } else {
      gradeCtrl.clearValidators();
      gradeCtrl.setValue('', { emitEvent: false });
    }
    gradeCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private buildFarmerRegistry(records: FarmerDelivery[]): Farmer[] {
    const seen = new Set<string>();
    return records.reduce<Farmer[]>((acc, r) => {
      if (r.farmerId && !seen.has(r.farmerId)) {
        seen.add(r.farmerId);
        acc.push({
          id: r.farmerId,
          name: r.farmerName,
          phone: r.notes || '',
          branch: BRANCH_NAMES[this.session.branchId() ?? ''] ?? '',
          branchId: null,
          currentSeason: r.season as Season,
          currentSession: r.session as DeliverySession,
        });
      }
      return acc;
    }, []);
  }

  private watchValueChanges(): void {
    this.deliveryForm
      .get('volume')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calcEstValue());

    merge(
      this.deliveryForm.get('commodity')?.valueChanges ?? EMPTY,
      this.deliveryForm.get('grade')?.valueChanges ?? EMPTY,
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateUnitPrice());
  }

  private updateUnitPrice(): void {
    const commodity = this.deliveryForm.get('commodity')?.value ?? '';
    const gradeCode = this.deliveryForm.get('grade')?.value ?? '';
    const branchId = this.session.branchId() ?? '';

    const price = commodity
      ? this.pricingService.getUnitPrice(
          branchId,
          commodity,
          this.useGrades ? gradeCode : undefined,
        )
      : 0;

    this.deliveryForm.patchValue({ unitPrice: price || null }, { emitEvent: false });
    this.calcEstValue();
    this.cdr.markForCheck();
  }

  onFarmerSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.trim();

    if (!query) {
      this.filteredFarmers = [];
      this.showDropdown = false;
      this.cdr.markForCheck();
      return;
    }

    this.isSearching = true;
    this.cdr.markForCheck();

    this.farmerService
      .search(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.filteredFarmers = results.map((r) => ({
            id: r.memberId,
            name: r.fullName,
            phone: '',
            branch: '',
            branchId: r.branchId,
            currentSeason: this.seasonConfig.activeSeason() ?? 'Wet Season',
          }));
          this.showDropdown = true;
          this.isSearching = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSearching = false;
          this.cdr.markForCheck();
        },
      });
  }

  selectFarmer(farmer: Farmer): void {
    this.selectedFarmer = farmer;
    this.showDropdown = false;

    const session =
      farmer.currentSession && this.sessionOptions.includes(farmer.currentSession)
        ? farmer.currentSession
        : this.sessionOptions[0];

    this.deliveryForm.patchValue({
      farmerSearch: `${farmer.name} (${farmer.id})`,
      phone: farmer.phone,
      branch: farmer.branchId ?? 'N/A', // use branchId as display value
      season: farmer.currentSeason,
      session,
    });
    this.cdr.markForCheck();
  }

  clearFarmer(): void {
    this.selectedFarmer = null;
    this.deliveryForm.patchValue({
      farmerSearch: '',
      phone: '',
      branch: BRANCH_NAMES[this.session.branchId() ?? ''] ?? '',
    });
    this.cdr.markForCheck();
  }
  onSearchBlur(): void {
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.markForCheck();
    }, 150);
  }

  getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
  }

  calcEstValue(): void {
    const volume = parseFloat(this.deliveryForm.get('volume')?.value) || 0;
    const unitPrice = parseFloat(this.deliveryForm.getRawValue().unitPrice) || 0;
    const gross = volume * unitPrice;

    this.deliveryForm.patchValue({ estimatedValue: gross > 0 ? gross : null });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.formSubmitAttempted = true;

    if (this.isSeasonBlocked) {
      this.errorMessage = 'No active season is currently open. Recording blocked.';
      this.cdr.markForCheck();
      return;
    }

    if (this.isSessionBlocked) {
      this.errorMessage = 'All delivery windows for today have passed.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.selectedFarmer) {
      this.deliveryForm.get('farmerSearch')?.setErrors({ farmerRequired: true });
    }

    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const payload = this.buildPayload();

    this.deliveryService
      .create(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.onSaveSuccess(payload.farmerName),
        error: (err: any) => this.onSaveError(err),
      });
  }

  private buildPayload() {
    const v = this.deliveryForm.getRawValue();
    return {
      farmerName: this.selectedFarmer?.name || v.farmerSearch,
      commodity: v.commodity,
      volume: parseFloat(v.volume),
      season: v.season,
      session: v.session || undefined,
      notes: v.notes || '',
    };
  }

  private onSaveSuccess(farmerName: string): void {
    this.isSaving = false;
    this.submitted = true;
    this.successMessage = `Delivery for ${farmerName} logged successfully to the ledger.`;
    this.cdr.markForCheck();
    setTimeout(() => this.goToBranchDeliveries(), 1500);
  }

  private onSaveError(err: any): void {
    this.isSaving = false;
    console.error('[FarmerDeliveries] Save execution failed:', err);
    this.errorMessage =
      err.error?.message || 'Failed to record entry. Please check server connections and retry.';
    this.cdr.markForCheck();
  }

  goToBranchDeliveries(): void {
    this.router.navigate(['/branch/collections/deliveries']);
  }

  sessionLabel(id: DeliverySession | undefined): string {
    return this.sessionConfig.getLabel(id);
  }

  isFieldInvalid(controlName: string): boolean {
    const ctrl = this.deliveryForm.get(controlName);
    if (!ctrl) return false;
    return ctrl.invalid && (ctrl.touched || this.formSubmitAttempted);
  }
}

export { FarmerDeliveriesComponent as AddFarmerDeliveryComponent };
