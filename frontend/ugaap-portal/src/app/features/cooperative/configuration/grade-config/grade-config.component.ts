// features/cooperative/grade-config/grade-config.component.ts
//
// Two sections:
//   1. Grade definitions table (create / edit / delete)
//   2. Grade-centric pricing accordion — expand a grade to see which
//      branches have prices set and what those prices are.
//      This makes the Grade → Branch → Price relationship obvious.

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { API_ENDPOINTS }   from '../../../../core/constants/api-endpoints';
import { ToastService }    from '../../../../core/services/toast.service';
import { MOCK_GRADES, MOCK_BRANCH_GRADE_SUMMARIES } from '../../../../core/mock/mock-cooperative';

export interface Grade {
  id:          string;
  name:        string;
  code:        string;
  description: string;
  createdAt:   string;
  branchCount: number;
}

export interface BranchGradeSummary {
  id:         string;
  name:       string;
  region:     string;
  avgPrice:   number;
  gradeCount: number;
  grades:     { name: string; code: string; pricePerKg: number }[];
}

@Component({
  selector: 'app-grade-config',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './grade-config.component.html',
  styleUrl: './grade-config.component.css',
})
export class GradeConfigComponent implements OnInit {

  private http  = inject(HttpClient);
  private toast = inject(ToastService);
  router        = inject(Router);

  grades         = signal<Grade[]>([]);
  branches       = signal<BranchGradeSummary[]>([]);
  loading        = signal(false);
  error          = signal<string | null>(null);
  expandedGrade  = signal<string | null>(null);   // keyed by grade code

  private readonly mockGrades: Grade[]              = MOCK_GRADES as Grade[];
  private readonly mockBranches: BranchGradeSummary[] = MOCK_BRANCH_GRADE_SUMMARIES as BranchGradeSummary[];

  ngOnInit(): void {
    this.loadGrades();
    this.loadBranches();
  }

  loadGrades(): void {
    this.loading.set(true);
    this.http.get<Grade[]>(API_ENDPOINTS.COOPERATIVE.GRADING).subscribe({
      next:  data => { this.grades.set(data);            this.loading.set(false); },
      error: ()   => { this.grades.set(this.mockGrades); this.loading.set(false); },
    });
  }

  loadBranches(): void {
    this.http.get<BranchGradeSummary[]>(API_ENDPOINTS.COOPERATIVE.BRANCHES).subscribe({
      next:  data => this.branches.set(data),
      error: ()   => this.branches.set(this.mockBranches),
    });
  }

  toggleGrade(code: string): void {
    this.expandedGrade.set(this.expandedGrade() === code ? null : code);
  }

  editGrade(grade: Grade): void {
    this.router.navigate(['/cooperative/grade-config', grade.id, 'edit']);
  }

  deleteGrade(grade: Grade): void {
    if (!confirm(`Delete the "${grade.name}" grade? This will affect all branches using it.`)) return;
    this.http.delete(`${API_ENDPOINTS.COOPERATIVE.GRADING}/${grade.id}`).subscribe({
      next: () => {
        this.grades.update(gs => gs.filter(g => g.id !== grade.id));
        this.toast.success('Grade deleted', `"${grade.name}" has been removed.`);
      },
      error: () => this.toast.error('Delete failed', 'Could not delete this grade. Please try again.'),
    });
  }

  /** Navigate to edit-prices with this branch pre-selected */
  editPricesForBranch(branch: BranchGradeSummary): void {
    this.router.navigate(['/cooperative/edit-prices'], { queryParams: { branch: branch.id } });
  }

  /** Look up the price a specific branch has set for a given grade code */
  getBranchPrice(branch: BranchGradeSummary, gradeCode: string): number | null {
    const entry = branch.grades.find(g => g.code === gradeCode);
    return entry ? entry.pricePerKg : null;
  }

  /** Count how many branches have a price set for a given grade code */
  pricesSetCount(gradeCode: string): number {
    return this.branches().filter(b => b.grades.some(g => g.code === gradeCode)).length;
  }

  dotColor(code: string): string {
    const map: Record<string, string> = {
      A: '#15976D', B: '#F25D27', C: '#EF9F27', R: '#8C342B',
    };
    return map[code] ?? '#B4B2A9';
  }
}
