import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { API_ENDPOINTS }   from '../../../core/constants/api-endpoints';
import { ToastService }    from '../../../core/services/toast.service';

export interface Branch {
  id:         string;
  name:       string;
  region:     string;
  gradeCount: number;
}

export interface GradePrice {
  id:           string;
  name:         string;
  code:         string;
  currentPrice: number;
  newPrice:     number;
}

@Component({
  selector: 'app-edit-prices',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './edit-prices.component.html',
  styleUrl: './edit-prices.component.css',
})
export class EditPricesComponent implements OnInit {

  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  router        = inject(Router);

  branches       = signal<Branch[]>([]);
  selectedBranch = signal('');
  gradePrices    = signal<GradePrice[]>([]);
  saving         = signal(false);
  error          = signal<string | null>(null);

  private readonly mockBranches: Branch[] = [
    { id: 'BR-KLA', name: 'Kampala Central Branch', region: 'Central Region',  gradeCount: 4 },
    { id: 'BR-JIN', name: 'Jinja Branch',            region: 'Eastern Region',  gradeCount: 4 },
    { id: 'BR-MBA', name: 'Mbarara Branch',          region: 'Western Region',  gradeCount: 4 },
    { id: 'BR-FTP', name: 'Fort Portal Branch',      region: 'Western Region',  gradeCount: 4 },
    { id: 'BR-ADJ', name: 'Adjumani Branch',         region: 'Northern Region', gradeCount: 4 },
    { id: 'BR-GUL', name: 'Gulu Branch',             region: 'Northern Region', gradeCount: 4 },
  ];

  private readonly mockPrices: GradePrice[] = [
    { id: '1', name: 'Premium',   code: 'A', currentPrice: 8500,  newPrice: 8500  },
    { id: '2', name: 'Standard',  code: 'B', currentPrice: 6200,  newPrice: 6200  },
    { id: '3', name: 'Low Grade', code: 'C', currentPrice: 4500,  newPrice: 4500  },
    { id: '4', name: 'Rejected',  code: 'R', currentPrice: 0,     newPrice: 0     },
  ];

  ngOnInit(): void {
    this.loadBranches();
    const branchParam = this.route.snapshot.queryParamMap.get('branch');
    if (branchParam) {
      this.selectedBranch.set(branchParam);
      this.loadPricesForBranch(branchParam);
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
    if (branchId) this.loadPricesForBranch(branchId);
  }

  loadPricesForBranch(branchId: string): void {
    this.http.get<GradePrice[]>(`${API_ENDPOINTS.COOPERATIVE.BRANCHES}/${branchId}/prices`).subscribe({
      next:  data => this.gradePrices.set(data),
      error: ()   => this.gradePrices.set(this.mockPrices.map(p => ({ ...p }))),
    });
  }

  increaseAllByPercent(): void {
    const raw = prompt('Enter percentage increase (e.g. 5 for +5%)');
    const pct = parseFloat(raw ?? '');
    if (isNaN(pct)) return;
    this.gradePrices.update(ps =>
      ps.map(p => ({ ...p, newPrice: +(p.newPrice * (1 + pct / 100)).toFixed(0) })),
    );
  }

  resetToCurrent(): void {
    this.gradePrices.update(ps => ps.map(p => ({ ...p, newPrice: p.currentPrice })));
  }

  saveChanges(): void {
    this.saving.set(true);
    this.error.set(null);

    const payload = {
      branchId: this.selectedBranch(),
      prices:   this.gradePrices().map(p => ({ id: p.id, newPrice: p.newPrice })),
    };

    this.http.put(API_ENDPOINTS.COOPERATIVE.PRICING, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Prices updated', 'Branch prices have been saved successfully.');
        this.router.navigate(['/cooperative/grade-config']);
      },
      error: err => {
        const msg = err?.error?.message ?? 'Could not save prices. Please try again.';
        this.error.set(msg);
        this.toast.error('Save failed', msg);
        this.saving.set(false);
      },
    });
  }
}
