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
import { SessionService } from '../../../../core/services/session.service';
import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// DELIVERY SERVICE

import { FarmerDeliveryService } from '../farmer.delivery.service';
import { DeliverySession, FarmerDelivery, FarmerDeliveryFormData } from '../farmer.delivery.model';
import { ALL_DELIVERY_SESSIONS, Season } from '../branch.delivery.model';

// MODELS

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  branch: string;
  currentSeason: Season;
  /** Optional — the farmer's last delivery may predate the session field, or come from a backend response that doesn't include it yet. */
  currentSession?: DeliverySession;
}

export type FarmerMode = 'search' | 'manual';

// Maps a FarmerDelivery's branchId to the display name shown in the Branch
// dropdown — keeps the farmer search registry and the dropdown in sync.
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

// CUSTOM VALIDATORS

export function ugandaPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    if (!control.value) return null;

    const cleaned = String(control.value).replace(/\s/g, '');

    const valid = /^(07\d{8}|\+2567\d{8})$/.test(cleaned);

    return valid
      ? null
      : { invalidPhone: true };
  };
}

export function farmerIdFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    if (!control.value) return null;

    const valid = /^UG-F-\d{5}$/.test(
      String(control.value).trim()
    );

    return valid
      ? null
      : { invalidFarmerId: true };
  };
}

export function positiveNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    const val = parseFloat(control.value);

    if (isNaN(val) || val <= 0) {
      return { notPositive: true };
    }

    return null;
  };
}

// COMPONENT

@Component({
  selector: 'app-farmer-delivery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AlertComponent,
  ],
  templateUrl: './farmer-delivery.component.html',
  styleUrls: ['./farmer-delivery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerDeliveriesComponent
implements OnInit, OnDestroy {

  // FORM STATE

  deliveryForm!: FormGroup;

  farmerMode: FarmerMode = 'search';

  selectedFarmer: Farmer | null = null;

  filteredFarmers: Farmer[] = [];
  allFarmers: Farmer[] = [];

  showDropdown = false;

  estValueDisplay = '—';

  submitted = false;

  isSaving = false;

  successMessage = '';

  errorMessage = '';

  redirectProgress = 0;

  formSubmitAttempted = false;

  // REFERENCE DATA

  readonly branches = Object.values(BRANCH_NAMES);

  readonly commodities = [
    'Maize',
    'Coffee',
    'Beans',
    'Rice',
    'Sunflower',
    'Cassava',
  ];

  readonly seasonOptions: Season[] = ['Wet Season', 'Dry Season'];

  // This page only ever creates new deliveries (never edits), so every session
  // whose window has passed for today is dropped from the options outright.
  // Hours come from the cooperative's configured session windows, not a fixed default.
  get sessionOptions(): DeliverySession[] {
    return ALL_DELIVERY_SESSIONS.filter(s => !this.sessionConfig.isSessionPassed(s));
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
  ) {}

  // LIFECYCLE

  ngOnInit(): void {
    this.buildForm();
    this.applyModeValidators();
    this.watchValueChanges();

    // Farmer search draws on every farmer already seeded in FarmerDeliveryService,
    // rather than a separate hand-maintained list — keeps the two from drifting apart.
    this.deliveryService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(records => {
        this.allFarmers = this.buildFarmerRegistry(records);
        this.filteredFarmers = [...this.allFarmers];
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // FORM

  private buildForm(): void {

    this.deliveryForm = this.fb.group({

      farmerSearch: [''],

      farmerName: [''],

      farmerId: [
        '',
        [farmerIdFormatValidator()],
      ],

      manualPhone: [
        '',
        [ugandaPhoneValidator()],
      ],

      phone: [
        '',
        [ugandaPhoneValidator()],
      ],

      branch: [
        BRANCH_NAMES[this.session.branchId() ?? ''] ?? '',
        Validators.required,
      ],

      batch: [''],

      commodity: [
        '',
        Validators.required,
      ],

      volume: [
        null,
        [
          Validators.required,
          positiveNumberValidator(),
        ],
      ],

      unitPrice: [
        null,
        [
          Validators.required,
          positiveNumberValidator(),
        ],
      ],

      notes: [''],

      season: [
        'Wet Season',
        Validators.required,
      ],

      session: [
        this.sessionOptions[0],
        Validators.required,
      ],
    });
  }

  private buildFarmerRegistry(records: FarmerDelivery[]): Farmer[] {
    return records.map(r => ({
      id: r.farmerId,
      name: r.farmerName,
      phone: r.phone,
      branch: BRANCH_NAMES[r.branchId ?? ''] ?? '',
      currentSeason: r.season,
      currentSession: r.session,
    }));
  }

  setFarmerMode(mode: FarmerMode): void {
    this.farmerMode = mode;
    this.clearFarmer();
    this.deliveryForm.patchValue({
      farmerSearch: '',
      farmerName: '',
      farmerId: '',
      manualPhone: '',
      phone: '',
    });
    this.applyModeValidators();
    this.deliveryForm.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  private applyModeValidators(): void {
    const farmerSearch = this.deliveryForm.get('farmerSearch');
    const farmerName = this.deliveryForm.get('farmerName');
    const manualPhone = this.deliveryForm.get('manualPhone');
    const phone = this.deliveryForm.get('phone');

    farmerSearch?.clearValidators();
    farmerName?.clearValidators();
    manualPhone?.setValidators([ugandaPhoneValidator()]);
    phone?.setValidators([ugandaPhoneValidator()]);

    if (this.farmerMode === 'search') {
      farmerSearch?.setValidators([Validators.required]);
      phone?.setValidators([Validators.required, ugandaPhoneValidator()]);
    } else {
      farmerName?.setValidators([Validators.required]);
      manualPhone?.setValidators([Validators.required, ugandaPhoneValidator()]);
    }

    farmerSearch?.updateValueAndValidity({ emitEvent: false });
    farmerName?.updateValueAndValidity({ emitEvent: false });
    manualPhone?.updateValueAndValidity({ emitEvent: false });
    phone?.updateValueAndValidity({ emitEvent: false });
  }

  private watchValueChanges(): void {

    this.deliveryForm
      .get('volume')
      ?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calcEstValue());

    this.deliveryForm
      .get('unitPrice')
      ?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calcEstValue());
  }

  // FARMER SEARCH

  onFarmerSearch(event: Event): void {

    const query = (event.target as HTMLInputElement)
      .value
      .toLowerCase()
      .trim();

    if (!query) {
      this.filteredFarmers = [];
      this.showDropdown = false;
      return;
    }

    this.filteredFarmers = this.allFarmers.filter(
      f =>
        f.name.toLowerCase().includes(query) ||
        f.id.toLowerCase().includes(query) ||
        f.phone.includes(query)
    );

    this.showDropdown = this.filteredFarmers.length > 0;

    this.cdr.markForCheck();
  }

  selectFarmer(farmer: Farmer): void {

    this.selectedFarmer = farmer;

    this.showDropdown = false;

    // The farmer's last recorded session may be missing (older/partial record) or no
    // longer open today — fall back to whatever's still available in either case.
    const session = farmer.currentSession && this.sessionOptions.includes(farmer.currentSession)
      ? farmer.currentSession
      : this.sessionOptions[0];

    this.deliveryForm.patchValue({
      farmerSearch: `${farmer.name} (${farmer.id})`,
      phone: farmer.phone,
      branch: farmer.branch,
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
      branch: '',
    });

    this.cdr.markForCheck();
  }

  // ESTIMATED VALUE

  calcEstValue(): void {

    const volume =
      parseFloat(this.deliveryForm.get('volume')?.value) || 0;

    const unitPrice =
      parseFloat(this.deliveryForm.get('unitPrice')?.value) || 0;

    const total = volume * unitPrice;

    this.estValueDisplay =
      total > 0
        ? total.toLocaleString('en-UG')
        : '—';

    this.cdr.markForCheck();
  }

  // SUBMIT

  onSubmit(): void {

    this.formSubmitAttempted = true;

    if (this.farmerMode === 'search' && !this.selectedFarmer) {
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

    this.deliveryService
      .add(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: () => {
          this.onSaveSuccess(payload);
        },

        error: (err: unknown) => {
          this.onSaveError(err);
        },
      });
  }

  private buildPayload(): FarmerDeliveryFormData {
    const v = this.deliveryForm.value;
    const volume = parseFloat(v.volume);
    const unitPrice = parseFloat(v.unitPrice);
    const farmerId = this.selectedFarmer?.id || v.farmerId || this.generateFarmerId();

    return {
      branchDeliveryId: v.batch || this.route.snapshot.paramMap.get('id') || undefined,
      branchId:         this.session.branchId() ?? undefined,
      farmerId,
      farmerName: this.selectedFarmer?.name || v.farmerName,
      phone: this.selectedFarmer?.phone || v.manualPhone || v.phone,
      commodity: v.commodity,
      volume,
      estimatedValue: volume * unitPrice,
      notes: v.notes || '',
      status: 'Pending',
      season: v.season,
      session: v.session,
    };
  }

  // SUCCESS / ERROR

  private onSaveSuccess(payload: FarmerDeliveryFormData): void {

    this.isSaving = false;

    this.submitted = true;

    this.successMessage =
      `Delivery for ${payload.farmerName} saved successfully`;

    this.cdr.markForCheck();

    setTimeout(() => {
      this.goToBranchDeliveries();
    }, 1500);
  }

  private onSaveError(err: unknown): void {

    this.isSaving = false;

    console.error(
      '[FarmerDeliveries] Save failed:',
      err
    );

    this.errorMessage =
      'Failed to save farmer delivery. Please try again.';

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
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  // NAVIGATION

  goToBranchDeliveries(): void {

    this.router.navigate([
      '/branch/collections/deliveries',
    ]);
  }

  // HELPERS

  private generateFarmerId(): string {

    const seq = String(Date.now()).slice(-5);

    return `UG-F-${seq}`;
  }

  sessionLabel(id: DeliverySession | undefined): string {
    return this.sessionConfig.getLabel(id);
  }

  isFieldInvalid(controlName: string): boolean {

    const ctrl = this.deliveryForm.get(controlName);

    if (!ctrl) return false;

    return ctrl.invalid &&
      (
        ctrl.touched ||
        this.formSubmitAttempted
      );
  }
}

export { FarmerDeliveriesComponent as AddFarmerDeliveryComponent };
