import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToastService } from './toast.service';

/**
 * Shared service for consistent form submission feedback across all forms.
 *
 * Usage patterns:
 *   - Reactive forms:  call formError(form, labelMap) — inspects which controls are invalid
 *   - Template forms:  call fieldError(labelList)     — pass labels of failed fields directly
 *   - Success:         call success(title, detail?)
 *   - API failure:     call serverError(err)          — parses HTTP status into a readable message
 */
@Injectable({ providedIn: 'root' })
export class FormFeedbackService {

  private toast = inject(ToastService);

  /** Show a success toast after a save completes. */
  success(title: string, detail?: string): void {
    this.toast.success(title, detail);
  }

  /**
   * Show a warning toast listing which reactive-form fields are invalid.
   * Pass the FormGroup and a map of controlName → human-readable label.
   */
  formError(form: FormGroup, labels: Record<string, string>): void {
    const invalid = Object.entries(labels)
      .filter(([key]) => form.get(key)?.invalid)
      .map(([, label]) => label);
    this._warnFields(invalid);
  }

  /**
   * Show a warning toast for template-driven forms.
   * Pass the list of human-readable labels for fields that failed validation.
   */
  fieldError(invalidLabels: string[]): void {
    this._warnFields(invalidLabels);
  }

  /** Show an error toast for an HTTP or API failure. */
  serverError(err: unknown): void {
    this.toast.error('Something went wrong', this._parseError(err));
  }

  private _warnFields(fields: string[]): void {
    const msg = fields.length
      ? `Please complete: ${fields.join(', ')}`
      : 'Please fix the highlighted fields above';
    this.toast.warning('Form has errors', msg);
  }

  private _parseError(err: any): string {
    if (err?.status === 0)   return 'Cannot reach the server. Check your connection and try again.';
    if (err?.status === 400) return err?.error?.message ?? 'Some fields were rejected. Review your entries.';
    if (err?.status === 401) return 'Your session has expired. Please log in again.';
    if (err?.status === 403) return 'You do not have permission to perform this action.';
    if (err?.status === 409) return err?.error?.message ?? 'A duplicate record already exists.';
    if (err?.status === 422) return err?.error?.message ?? 'Validation failed on the server.';
    if (err?.status === 500) return 'Server error. Please try again or contact support.';
    return err?.error?.message ?? 'An unexpected error occurred. Please try again.';
  }
}
