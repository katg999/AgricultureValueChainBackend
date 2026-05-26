// features/cooperative/grade-config/grade-config.component.ts
//
// Grade Configuration — lists all quality grades and shows per-branch pricing.
// Two sections:
//   1. Grades & Pricing table (sortable, paginated)
//   2. Branch accordion — expand a row to see that branch's live prices

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { API_ENDPOINTS }   from '../../../../core/constants/api-endpoints';

export interface Grade {
  id:          string;
  name:        string;
  code:        string;   // single letter — A, B, C, R
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

  private http = inject(HttpClient);
  // public so the template can call router.navigate() inline
  router = inject(Router);

  // grade table state
  grades   = signal<Grade[]>([]);
  loading  = signal(false);
  error    = signal<string | null>(null);

  // branch accordion state
  branches       = signal<BranchGradeSummary[]>([]);
  expandedBranch = signal<string | null>(null);

  // placeholder data so the screen is usable before the backend is wired
  private readonly mockGrades: Grade[] = [
    { id: '1', name: 'Premium',  code: 'A', description: 'Highest quality beans', createdAt: '15 Jan 2024', branchCount: 12 },
    { id: '2', name: 'Standard', code: 'B', description: 'Good quality beans',    createdAt: '15 Jan 2024', branchCount: 12 },
    { id: '3', name: 'Low Grade',code: 'C', description: 'Below average',         createdAt: '15 Jan 2024', branchCount: 8  },
    { id: '4', name: 'Rejected', code: 'R', description: 'Not acceptable',        createdAt: '15 Jan 2024', branchCount: 12 },
  ];

  private readonly mockBranches: BranchGradeSummary[] = [
    {
      id: 'b1', name: 'Kasese Main Branch', region: 'Western Region',
      avgPrice: 7350, gradeCount: 2, grades: [
        { name: 'Premium',  code: 'A', pricePerKg: 8500 },
        { name: 'Standard', code: 'B', pricePerKg: 6200 },
      ],
    },
    { id: 'b2', name: 'Kasese North Branch', region: 'Western Region', avgPrice: 7150, gradeCount: 4, grades: [] },
    { id: 'b3', name: 'Mbarara Central',     region: 'Western Region', avgPrice: 7550, gradeCount: 3, grades: [] },
  ];

  ngOnInit(): void {
    this.loadGrades();
    this.loadBranches();
  }

  loadGrades(): void {
    this.loading.set(true);
    this.http.get<Grade[]>(API_ENDPOINTS.COOPERATIVE.GRADING).subscribe({
      next:  data => { this.grades.set(data);           this.loading.set(false); },
      error: ()   => { this.grades.set(this.mockGrades); this.loading.set(false); },
    });
  }

  loadBranches(): void {
    // branches endpoint — falls back to mock if not yet implemented
    this.http.get<BranchGradeSummary[]>(API_ENDPOINTS.COOPERATIVE.BRANCHES).subscribe({
      next:  data => this.branches.set(data),
      error: ()   => this.branches.set(this.mockBranches),
    });
  }

  toggleBranch(id: string): void {
    this.expandedBranch.set(this.expandedBranch() === id ? null : id);
  }

  editGrade(grade: Grade): void {
    this.router.navigate(['/cooperative/grade-config', grade.id, 'edit']);
  }

  deleteGrade(grade: Grade): void {
    if (!confirm(`Delete grade "${grade.name}"? This will affect all branches using it.`)) return;
    this.http.delete(`${API_ENDPOINTS.COOPERATIVE.GRADING}/${grade.id}`).subscribe({
      next: () => this.grades.update(gs => gs.filter(g => g.id !== grade.id)),
    });
  }

  editPrices(branch: BranchGradeSummary): void {
    this.router.navigate(['/cooperative/edit-prices'], { queryParams: { branch: branch.id } });
  }

  // dot color keyed to grade code
  dotColor(code: string): string {
    const map: Record<string, string> = {
      A: '#F25D27', B: '#F25D27', C: '#EF9F27', R: '#8C342B',
    };
    return map[code] ?? '#B4B2A9';
  }
}
