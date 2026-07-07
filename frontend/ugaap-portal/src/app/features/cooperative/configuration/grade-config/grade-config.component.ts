import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ButtonComponent }                              from '../../../../shared/components/button/button.component';
import { ToastService }                                from '../../../../core/services/toast.service';
import { GradingService, Grade, BranchGradeSummary }  from '../../../../core/services/grading.service';

// Re-export so any templates or tests that imported from here still work.
export type { Grade, BranchGradeSummary };

@Component({
  selector: 'app-grade-config',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './grade-config.component.html',
  styleUrl: './grade-config.component.css',
})
export class GradeConfigComponent implements OnInit, OnDestroy {

  private grading = inject(GradingService);
  private toast   = inject(ToastService);
  router          = inject(Router);

  // Local signals so the template can call grades(), branches(), error() as before.
  grades        = signal<Grade[]>([]);
  branches      = signal<BranchGradeSummary[]>([]);
  loading       = this.grading.loading;
  error         = signal<string | null>(null);
  expandedGrade = signal<string | null>(null);

  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(this.grading.grades$.subscribe({
      next:  v   => this.grades.set(v),
      error: err => this.error.set(err?.message ?? 'Failed to load grades'),
    }));
    this.subs.add(this.grading.branches$.subscribe({
      next:  v   => this.branches.set(v),
      error: err => this.error.set(err?.message ?? 'Failed to load branches'),
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleGrade(code: string): void {
    this.expandedGrade.set(this.expandedGrade() === code ? null : code);
  }

  editGrade(grade: Grade): void {
    this.router.navigate(['/cooperative/grade-config', grade.id, 'edit']);
  }

  deleteGrade(grade: Grade): void {
    if (!confirm(`Delete the "${grade.name}" grade? This will affect all branches using it.`)) return;
    this.grading.deleteGrade(grade).subscribe({
      next:  () => this.toast.success('Grade deleted', `"${grade.name}" has been removed.`),
      error: () => this.toast.error('Delete failed', 'Could not delete this grade. Please try again.'),
    });
  }

  editPricesForBranch(branch: BranchGradeSummary): void {
    this.router.navigate(['/cooperative/edit-prices'], { queryParams: { branch: branch.id } });
  }

  getBranchPrice(branch: BranchGradeSummary, gradeCode: string): number | null {
    const entry = branch.grades.find(g => g.code === gradeCode);
    return entry ? entry.pricePerKg : null;
  }

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
