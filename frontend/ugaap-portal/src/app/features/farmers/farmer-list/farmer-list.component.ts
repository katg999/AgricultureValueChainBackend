// ─────────────────────────────────────────────────────────────────────────────
// features/farmers/farmer-list/farmer-list.component.ts
//
// Displays a filterable table of all farmers managed by the current
// cooperative or branch.
//
// Data is loaded once on init via FarmerService.list() (HTTP GET).
// Filtering is done entirely client-side against the loaded array.
// ─────────────────────────────────────────────────────────────────────────────

import { CommonModule }  from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule }   from '@angular/forms';
import { Router }        from '@angular/router';

import { ButtonComponent }   from '../../../shared/components/button/button.component';
import { InputComponent }    from '../../../shared/components/input/input.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { FarmerListItem, FarmerService } from '../farmer.service';

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
  selectedStatus    = 'All Statuses';
  selectedCommodity = 'All Commodities';
  selectedStage     = 'All Stages';

  readonly statuses   = ['All Statuses', 'Active', 'Pending', 'Rejected', 'Suspended'];
  readonly stages     = ['All Stages', 'Registered', 'Verified', 'Financed'];
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

    // FarmerService.list() calls GET /api/v1/cooperative/farmers (or branch variant)
    // Headers (Bearer token + X-Cooperative-ID) are injected by the interceptors
    this.farmerService.list().subscribe({
      next:  data => { this.farmers = data; this.loading = false; },
      error: err  => { this.error = err?.error?.message ?? err.message; this.loading = false; },
    });
  }

  // ── Computed aggregations (derived from this.farmers) ─────────────────────

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
      const matchBranch    = this.selectedBranch    === 'All Branches'    || f.branch            === this.selectedBranch;
      const matchStatus    = this.selectedStatus    === 'All Statuses'    || f.status            === this.selectedStatus;
      const matchCommodity = this.selectedCommodity === 'All Commodities' || f.primaryCommodity  === this.selectedCommodity;
      const matchStage     = this.selectedStage     === 'All Stages'      || f.stage             === this.selectedStage;
      return matchSearch && matchBranch && matchStatus && matchCommodity && matchStage;
    });
  }

  get visibleCount(): number {
    return this.filteredFarmers.length;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  onAddFarmer(): void {
    this.router.navigate(['/farmers/register']);
  }
}
