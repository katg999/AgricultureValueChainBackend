import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { InputComponent } from "../../../shared/components/input/input.component";
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-add-stock-item',
  standalone: true,
  imports: [PageHeaderComponent, ReactiveFormsModule, InputComponent, ButtonComponent],
  templateUrl: './add-stock-item.component.html',
  styleUrl: './add-stock-item.component.css',
})
export class AddStockItemComponent {
  readonly stockForm;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
  ) {
    this.stockForm = this.formBuilder.nonNullable.group({
      itemName: ['', Validators.required],
      branch: [[] as string[], Validators.required],
      quantity: [0, [Validators.required, Validators.min(1)]],
      receivedDate: ['', Validators.required],
      minThreshold: [0, [Validators.required, Validators.min(1)]],
      supplierName: ['', Validators.required],
      batchReference: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }

    this.router.navigate(['/inventory/current-stock']);
  }

  onCancel(): void {
    this.router.navigate(['/inventory/current-stock']);
  }
}
