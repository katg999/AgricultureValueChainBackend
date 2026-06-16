// features/cooperative/configuration/sessions/sessions-config.component.ts
//
// Lets a cooperative admin edit the start/end hour of each of the 3 fixed
// delivery sessions (morning/midday/afternoon). Applies cooperative-wide —
// every branch under this cooperative reads these same hours.

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';
import { DeliverySessionWindow } from '../../../../core/models/delivery-session.model';
import { ToastService } from '../../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-sessions-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent, ButtonComponent],
  templateUrl: './sessions-config.component.html',
  styleUrl: './sessions-config.component.css',
})
export class SessionsConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sessionConfig = inject(DeliverySessionConfigService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly hourOptions = Array.from({ length: 24 }, (_, hour) => ({
    value: hour,
    label: this.sessionConfig.formatHour(hour),
  }));

  form!: FormGroup;

  ngOnInit(): void {
    this.buildForm(this.sessionConfig.getWindows());
  }

  get rows(): FormGroup[] {
    return (this.form.get('windows') as FormArray).controls as FormGroup[];
  }

  previewRange(row: FormGroup): string {
    const startHour = Number(row.get('startHour')?.value);
    const endHour = Number(row.get('endHour')?.value);
    return this.sessionConfig.formatHourRange(startHour, endHour);
  }

  save(): void {
    const windows = this.currentFormWindows();
    const error = this.sessionConfig.updateWindows(windows);

    if (error) {
      this.toast.error('Could not save', error);
      return;
    }

    this.toast.success('Session hours updated', 'New deliveries will use these windows immediately.');
  }

  resetToDefaults(): void {
    this.sessionConfig.resetToDefaults();
    this.buildForm(this.sessionConfig.getWindows());
    this.toast.success('Reset to defaults', 'Session hours restored to 6am-9am / 9am-12pm / 12pm-6pm.');
  }

  cancel(): void {
    this.router.navigate(['/cooperative/configuration']);
  }

  private buildForm(windows: DeliverySessionWindow[]): void {
    this.form = this.fb.group({
      windows: this.fb.array(
        windows.map(w => this.fb.group({
          id: [w.id],
          label: [w.label],
          startHour: [w.startHour, Validators.required],
          endHour: [w.endHour, Validators.required],
        })),
      ),
    });
  }

  private currentFormWindows(): DeliverySessionWindow[] {
    const raw = (this.form.get('windows') as FormArray).value as DeliverySessionWindow[];
    return raw.map(w => ({
      ...w,
      startHour: Number(w.startHour),
      endHour: Number(w.endHour),
    }));
  }
}
