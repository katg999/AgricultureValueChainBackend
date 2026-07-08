import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { API_ENDPOINTS } from '../../../../core/constants/api-endpoints';
import { ToastService } from '../../../../core/services/toast.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Grade {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
  createdAt?: string;
  branchCount?: number;
}

export interface BranchGradeSummary {
  id: string;
  name: string;
  region: string;
  avgPrice: number;
  gradeCount: number;
  grades: { name: string; code: string; pricePerKg: number }[];
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
  private toast = inject(ToastService);
  router = inject(Router);

  grades = signal<Grade[]>([]);
  branches = signal<BranchGradeSummary[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  expandedGrade = signal<string | null>(null);

  ngOnInit(): void {
    this.loadGrades();
  }

  loadGrades(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<ApiResponse<Grade[]>>(API_ENDPOINTS.COOPERATIVE.GRADING).subscribe({
      next: (res) => {
        this.grades.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load grades.');
        this.loading.set(false);
      },
    });
  }

  // loadBranches(): void {
  //   this.http.get<ApiResponse<BranchGradeSummary[]>>(API_ENDPOINTS.COOPERATIVE.BRANCHES).subscribe({
  //     next: (res) => this.branches.set(res.data ?? []),
  //     error: (err) => this.error.set(err?.error?.message ?? 'Failed to load branches.'),
  //   });
  // }

  toggleGrade(code: string): void {
    this.expandedGrade.set(this.expandedGrade() === code ? null : code);
  }

  editGrade(grade: Grade): void {
    this.router.navigate(['/cooperative/grade-config', grade.id, 'edit']);
  }

  deleteGrade(grade: Grade): void {
    if (!confirm(`Delete the "${grade.name}" grade? This will affect all branches using it.`))
      return;
    this.http
      .delete<ApiResponse<void>>(`${API_ENDPOINTS.COOPERATIVE.GRADING}/${grade.id}`)
      .subscribe({
        next: (res) => {
          if (res?.success !== false) {
            this.grades.update((gs) => gs.filter((g) => g.id !== grade.id));
            this.toast.success('Grade deleted', `"${grade.name}" has been removed.`);
          }
        },
        error: () =>
          this.toast.error('Delete failed', 'Could not delete this grade. Please try again.'),
      });
  }

  editPricesForBranch(branch: BranchGradeSummary): void {
    this.router.navigate(['/cooperative/edit-prices'], { queryParams: { branch: branch.id } });
  }

  getBranchPrice(branch: BranchGradeSummary, gradeCode: string): number | null {
    const entry = branch.grades.find((g) => g.code === gradeCode);
    return entry ? entry.pricePerKg : null;
  }

  pricesSetCount(gradeCode: string): number {
    return this.branches().filter((b) => b.grades.some((g) => g.code === gradeCode)).length;
  }

  dotColor(code: string): string {
    const map: Record<string, string> = {
      A: '#15976D',
      B: '#F25D27',
      C: '#EF9F27',
      R: '#8C342B',
    };
    return map[code] ?? '#B4B2A9';
  }
}
