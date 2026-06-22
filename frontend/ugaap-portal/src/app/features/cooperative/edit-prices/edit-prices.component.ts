import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { API_ENDPOINTS }   from '../../../core/constants/api-endpoints';
import { ToastService }    from '../../../core/services/toast.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import {
  CooperativePricingService,
  FlatCommodityPrice,
  GradeCommodityPrice,
} from '../../../core/services/cooperative-pricing.service';

// Branch is used for the branch selector dropdown in grade mode.
export interface Branch {
  id:         string;
  name:       string;
  region:     string;
  gradeCount: number;
}

@Component({
  selector: 'app-edit-prices',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './edit-prices.component.html',
  styleUrl: './edit-prices.component.css',
})
export class EditPricesComponent implements OnInit {

  private http         = inject(HttpClient);
  private route        = inject(ActivatedRoute);
  private toast        = inject(ToastService);
  private permissions  = inject(PermissionsService);
  // The pricing service is the single source of truth for cooperative prices.
  private pricingSvc   = inject(CooperativePricingService);
  router               = inject(Router);

  // ── Permissions ────────────────────────────────────────────────────────────

  // View permission: can see price tables but not edit them.
  get canViewCommodityPrices(): boolean {
    return this.permissions.hasAny([
      'configuration.prices.commodity.view',
      'configuration.prices.commodity.edit',
    ]);
  }

  // Edit permission: can change prices and save.
  get canEditCommodityPrices(): boolean {
    return this.permissions.has('configuration.prices.commodity.edit');
  }

  // ── Grade mode toggle ──────────────────────────────────────────────────────

  // Reflects the cooperative-wide setting from the pricing service.
  // Using a getter means the template always reads the live value.
  get useGrades(): boolean { return this.pricingSvc.useGrades; }

  toggleGrades(): void {
    this.pricingSvc.setUseGrades(!this.pricingSvc.useGrades);
    // When switching modes, reset the branch selection and grade price table.
    this.selectedBranch.set('');
    this.gradePrices.set([]);
  }

  // ── Flat commodity prices (grade mode OFF) ─────────────────────────────────

  // Local editable copy — committed to the service only when Save is clicked.
  flatPrices          = signal<FlatCommodityPrice[]>([]);
  savingFlat          = signal(false);
  newCommodityName    = '';
  newCommodityPrice: number | null = null;
  addCommodityError   = '';
  showAddForm         = false;
  // '' means cooperative-wide default; a branchId means branch-specific override.
  selectedFlatBranch  = signal('');

  addCommodity(): void {
    const name = this.newCommodityName.trim();
    if (!name) {
      this.addCommodityError = 'Commodity name is required.';
      return;
    }
    if (!this.newCommodityPrice || this.newCommodityPrice <= 0) {
      this.addCommodityError = 'Enter a valid price greater than 0.';
      return;
    }
    const duplicate = this.flatPrices().some(
      p => p.commodity.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      this.addCommodityError = `"${name}" is already in the list.`;
      return;
    }
    this.flatPrices.update(list => [
      ...list,
      { commodity: name, pricePerKg: this.newCommodityPrice! },
    ]);
    this.newCommodityName  = '';
    this.newCommodityPrice = null;
    this.addCommodityError = '';
    this.showAddForm       = false;
  }

  removeCommodity(commodity: string): void {
    this.flatPrices.update(list => list.filter(p => p.commodity !== commodity));
  }

  onFlatBranchChange(branchId: string): void {
    this.selectedFlatBranch.set(branchId);
    // Reload editable copy from the service — branch override if set, else default.
    this.flatPrices.set(this.pricingSvc.getFlatPrices(branchId || undefined).map(p => ({ ...p })));
    this.showAddForm      = false;
    this.addCommodityError = '';
  }

  saveFlatPrices(): void {
    this.savingFlat.set(true);
    const branchId = this.selectedFlatBranch() || undefined;
    this.pricingSvc.updateFlatPrices(this.flatPrices(), branchId);
    // Simulate the async network round-trip — no dedicated endpoint yet.
    setTimeout(() => {
      this.savingFlat.set(false);
      const target = branchId
        ? (this.branches().find(b => b.id === branchId)?.name ?? branchId)
        : 'all branches';
      this.toast.success('Commodity prices updated', `Flat prices saved for ${target}.`);
    }, 400);
  }

  // ── Grade prices (grade mode ON) ───────────────────────────────────────────

  branches       = signal<Branch[]>([]);
  selectedBranch = signal('');
  // Local editable copy of grade prices for the currently selected branch.
  gradePrices    = signal<GradeCommodityPrice[]>([]);
  saving         = signal(false);
  error          = signal<string | null>(null);

  // Used by the commodity filter dropdown above the grade price table.
  gradeCommodityFilter = '';

  // Unique list of commodity names present in the current branch's grade prices.
  // Feeds the filter dropdown without needing to hardcode commodity names.
  uniqueCommodities = computed(() => {
    const seen = new Set<string>();
    return this.gradePrices().filter(p => {
      if (seen.has(p.commodity)) return false;
      seen.add(p.commodity);
      return true;
    }).map(p => p.commodity);
  });

  // The grade price rows visible in the table after applying the commodity filter.
  filteredGradePrices = computed(() => {
    const filter = this.gradeCommodityFilter;
    return filter
      ? this.gradePrices().filter(p => p.commodity === filter)
      : this.gradePrices();
  });

  private readonly mockBranches: Branch[] = [
    { id: 'BR-KLA', name: 'Kampala Central Branch', region: 'Central Region',  gradeCount: 4 },
    { id: 'BR-JIN', name: 'Jinja Branch',            region: 'Eastern Region',  gradeCount: 4 },
    { id: 'BR-MBA', name: 'Mbarara Branch',          region: 'Western Region',  gradeCount: 4 },
    { id: 'BR-FTP', name: 'Fort Portal Branch',      region: 'Western Region',  gradeCount: 4 },
    { id: 'BR-ADJ', name: 'Adjumani Branch',         region: 'Northern Region', gradeCount: 4 },
    { id: 'BR-GUL', name: 'Gulu Branch',             region: 'Northern Region', gradeCount: 4 },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadBranches();

    // Load cooperative-default flat prices into the local editable copy.
    this.flatPrices.set(this.pricingSvc.getFlatPrices().map(p => ({ ...p })));

    // If the URL has ?branch=... pre-select that branch (deep-link support).
    const branchParam = this.route.snapshot.queryParamMap.get('branch');
    if (branchParam) {
      this.selectedBranch.set(branchParam);
      this.loadGradePricesForBranch(branchParam);
    }
  }

  loadBranches(): void {
    // Seed immediately so the dropdown is never empty while the request is in flight.
    this.branches.set(this.mockBranches);
    this.http.get<Branch[]>(API_ENDPOINTS.COOPERATIVE.BRANCHES).subscribe({
      next: data => this.branches.set(data),
      // On error keep the mock data already shown — no extra assignment needed.
    });
  }

  onBranchChange(branchId: string): void {
    this.selectedBranch.set(branchId);
    this.gradePrices.set([]);
    this.gradeCommodityFilter = '';
    if (branchId) this.loadGradePricesForBranch(branchId);
  }

  // Loads grade prices for the selected branch from the pricing service (mock-first).
  loadGradePricesForBranch(branchId: string): void {
    // Try the API first; on failure fall back to the in-memory service data.
    this.http.get<GradeCommodityPrice[]>(`${API_ENDPOINTS.COOPERATIVE.BRANCHES}/${branchId}/grade-prices`).subscribe({
      next:  data => this.gradePrices.set(data),
      error: ()   => {
        // Deep copy so edits in the table don't immediately mutate the service state.
        this.gradePrices.set(this.pricingSvc.getGradePrices(branchId).map(p => ({ ...p })));
      },
    });
  }

  // ── Quick actions ───────────────────────────────────────────────────────────

  increaseAllByPercent(): void {
    const raw = prompt('Enter percentage increase (e.g. 5 for +5%)');
    const pct = parseFloat(raw ?? '');
    if (isNaN(pct)) return;
    this.gradePrices.update(ps =>
      ps.map(p => ({
        ...p,
        // Round to nearest 50 UGX after the increase.
        pricePerKg: Math.round(p.pricePerKg * (1 + pct / 100) / 50) * 50,
      })),
    );
  }

  resetGradePrices(): void {
    // Reload from the service — discards any unsaved edits.
    const branchId = this.selectedBranch();
    if (branchId) {
      this.gradePrices.set(this.pricingSvc.getGradePrices(branchId).map(p => ({ ...p })));
    }
  }

  // ── Save grade prices ───────────────────────────────────────────────────────

  saveGradePrices(): void {
    this.saving.set(true);
    this.error.set(null);

    const branchId = this.selectedBranch();
    const payload  = { branchId, prices: this.gradePrices() };

    this.http.put(API_ENDPOINTS.COOPERATIVE.PRICING, payload).subscribe({
      next: () => {
        // Update the in-memory store so new deliveries immediately use these prices.
        this.pricingSvc.updateGradePrices(branchId, this.gradePrices());
        this.saving.set(false);
        this.toast.success('Grade prices updated', 'Prices saved for ' + branchId + '.');
        this.router.navigate(['/cooperative/grade-config']);
      },
      error: err => {
        const msg = err?.error?.message ?? 'Could not save prices. Please try again.';
        // Still update the in-memory store so the session isn't blocked by a missing API.
        this.pricingSvc.updateGradePrices(branchId, this.gradePrices());
        this.saving.set(false);
        this.error.set(msg);
        this.toast.success('Prices saved locally', 'API not available — prices saved in this session.');
      },
    });
  }
}
