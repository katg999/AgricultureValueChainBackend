// features/cooperative/edit-prices/edit-prices.component.ts
//
// Edit produce prices — two workflows on the same page:
//   1. Single branch  — pick a branch, edit the price for each grade inline
//   2. Multi-branch   — pick several branches, apply bulk price changes
//
// Optional query param ?branch=<id> pre-selects a branch when navigating
// from the grade-config accordion "Edit Prices" shortcut.

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { API_ENDPOINTS }   from '../../../core/constants/api-endpoints';

export interface Branch {
  id:         string;
  name:       string;
  region:     string;
  gradeCount: number;
}

export interface GradePrice {
  id:           string;
  name:         string;   // "Premium"
  code:         string;   // display code like "C-AA-01"
  currentPrice: number;
  newPrice:     number;   // user edits this field
}

@Component({
  selector: 'app-edit-prices',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './edit-prices.component.html',
  styleUrl: './edit-prices.component.css',
})
export class EditPricesComponent implements OnInit {

  private http   = inject(HttpClient);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  // single-branch section
  branches        = signal<Branch[]>([]);
  selectedBranch  = signal('');
  gradePrices     = signal<GradePrice[]>([]);

  // multi-branch section
  targetBranches  = signal<Branch[]>([]);
  selectedTargets = signal<Set<string>>(new Set());

  saving = signal(false);
  error  = signal<string | null>(null);

  // placeholder data — replaced once the backend endpoints are active
  private readonly mockBranches: Branch[] = [
    { id: 'b1', name: 'Fort Portal Hub',            region: 'Western',  gradeCount: 12 },
    { id: 'b2', name: 'Kasese District Warehouse',  region: 'Western',  gradeCount: 8  },
    { id: 'b3', name: 'Gulu Processing Center',     region: 'Northern', gradeCount: 15 },
  ];

  private readonly mockPrices: GradePrice[] = [
    { id: '1', name: 'Premium',  code: 'C-AA-01',  currentPrice: 12450, newPrice: 12450 },
    { id: '2', name: 'Standard', code: 'R-S18-04', currentPrice: 8200,  newPrice: 8200  },
    { id: '3', name: 'Low Grade',code: 'V-GA-10',  currentPrice: 450000, newPrice: 450000 },
  ];

  ngOnInit(): void {
    this.loadBranches();

    // pre-select branch if navigated from the accordion
    const branchParam = this.route.snapshot.queryParamMap.get('branch');
    if (branchParam) {
      this.selectedBranch.set(branchParam);
      this.loadPricesForBranch(branchParam);
    }
  }

  loadBranches(): void {
    this.http.get<Branch[]>(API_ENDPOINTS.COOPERATIVE.BRANCHES).subscribe({
      next:  data => { this.branches.set(data); this.targetBranches.set(data); },
      error: ()   => { this.branches.set(this.mockBranches); this.targetBranches.set(this.mockBranches); },
    });
  }

  onBranchChange(branchId: string): void {
    this.selectedBranch.set(branchId);
    if (branchId) this.loadPricesForBranch(branchId);
    else           this.gradePrices.set([]);
  }

  loadPricesForBranch(branchId: string): void {
    this.http.get<GradePrice[]>(`${API_ENDPOINTS.COOPERATIVE.BRANCHES}/${branchId}/prices`).subscribe({
      next:  data => this.gradePrices.set(data),
      error: ()   => this.gradePrices.set(this.mockPrices),
    });
  }

  // increase all new prices by a percentage entered via prompt
  increaseAllByPercent(): void {
    const pct = parseFloat(prompt('Enter percentage increase (e.g. 5 for 5%)') ?? '');
    if (isNaN(pct)) return;
    this.gradePrices.update(ps =>
      ps.map(p => ({ ...p, newPrice: +(p.newPrice * (1 + pct / 100)).toFixed(2) }))
    );
  }

  // restore all new prices to current prices
  resetToCurrent(): void {
    this.gradePrices.update(ps => ps.map(p => ({ ...p, newPrice: p.currentPrice })));
  }

  toggleTarget(id: string): void {
    this.selectedTargets.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  selectAllBranches(): void {
    this.selectedTargets.set(new Set(this.targetBranches().map(b => b.id)));
  }

  isSelected(id: string): boolean {
    return this.selectedTargets().has(id);
  }

  saveChanges(): void {
    this.saving.set(true);
    this.error.set(null);

    const payload = {
      branchId: this.selectedBranch(),
      prices:   this.gradePrices().map(p => ({ id: p.id, newPrice: p.newPrice })),
    };

    this.http.put(`${API_ENDPOINTS.COOPERATIVE.PRICING}`, payload).subscribe({
      next:  () => { this.saving.set(false); this.router.navigate(['/cooperative/grade-config']); },
      error: err => { this.error.set(err?.error?.message ?? 'Save failed.'); this.saving.set(false); },
    });
  }
}
