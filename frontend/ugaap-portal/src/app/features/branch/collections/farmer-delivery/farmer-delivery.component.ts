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

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// DELIVERY SERVICE

import { FarmerDeliveryService } from '../farmer.delivery.service';
import { FarmerDeliveryFormData } from '../farmer.delivery.model';

// MODELS

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  branch: string;
}

export type FarmerMode = 'search' | 'manual';

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
  ],
  templateUrl: './farmer-delivery.component.html',
  styleUrls: ['./farmer-delivery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerDeliveriesComponent
implements OnInit, OnDestroy {

  // FORM STATE

  deliveryForm!: FormGroup;
  form!: FormGroup;

  farmerMode: FarmerMode = 'search';

  selectedFarmer: Farmer | null = null;

  filteredFarmers: Farmer[] = [];
  allFarmers: Farmer[] = [];

  showDropdown = false;
  showModal = false;

  estValueDisplay = '—';

  submitted = false;

  isSaving = false;

  successMessage = '';

  errorMessage = '';

  redirectProgress = 0;

  formSubmitAttempted = false;

  // REFERENCE DATA

  readonly branches = [
    'Kampala Central',
    'Jinja East',
    'Mbarara South',
    'Gulu North',
    'Mbale West',
  ];

  readonly commodities = [
    'Maize',
    'Coffee',
    'Beans',
    'Rice',
    'Sunflower',
    'Cassava',
  ];

  // MOCK FARMERS
  private readonly farmerRegistry: Farmer[] = [
    {
      id: 'UG-F-00101',
      name: 'Akello Grace',
      phone: '0772100001',
      branch: 'Kampala Central',
    },
    {
      id: 'UG-F-00102',
      name: 'Okello James',
      phone: '0754200002',
      branch: 'Kampala Central',
    },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private deliveryService: FarmerDeliveryService,
  ) {}

  // LIFECYCLE

  ngOnInit(): void {
    this.buildForm();
    this.form = this.deliveryForm;
    this.allFarmers = [...this.farmerRegistry];
    this.filteredFarmers = [...this.allFarmers];
    this.applyModeValidators();
    this.watchValueChanges();
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
        '',
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
    });
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

    this.deliveryForm.patchValue({
      farmerSearch: `${farmer.name} (${farmer.id})`,
      phone: farmer.phone,
      branch: farmer.branch,
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
      .add(payload as any)
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
      farmerId,
      farmerName: this.selectedFarmer?.name || v.farmerName,
      phone: this.selectedFarmer?.phone || v.manualPhone || v.phone,
      commodity: v.commodity,
      volume,
      estimatedValue: volume * unitPrice,
      notes: v.notes || '',
      status: 'Pending',
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

  openNew(): void {
    this.showModal = true;
    this.form = this.fb.group({
      branchDeliveryId: [this.route.snapshot.paramMap.get('id') || ''],
      farmerId: ['', Validators.required],
      farmerName: ['', Validators.required],
      phone: ['', [Validators.required, ugandaPhoneValidator()]],
      commodity: ['', Validators.required],
      volume: [null, [Validators.required, positiveNumberValidator()]],
      estimatedValue: [null, [Validators.required, positiveNumberValidator()]],
      notes: [''],
      status: ['Pending'],
    });
    this.deliveryForm.reset({
      farmerSearch: '',
      farmerName: '',
      farmerId: '',
      manualPhone: '',
      phone: '',
      branch: '',
      batch: this.route.snapshot.paramMap.get('id') || '',
      commodity: '',
      volume: null,
      unitPrice: null,
      notes: '',
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.deliveryService
      .add(this.form.value as FarmerDeliveryFormData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showModal = false;
      });
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
