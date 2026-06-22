// features/cooperative/configuration/sessions/sessions-config.component.ts
//
// Two sections on one page:
//   1. Season Management — open/close the active season + configure the month ranges
//      for Wet Season and Dry Season (cooperative-wide).
//   2. Session Hours — start/end hour of each of the 3 fixed delivery slots
//      (morning / midday / afternoon), also cooperative-wide.

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { DeliverySessionConfigService } from '../../../../core/services/delivery-session-config.service';
import { SeasonConfigService } from '../../../../core/services/season-config.service';
import { DeliverySessionWindow } from '../../../../core/models/delivery-session.model';
import { SeasonWindow, DEFAULT_SEASON_WINDOWS, MONTH_NAMES } from '../../../../core/models/season-config.model';
import { Season } from '../../../branch/collections/branch.delivery.model';
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
  private readonly fb            = inject(FormBuilder);
  private readonly sessionConfig = inject(DeliverySessionConfigService);
  private readonly seasonConfig  = inject(SeasonConfigService);
  private readonly toast         = inject(ToastService);
  private readonly router        = inject(Router);

  // ── Session hours ──────────────────────────────────────────────────────────

  readonly hourOptions = Array.from({ length: 24 }, (_, hour) => ({
    value: hour,
    label: this.sessionConfig.formatHour(hour),
  }));

  form!: FormGroup;

  // ── Season management ──────────────────────────────────────────────────────

  readonly monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: MONTH_NAMES[i + 1],
  }));

  seasonForm!: FormGroup;

  get isSeasonOpen(): boolean {
    return this.seasonConfig.isDeliveryAllowed();
  }

  get activeSeasonType(): Season | null {
    return this.seasonConfig.activeSeason();
  }

  get seasonRows(): FormGroup[] {
    return (this.seasonForm.get('windows') as FormArray).controls as FormGroup[];
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.buildForm(this.sessionConfig.getWindows());
    this.buildSeasonForm(this.seasonConfig.getWindows());
  }

  // ── Session hours actions ──────────────────────────────────────────────────

  get rows(): FormGroup[] {
    return (this.form.get('windows') as FormArray).controls as FormGroup[];
  }

  previewRange(row: FormGroup): string {
    const startHour = Number(row.get('startHour')?.value);
    const endHour   = Number(row.get('endHour')?.value);
    return this.sessionConfig.formatHourRange(startHour, endHour);
  }

  save(): void {
    const windows = this.currentFormWindows();
    const error   = this.sessionConfig.updateWindows(windows);
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

  // ── Season actions ─────────────────────────────────────────────────────────

  openSeason(type: Season): void {
    this.seasonConfig.openSeason(type);
    this.toast.success(`${type} opened`, 'Branch recorders can now log deliveries for this season.');
  }

  closeSeason(): void {
    this.seasonConfig.closeSeason();
    this.toast.success('Season closed', 'New deliveries are paused until a season is re-opened.');
  }

  saveSeason(): void {
    const windows = this.currentSeasonWindows();
    const error   = this.seasonConfig.updateWindows(windows);
    if (error) {
      this.toast.error('Could not save season config', error);
      return;
    }
    this.toast.success('Season config saved', 'Month ranges updated for both seasons.');
  }

  resetSeasonDefaults(): void {
    this.seasonConfig.resetToDefaults();
    this.buildSeasonForm(this.seasonConfig.getWindows());
    this.toast.success('Reset to defaults', 'Season windows restored to Mar–Aug / Sep–Feb.');
  }

  seasonPreview(row: FormGroup): string {
    const start = Number(row.get('startMonth')?.value);
    const end   = Number(row.get('endMonth')?.value);
    return `${MONTH_NAMES[start] || ''} – ${MONTH_NAMES[end] || ''}`;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildForm(windows: DeliverySessionWindow[]): void {
    this.form = this.fb.group({
      windows: this.fb.array(
        windows.map(w => this.fb.group({
          id:        [w.id],
          label:     [w.label],
          startHour: [w.startHour, Validators.required],
          endHour:   [w.endHour,   Validators.required],
        })),
      ),
    });
  }

  private currentFormWindows(): DeliverySessionWindow[] {
    const raw = (this.form.get('windows') as FormArray).value as DeliverySessionWindow[];
    return raw.map(w => ({
      ...w,
      startHour: Number(w.startHour),
      endHour:   Number(w.endHour),
    }));
  }

  private buildSeasonForm(windows: SeasonWindow[]): void {
    this.seasonForm = this.fb.group({
      windows: this.fb.array(
        windows.map(w => this.fb.group({
          type:       [w.type],
          label:      [w.label],
          startMonth: [w.startMonth, Validators.required],
          endMonth:   [w.endMonth,   Validators.required],
        })),
      ),
    });
  }

  private currentSeasonWindows(): SeasonWindow[] {
    const raw = (this.seasonForm.get('windows') as FormArray).value as SeasonWindow[];
    return raw.map(w => ({
      ...w,
      startMonth: Number(w.startMonth),
      endMonth:   Number(w.endMonth),
    }));
  }
}
