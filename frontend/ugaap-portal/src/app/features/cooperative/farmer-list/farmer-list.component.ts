// ─────────────────────────────────────────────────────────────────────────────
// features/cooperatives/farmers/farmer-list/farmer-list.component.ts
//
// Farmer list sub-view inside the Cooperatives feature section.
// Uses the canonical FarmerService from features/farmers/ (NOT a local copy).
//
// Filtering and approval actions are identical to the main farmer-list
// but embedded in the cooperatives management context.
// ─────────────────────────────────────────────────────────────────────────────

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';

import { ButtonComponent }   from '../../../shared/components/button/button.component';
import { InputComponent }    from '../../../shared/components/input/input.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

// Use the single canonical FarmerService — no local duplicate
import { FarmerListItem, FarmerService } from '../../farmers/farmer.service';

@Component({
  selector: 'app-farmer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, StatCardComponent],
  templateUrl: './farmer-list.component.html',
  styleUrl: './farmer-list.component.css',
})
export class FarmerListComponent implements OnInit {

  // ── Filter state ──────────────────────────────────────────────────────────
  searchQuery       = '';
  selectedBranch    = 'All Branches';
  selectedStatus    = 'Pending';          // Default to Pending in cooperative view
  selectedCommodity = 'All Commodities';
  selectedStage     = 'All Stages';

  readonly statuses = ['All Statuses', 'Active', 'Pending', 'Rejected', 'Suspended'];
  readonly stages   = ['All Stages', 'Registered', 'Verified', 'Financed'];
  readonly collectionProgress = 78;

  // ── Data state ────────────────────────────────────────────────────────────
  farmers: FarmerListItem[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private router:        Router,
    private farmerService: FarmerService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error   = null;
    this.farmerService.list().subscribe({
      next:  data => { this.farmers = data; this.loading = false; },
      error: err  => { this.error = err?.error?.message ?? err.message; this.loading = false; },
    });
  }

  // ── Computed aggregations ─────────────────────────────────────────────────

  get branches(): string[] {
    return ['All Branches', ...new Set(this.farmers.map(f => f.branch))];
  }

  get commodities(): string[] {
    return ['All Commodities', ...new Set(this.farmers.map(f => f.primaryCommodity))];
  }

  get totalRegisteredFarmers(): number {
    return this.farmers.length;
  }

  get newRegistrations(): string {
    return String(this.farmers.filter(f => f.status === 'Pending').length);
  }

  get portfolioAtRisk(): string {
    const total = this.farmers.reduce((sum, f) => {
      const n = Number(f.balance.replace(/,/g, ''));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    return `${(total / 1_000_000).toFixed(1)}M`;
  }

  // ── Filtered view ─────────────────────────────────────────────────────────

  get filteredFarmers(): FarmerListItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.farmers.filter(f => {
      const matchSearch    = !q || f.id.toLowerCase().includes(q) ||
                             f.name.toLowerCase().includes(q) ||
                             f.branch.toLowerCase().includes(q) ||
                             f.primaryCommodity.toLowerCase().includes(q);
      const matchBranch    = this.selectedBranch    === 'All Branches'    || f.branch           === this.selectedBranch;
      const matchStatus    = this.selectedStatus    === 'All Statuses'    || f.status           === this.selectedStatus;
      const matchCommodity = this.selectedCommodity === 'All Commodities' || f.primaryCommodity === this.selectedCommodity;
      const matchStage     = this.selectedStage     === 'All Stages'      || f.stage            === this.selectedStage;
      return matchSearch && matchBranch && matchStatus && matchCommodity && matchStage;
    });
  }

  get visibleCount(): number {
    return this.filteredFarmers.length;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  onApproveFarmer(farmer: FarmerListItem): void {
    if (!confirm(`Are you sure you want to approve ${farmer.name}?`)) return;

    this.farmerService.approve(farmer.id).subscribe({
      next: updated => {
        // Mutate the row in-place so the table updates without a full reload
        farmer.status = updated.status;
        farmer.stage  = updated.stage;
      },
      error: err => alert(err?.error?.message ?? 'Approve failed.'),
    });
  }
}
