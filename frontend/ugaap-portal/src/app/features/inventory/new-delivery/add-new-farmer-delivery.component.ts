import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-add-new-farmer-delivery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    PageHeaderComponent,
  ],
  templateUrl: './add-new-farmer-delivery.component.html',
  styleUrl: './add-new-farmer-delivery.component.css',
})
export class AddNewFarmerDeliveryComponent implements OnInit {
  // Form State Properties
  deliveryForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialize the reactive form group with explicit catalog table schema validation keys
   */
  private initForm(): void {
    this.deliveryForm = this.formBuilder.group({
      batchNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}-\d{4}-\d{3}$/)]],
      farmerIdentity: ['', [Validators.required, Validators.minLength(2)]],
      typeCategory: ['', [Validators.required]],        
      quantityVolume: [null, [Validators.required, Validators.min(0.01)]],
      gradingStandard: ['', [Validators.required]],
      pricingUgx: [null, [Validators.required, Validators.min(1)]],
      dateLogged: ['', [Validators.required]],
      deliveryNotes: [''],
      isVerified: [false]
    });
  }

  /**
   * Action: Handle form submission, clear validation checks, and route home instantly
   */
  onSubmit(): void {
    if (this.deliveryForm.invalid) {
      this.deliveryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.deliveryForm.value;

    console.log('✓ Processing form delivery data:', formData);

    // Minor execution timeout to emulate safe ledger processing latencies
    setTimeout(() => {
      try {
        this.router.navigate(['/inventory/delivery/delivery-catalogue'])
          .then(() => {
            this.isSubmitting = false;
            this.deliveryForm.reset();
          })
          .catch(err => {
            console.error('Navigation error:', err);
            this.isSubmitting = false;
          });

      } catch (error) {
        console.error('Error submitting delivery:', error);
        this.isSubmitting = false;
      }
    }, 400);
  }

  /**
   * Action: Responsive handler linked to your header action button. Clears form control states seamlessly.
   */
  onNewEntry(): void {
    this.deliveryForm.reset({
      batchNumber: '',
      farmerIdentity: '',
      typeCategory: '',
      quantityVolume: null,
      gradingStandard: '',
      pricingUgx: null,
      dateLogged: '',
      deliveryNotes: '',
      isVerified: false
    });
    this.deliveryForm.markAsPristine();
    this.deliveryForm.markAsUntouched();
    console.log('Form reinitialized for next entry cycle.');
  }

  /**
   * Action: Cancel form entry and return directly to the catalog viewport
   */
  onCancel(): void {
    if (this.deliveryForm.dirty) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }

    this.router.navigate(['/inventory/delivery/delivery-catalogue'])
      .then(() => {
        this.deliveryForm.reset();
      })
      .catch(err => {
        console.error('Navigation error:', err);
      });
  }

  /**
   * Getter: Check if form has validation errors
   */
  get hasErrors(): boolean {
    return this.deliveryForm.invalid && this.deliveryForm.touched;
  }

  /**
   * Getter: Transcribe internal form schema strings into formatted validation subtexts
   */
  getFieldError(fieldName: string): string | null {
    const field = this.deliveryForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    // Humanize technical camelCase field variables into clear system string outputs
    const readableName = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());

    if (field.errors['required']) return `${readableName} is required.`;
    if (field.errors['minlength']) return `${readableName} must be at least ${field.errors['minlength'].requiredLength} characters.`;
    if (field.errors['min']) return `${readableName} value is invalid.`;
    if (field.errors['pattern']) return `${readableName} format configuration is invalid.`;

    return 'Invalid data input.';
  }
}