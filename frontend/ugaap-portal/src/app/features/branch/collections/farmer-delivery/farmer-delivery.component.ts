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
import { DeliverySession, FarmerDelivery, FarmerDeliveryFormData, SaveFarmerDeliveryPayload } from '../farmer.delivery.model';
import { ALL_DELIVERY_SESSIONS, Season } from '../branch.delivery.model';
import { CooperativePricingService, GradeOption } from '../../../../core/services/cooperative-pricing.service';

// ── Farmer model (used by the autocomplete dropdown) ──────────────────────────

// A lightweight view of a registered farmer — built from delivery records.
// Enough info to display in the dropdown and pre-fill the form.
export interface Farmer {
  id: string;
  name: string;
  phone: string;
  branch: string;
  currentSeason: Season;
  currentSession?: DeliverySession;
}

// Maps branch IDs (from SessionService) to readable names for the Branch field.
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

// ── Custom validators ─────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-farmer-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent],
  templateUrl: './farmer-delivery.component.html',
  styleUrls: ['./farmer-delivery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerDeliveriesComponent implements OnInit, OnDestroy {

  // ── Form state ────────────────────────────────────────────────────────────

  deliveryForm!: FormGroup;

  // The farmer selected from the autocomplete — required before submission.
  selectedFarmer: Farmer | null = null;

  // The full list of farmers loaded from the registry; filteredFarmers is a subset.
  allFarmers: Farmer[] = [];
  filteredFarmers: Farmer[] = [];
  showDropdown = false;

  submitted    = false;
  isSaving     = false;
  successMessage  = '';
  errorMessage    = '';
  redirectProgress = 0;
  formSubmitAttempted = false;

  // Tracks the cooperative's grade toggle so the template can show/hide the grade field.
  useGrades = false;

  // ── Reference data ─────────────────────────────────────────────────────────

  readonly branches = Object.values(BRANCH_NAMES);

  readonly commodities = [
    'Maize', 'Coffee', 'Beans', 'Rice',
    'Sunflower', 'Cassava', 'Tea', 'Sesame',
    'Vanilla', 'Sorghum', 'Millet',
  ];

  readonly seasonOptions: Season[] = ['Wet Season', 'Dry Season'];

  // Only sessions whose time window hasn't passed today are offered.
  get sessionOptions(): DeliverySession[] {
    return ALL_DELIVERY_SESSIONS.filter(s => !this.sessionConfig.isSessionPassed(s));
  }

  // True when no season is open — blocks the entire form.
  get isSeasonBlocked(): boolean {
    return !this.seasonConfig.isDeliveryAllowed();
  }

  // True when all today's sessions have closed — blocks submit independently of season.
  get isSessionBlocked(): boolean {
    return this.sessionOptions.length === 0;
  }

  get isFormBlocked(): boolean {
    return this.isSeasonBlocked || this.isSessionBlocked;
  }

  // Exposed for the template's *ngFor on the grade dropdown.
  get gradeOptions(): GradeOption[] {
    return this.pricingService.gradeOptions;
  }

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private deliveryService: FarmerDeliveryService,
    private session: SessionService,
    private sessionConfig: DeliverySessionConfigService,
    private seasonConfig: SeasonConfigService,
    // Public so the template can call pricingService.useGrades directly if needed.
    public pricingService: CooperativePricingService,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.buildForm();

    // Subscribe to the cooperative-wide grade toggle so the grade field
    // appears / disappears immediately if an admin changes it elsewhere.
    this.pricingService.useGrades$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.useGrades = v;
      this.updateGradeValidators();
      this.cdr.markForCheck();
    });

    this.watchValueChanges();

    // Populate the farmer autocomplete from the existing delivery registry.
    // Using delivery records as the registry keeps farmer names/IDs in sync
    // without needing a separate farmers endpoint right now.
    this.deliveryService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(records => {
        this.allFarmers = this.buildFarmerRegistry(records);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  private buildForm(): void {
    this.deliveryForm = this.fb.group({

      // farmerSearch drives the autocomplete input; the actual farmer object
      // is stored in this.selectedFarmer — both must be set before submission.
      farmerSearch: ['', Validators.required],

      // Auto-populated from the selected farmer — not editable.
      phone:  ['', [ugandaPhoneValidator()]],
      branch: [BRANCH_NAMES[this.session.branchId() ?? ''] ?? '', Validators.required],

      commodity: ['', Validators.required],

      // Grade is only required when the cooperative has grade mode ON.
      // Validators are added/removed reactively in updateGradeValidators().
      grade: [''],

      volume:     [null, [Validators.required, positiveNumberValidator()]],
      volumeUnit: ['KG'],

      // unitPrice is auto-filled from CooperativePricingService when commodity/grade change.
      // estimatedValue (= gross) is unitPrice × volume, also auto-computed.
      unitPrice:      [{ value: null, disabled: true }],
      estimatedValue: [{ value: null, disabled: true }],

      notes:  [''],
      // Auto-filled from whichever season the cooperative has currently opened.
      season: [this.seasonConfig.activeSeason() ?? 'Wet Season', Validators.required],
      session: [this.sessionOptions[0] ?? null],
    });
  }

  // Adds/removes Validators.required on the grade control based on the mode.
  // Called on init and whenever the cooperative toggles the grade switch.
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

  // Builds a deduplicated list of farmers from delivery records.
  // Uses farmerId as the deduplication key so the same farmer appears only once.
  private buildFarmerRegistry(records: FarmerDelivery[]): Farmer[] {
    const seen = new Set<string>();
    return records.reduce<Farmer[]>((acc, r) => {
      if (!seen.has(r.farmerId)) {
        seen.add(r.farmerId);
        acc.push({
          id: r.farmerId,
          name: r.farmerName,
          phone: r.phone,
          branch: BRANCH_NAMES[r.branchId ?? ''] ?? '',
          currentSeason: r.season,
          currentSession: r.session,
        });
      }
      return acc;
    }, []);
  }

  private watchValueChanges(): void {
    // Recompute gross value whenever volume changes.
    this.deliveryForm.get('volume')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calcEstValue());

    // Recompute unit price (and then gross) whenever commodity OR grade changes.
    // merge() lets us watch both controls with one subscription.
    merge(
      this.deliveryForm.get('commodity')?.valueChanges ?? EMPTY,
      this.deliveryForm.get('grade')?.valueChanges    ?? EMPTY,
    ).pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateUnitPrice());
  }

  // ── Unit price auto-population ─────────────────────────────────────────────

  // Called whenever commodity or grade changes.
  // Asks CooperativePricingService for the current price and patches the form.
  private updateUnitPrice(): void {
    const commodity  = this.deliveryForm.get('commodity')?.value ?? '';
    const gradeCode  = this.deliveryForm.get('grade')?.value ?? '';
    const branchId   = this.session.branchId() ?? '';

    const price = commodity
      ? this.pricingService.getUnitPrice(branchId, commodity, this.useGrades ? gradeCode : undefined)
      : 0;


    const price = commodity
      ? this.pricingService.getUnitPrice(branchId, commodity, this.useGrades ? gradeCode : undefined)
      : 0;

    // patchValue on a disabled control requires {emitEvent: false} to avoid loops.
    this.deliveryForm.patchValue({ unitPrice: price || null }, { emitEvent: false });
    this.calcEstValue();
    this.cdr.markForCheck();
  }

  // ── Farmer search autocomplete ─────────────────────────────────────────────

  onFarmerSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();

    if (!query) {
      this.filteredFarmers = [];
      this.showDropdown = false;
      this.cdr.markForCheck();
      return;
    }

    // Match on name, farmer ID, or phone number.
    this.filteredFarmers = this.allFarmers.filter(
      f => f.name.toLowerCase().includes(query) ||
           f.id.toLowerCase().includes(query) ||
           f.phone.includes(query)
    );
    this.showDropdown = true;
    this.cdr.markForCheck();
  }

  selectFarmer(farmer: Farmer): void {
    this.selectedFarmer = farmer;
    this.showDropdown   = false;

    // Prefer the farmer's last session if it's still open today, otherwise fall back.
    const session = farmer.currentSession && this.sessionOptions.includes(farmer.currentSession)
      ? farmer.currentSession
      : this.sessionOptions[0];

    this.deliveryForm.patchValue({
      farmerSearch: `${farmer.name} (${farmer.id})`,
      phone:  farmer.phone,
      branch: farmer.branch,
      season: farmer.currentSeason,
      session,
    });
    this.cdr.markForCheck();
  }

  clearFarmer(): void {
    this.selectedFarmer = null;
    this.deliveryForm.patchValue({ farmerSearch: '', phone: '', branch: '' });
    this.cdr.markForCheck();
  }

  onSearchBlur(): void {
    // Delay so mousedown on a dropdown option fires before the dropdown hides.
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.markForCheck();
    }, 150);
  }

  getInitials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2)
      .map(w => w.charAt(0).toUpperCase()).join('');
  }

  // ── Gross value calculation ────────────────────────────────────────────────

  calcEstValue(): void {
    const volume    = parseFloat(this.deliveryForm.get('volume')?.value) || 0;
    const unitPrice = parseFloat(this.deliveryForm.getRawValue().unitPrice) || 0;
    const gross     = volume * unitPrice;

    this.deliveryForm.patchValue({ estimatedValue: gross > 0 ? gross : null });
    this.cdr.markForCheck();
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  private createPayload(): SaveFarmerDeliveryPayload {
  // getRawValue() is required here — .value skips disabled controls (estimatedValue, unitPrice)
  const v = this.deliveryForm.getRawValue();

  const grossValue = parseFloat(v.estimatedValue) || 0;
  const deductionValue = 0; // no deduction field on this form yet; reserved for future input-loan recovery
  const finalNetValue = grossValue - deductionValue;

  return {
    branch: BRANCH_NAMES[this.session.branchId() ?? ''] ?? '',
    commodity: v.commodity || '',
    farmerId: this.selectedFarmer?.id ?? '',
    farmerName: this.selectedFarmer?.name ?? '',
    quantityDelivered: parseFloat(v.volume) || 0,
    unitOfMeasure: v.volumeUnit || 'Kg', // form control is named volumeUnit, not unitOfMeasure
    estimatedDeliveryValue: grossValue,
    totalValue: finalNetValue,
    inputValueUgx: deductionValue,
    status: 'Pending',
    season: v.season || '',
    session: v.session || '',
  };
}

  // ── Submit ─────────────────────────────────────────────────────────────────

  // onSubmit(): void {
  //   this.formSubmitAttempted = true;

  //   // Hard-block: cooperative admin must open a season before any delivery can be saved.
  //   if (this.isSeasonBlocked) {
  //     this.errorMessage = 'No season is currently open. A cooperative admin must open a season before deliveries can be recorded.';
  //     this.cdr.markForCheck();
  //     return;
  //   }

  //   // Hard-block: all sessions for today have closed.
  //   if (this.isSessionBlocked) {
  //     this.errorMessage = 'All sessions for today have closed. New deliveries can be recorded again tomorrow.';
  //     this.cdr.markForCheck();
  //     return;
  //   }

  //   // A farmer must be selected from the dropdown — typing alone isn't enough.
  //   if (!this.selectedFarmer) {
  //     this.deliveryForm.get('farmerSearch')?.setErrors({ farmerRequired: true });
  //   }

  //   if (this.deliveryForm.invalid) {
  //     this.deliveryForm.markAllAsTouched();
  //     return;
  //   }

  //   this.isSaving = true;
  //   this.errorMessage = '';
  //   this.cdr.markForCheck();

  //   const payload = this.buildPayload();

  //   this.deliveryService.add(payload)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: () => this.onSaveSuccess(payload),
  //       error: (err: unknown) => this.onSaveError(err),
  //     });
  // }
  
  onSubmit(): void {
    this.formSubmitAttempted = true;

    // Hard-block: cooperative admin must open a season before any delivery can be saved.
    if (this.isSeasonBlocked) {
      this.errorMessage = 'No season is currently open. A cooperative admin must open a season before deliveries can be recorded.';
      this.cdr.markForCheck();
      return;
    }

    // Hard-block: all sessions for today have closed.
    if (this.isSessionBlocked) {
      this.errorMessage = 'All sessions for today have closed. New deliveries can be recorded again tomorrow.';
      this.cdr.markForCheck();
      return;
    }

    // A farmer must be selected from the dropdown — typing alone isn't enough.
    if (!this.selectedFarmer) {
      this.deliveryForm.get('farmerSearch')?.setErrors({ farmerRequired: true });
    }

    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const payload = this.buildPayload();

    this.deliveryService.add(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.onSaveSuccess(payload),
        error: (err: unknown) => this.onSaveError(err),
      });
  if (this.deliveryForm.invalid || this.isFormBlocked) {
    this.deliveryForm.markAllAsTouched();
    return;
  }

  this.isSaving = true;
  this.errorMessage = '';
  this.cdr.markForCheck();

  const payload = this.createPayload();

  this.deliveryService.saveDelivery(payload)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        // Triggers the beautiful success window animation state you built
        this.onSaveSuccess(payload);
      },
      error: (err) => {
        this.onSaveError(err);
      }
    });
}

  private buildPayload(): FarmerDeliveryFormData {
    const v        = this.deliveryForm.getRawValue(); // getRawValue includes disabled controls
    const grade    = this.useGrades ? v.grade : undefined;
    const gradeName = grade
      ? this.pricingService.gradeOptions.find(g => g.code === grade)?.name
      : undefined;

    return {
      branchDeliveryId: v.batch || this.route.snapshot.paramMap.get('id') || undefined,
      branchId:         this.session.branchId() ?? undefined,
      farmerId:         this.selectedFarmer!.id,
      farmerName:       this.selectedFarmer!.name,
      phone:            this.selectedFarmer!.phone,
      commodity:        v.commodity,
      volume:           parseFloat(v.volume),
      unitPrice:        parseFloat(v.unitPrice) || undefined,
      estimatedValue:   parseFloat(v.estimatedValue) || 0,
      grade,
      gradeName,
      notes:   v.notes || '',
      status:  'Pending',
      season:  v.season,
      session: v.session,
    };
  }

  // ── Save success / error ────────────────────────────────────────────────────

  private onSaveSuccess(payload: FarmerDeliveryFormData): void {
    this.isSaving  = false;
    this.submitted = true;
    this.successMessage = `Delivery for ${payload.farmerName} saved successfully`;
    this.cdr.markForCheck();
    setTimeout(() => this.goToBranchDeliveries(), 1500);
  }

  private onSaveError(err: unknown): void {
    this.isSaving = false;
    console.error('[FarmerDeliveries] Save failed:', err);
    this.errorMessage = 'Failed to save farmer delivery. Please try again.';
    this.cdr.markForCheck();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goToBranchDeliveries(): void {
    this.router.navigate(['/branch/collections/deliveries']);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

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
