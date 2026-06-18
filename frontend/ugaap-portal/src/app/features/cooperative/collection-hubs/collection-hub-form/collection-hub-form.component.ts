// features/cooperative/collection-hubs/collection-hub-form/collection-hub-form.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { StepperComponent, Step } from '../../../../shared/components/stepper/stepper.component';
import { ToastService } from '../../../../core/services/toast.service';
import {
  CollectionHubsService,
  CollectionHubInput,
  HUB_BRANCHES,
  UGANDA_DISTRICTS,
  COMMODITIES,
} from '../collection-hubs.service';

@Component({
  selector: 'app-collection-hub-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, StepperComponent],
  templateUrl: './collection-hub-form.component.html',
  styleUrls: ['./collection-hub-form.component.css'],
})
export class CollectionHubFormComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hubsService = inject(CollectionHubsService);
  private toast = inject(ToastService);

  readonly branches = HUB_BRANCHES;
  readonly districts = UGANDA_DISTRICTS;
  readonly allCommodities = COMMODITIES;

  isEditMode = false;
  editId = '';
  saving = false;
  currentStep = 0;

  readonly steps: Step[] = [
    { label: 'DETAILS',    number: '01' },
    { label: 'ASSIGNMENT', number: '02' },
    { label: 'CAPACITY',   number: '03' },
    { label: 'REVIEW',     number: '04' },
  ];

  form: CollectionHubInput = {
    name: '',
    location: '',
    district: '',
    branchId: '',
    capacity: 50,
    commodities: [],
  };

  // ── Touched tracking for inline errors ───────────────────────────────────────
  touched: Record<string, boolean> = {};

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editId = id;
      const hub = this.hubsService.getById(id);
      if (hub) {
        this.form = {
          name: hub.name,
          location: hub.location,
          district: hub.district,
          branchId: hub.branchId,
          capacity: hub.capacity,
          commodities: [...hub.commodities],
        };
      }
    }
  }

  // ── Computed labels ──────────────────────────────────────────────────────────

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Collection Hub' : 'Add Collection Hub';
  }

  get pageSubtitle(): string {
    return this.isEditMode
      ? 'Update the details for this collection hub.'
      : 'Register a new produce collection hub linked to a branch.';
  }

  get selectedBranchName(): string {
    return this.branches.find(b => b.id === this.form.branchId)?.name ?? '—';
  }

  // ── Step navigation ──────────────────────────────────────────────────────────

  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) return;
    this.currentStep++;
  }

  prevStep(): void {
    this.currentStep--;
  }

  private isStepValid(step: number): boolean {
    if (step === 0) {
      this.touched['name'] = true;
      this.touched['location'] = true;
      return this.form.name.trim().length >= 3 && this.form.location.trim().length >= 3;
    }
    if (step === 1) {
      this.touched['district'] = true;
      this.touched['branchId'] = true;
      return !!this.form.district && !!this.form.branchId;
    }
    if (step === 2) {
      this.touched['capacity'] = true;
      this.touched['commodities'] = true;
      return this.form.capacity >= 1 && this.form.commodities.length >= 1;
    }
    return true;
  }

  // ── Commodity checkboxes ─────────────────────────────────────────────────────

  isCommoditySelected(c: string): boolean {
    return this.form.commodities.includes(c);
  }

  toggleCommodity(c: string): void {
    if (this.isCommoditySelected(c)) {
      this.form.commodities = this.form.commodities.filter(x => x !== c);
    } else {
      this.form.commodities = [...this.form.commodities, c];
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.saving) return;
    this.saving = true;

    try {
      if (this.isEditMode) {
        this.hubsService.update(this.editId, this.form);
        this.toast.success('Hub updated', `${this.form.name} has been saved.`);
      } else {
        const hub = this.hubsService.create(this.form);
        this.toast.success('Hub created', `${hub.hubCode} — ${hub.name} is now active.`);
      }
      this.router.navigate(['/cooperative/collection-hubs']);
    } finally {
      this.saving = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/cooperative/collection-hubs']);
  }
}
