// shared/directives/has-permission.directive.ts
//
// Structural directive that renders its host element only when the current
// user holds the required permission(s). Use it to hide in-page actions
// (buttons, table columns, menu entries) the user may not perform.
//
// Usage:
//   <button *hasPermission="'farmers.register'">Register Farmer</button>
//   <button *hasPermission="['farmers.approve', 'farmers.reject']">Review</button>
//
// Accepts a single id or an array (visible when the user holds ANY of them).
// Reacts automatically if the session permissions change.

import {
  Directive, Input, TemplateRef, ViewContainerRef, effect, inject,
} from '@angular/core';
import { PermissionsService } from '../../core/services/permissions.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {

  private templateRef   = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private permissions   = inject(PermissionsService);

  /** Required permission id(s) — element shows when the user holds ANY */
  private required: string[] = [];

  /** Tracks whether the view is currently rendered to avoid duplicates */
  private rendered = false;

  @Input() set hasPermission(value: string | string[]) {
    this.required = Array.isArray(value) ? value : [value];
    this.updateView();
  }

  constructor() {
    // Re-evaluate when granted permissions change (e.g. after re-login)
    effect(() => {
      this.permissions.granted();      // subscribe to the signal
      this.updateView();
    });
  }

  private updateView(): void {
    const visible = this.required.length === 0 || this.permissions.hasAny(this.required);

    if (visible && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!visible && this.rendered) {
      this.viewContainer.clear();
      this.rendered = false;
    }
  }
}
