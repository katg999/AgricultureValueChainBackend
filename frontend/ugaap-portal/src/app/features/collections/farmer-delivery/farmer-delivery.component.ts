import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; 
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DeliveryService } from '../farmer-delivery.service'; // Fixed relative root path link
import { DeliveryRegistrationForm } from '../farmer-delivery.model';

type DeliveryFormMode = 'create' | 'view' | 'edit';

@Component({
  selector: 'app-farmer-delivery',
  templateUrl: './farmer-delivery.component.html',
  styleUrls: ['./farmer-delivery.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    ButtonComponent
  ]
})
export class FarmerDeliveryComponent implements OnInit {
  deliveryForm!: FormGroup;
  mode: DeliveryFormMode = 'create';
  deliveryId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private deliveryService: DeliveryService,
    private route: ActivatedRoute,
    private router: Router 
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.configureRouteMode();
  }

  private initForm(): void {
    this.deliveryForm = this.fb.group({
      isActive: [true],
      farmerName: ['', [Validators.required, Validators.minLength(3)]],
      commodityCategory: ['maize', Validators.required], // Valid baseline initial selection
      quantity: [null, [Validators.required, Validators.min(0.1)]], // New UI quantity mapping
      unitOfMeasure: ['KG', Validators.required],
      estimatedValue: [null, [Validators.required, Validators.min(0)]],
      repaymentRule: ['standard', Validators.required],
      notes: ['', Validators.maxLength(500)]
    });
  }

  onSubmit(): void {
    if (this.mode === 'view') {
      return;
    }

    if (this.deliveryForm.invalid) {
      this.markFormGroupTouched(this.deliveryForm);
      return;
    }

    const formValue = this.deliveryForm.getRawValue() as DeliveryRegistrationForm;

    if (this.mode === 'edit' && this.deliveryId) {
      const updatedRecord = this.deliveryService.update(this.deliveryId, formValue);

      if (!updatedRecord) {
        this.navigateToList();
        return;
      }
    } else {
      this.deliveryService.create(formValue);
    }

    this.navigateToList();
  }

  onCancel(): void {
    this.navigateToList();
  }

  onEdit(): void {
    if (!this.deliveryId) {
      return;
    }

    this.router.navigate(['/collections/farmer-delivery', this.deliveryId, 'edit']);
  }

  get pageTitle(): string {
    const titles: Record<DeliveryFormMode, string> = {
      create: 'New Farmer Delivery',
      view: 'View Farmer Delivery',
      edit: 'Edit Farmer Delivery',
    };

    return titles[this.mode];
  }

  get breadcrumb(): string[] {
    return ['Home', 'Collections', this.pageTitle];
  }

  get formSectionTitle(): string {
    return this.mode === 'view' ? 'Delivery Details' : 'Delivery Details';
  }

  get helperText(): string {
    if (this.mode === 'view') {
      return 'Review the captured delivery details.';
    }

    if (this.mode === 'edit') {
      return 'Update the delivery details and save the changes.';
    }

    return 'Please ensure all fields are filled out accurately before submitting.';
  }

  get submitLabel(): string {
    return this.mode === 'edit' ? 'Save changes' : 'Save delivery';
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.deliveryForm.get(fieldName);
    return !!field && field.invalid && (field.touched || field.dirty);
  }

  private configureRouteMode(): void {
    this.deliveryId = this.route.snapshot.paramMap.get('id');
    this.mode = this.resolveMode();

    if (this.mode === 'create') {
      this.deliveryForm.enable();
      return;
    }

    if (!this.deliveryId) {
      this.navigateToList();
      return;
    }

    const delivery = this.deliveryService.getById(this.deliveryId);

    if (!delivery) {
      this.navigateToList();
      return;
    }

    this.deliveryForm.patchValue({
      isActive: delivery.isActive,
      farmerName: delivery.farmerName,
      commodityCategory: delivery.commodityCategory,
      quantity: delivery.quantity,
      unitOfMeasure: delivery.unitOfMeasure,
      estimatedValue: delivery.estimatedValue,
      repaymentRule: delivery.repaymentRule,
      notes: delivery.notes || '',
    });

    if (this.mode === 'view') {
      this.deliveryForm.disable();
    } else {
      this.deliveryForm.enable();
    }
  }

  private resolveMode(): DeliveryFormMode {
    if (this.route.snapshot.url.some(segment => segment.path === 'edit')) {
      return 'edit';
    }

    return this.deliveryId ? 'view' : 'create';
  }

  private navigateToList(): void {
    this.router.navigate(['/collections/delivery-list']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
