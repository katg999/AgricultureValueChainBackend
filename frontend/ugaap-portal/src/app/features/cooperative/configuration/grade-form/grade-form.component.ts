// features/cooperative/grade-form/grade-form.component.ts
//
// Create or edit a single quality grade.
// Route params:
//   /cooperative/grade-config/new      → create mode
//   /cooperative/grade-config/:id/edit → edit mode

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder, Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AlertComponent }  from '../../../../shared/components/alert/alert.component';
import { ToastService }    from '../../../../core/services/toast.service';
import { GradingService }  from '../../../../core/services/grading.service';

@Component({
  selector: 'app-grade-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, AlertComponent],
  templateUrl: './grade-form.component.html',
  styleUrl: './grade-form.component.css',
})
export class GradeFormComponent implements OnInit {

  private fb       = inject(FormBuilder);
  private grading  = inject(GradingService);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private toast    = inject(ToastService);

  form = this.fb.group({
    name:        ['', Validators.required],
    code:        ['', [Validators.required, Validators.maxLength(5)]],
    description: [''],
  });

  isEditMode = signal(false);
  saving     = signal(false);
  error      = signal<string | null>(null);

  // tracks the grade code length for the live character counter
  get codeLength(): number {
    return this.form.get('code')?.value?.length ?? 0;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.loadGrade(id);
    }
  }

  private loadGrade(id: string): void {
    this.grading.fetchById(id).subscribe({
      next:  g   => this.form.patchValue(g),
      error: err => this.error.set(err?.error?.message ?? 'Could not load grade.'),
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    this.error.set(null);

    const id = this.route.snapshot.paramMap.get('id');
    const formValue = this.form.value as { name: string; code: string; description: string };
    const req$ = id
      ? this.grading.updateGrade(id, formValue)
      : this.grading.createGrade(formValue);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        const label = this.isEditMode() ? 'Grade updated' : 'Grade created';
        this.toast.success(label, `"${this.form.value.name}" has been saved.`);
        this.router.navigate(['/cooperative/grade-config']);
      },
      error: err => {
        const msg = err?.error?.message ?? 'Could not save the grade. Please try again.';
        this.error.set(msg);
        this.toast.error('Save failed', msg);
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/cooperative/grade-config']);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}
