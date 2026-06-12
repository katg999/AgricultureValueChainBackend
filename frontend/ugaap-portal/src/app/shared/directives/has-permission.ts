// ─────────────────────────────────────────────────────────────────────────────
// shared/directives/has-permission.ts
//
// Structural directive — removes a DOM element entirely when the current user
// lacks the required permission.  Works like *ngIf but driven by permissions.
//
// Usage in a template:
//
//   <!-- Single permission check -->
//   <app-button *appHasPermission="PERMISSIONS.MEMBERSHIP_APPROVE"
//               (clicked)="approveFarmer(farmer)">
//     Approve
//   </app-button>
//
//   <!-- Multiple permissions (any one is enough) -->
//   <div *appHasPermission="PERMISSIONS.INVENTORY_EDIT; any: [PERMISSIONS.INVENTORY_APPROVE]">
//     Manage Stock
//   </div>
//
// The element is REMOVED from the DOM (not just hidden), so it cannot be
// revealed by toggling CSS — this is intentional for security-sensitive actions.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Permission } from '../../core/constants/permissions';
import { PermissionService } from '../../core/services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit {

  /** The primary permission required to show this element */
  @Input('appHasPermission') permission!: Permission;

  /**
   * Optional list of additional permissions — the element is shown if the user
   * has the primary permission OR any permission in this list.
   */
  @Input('appHasPermissionAny') anyOf: Permission[] = [];

  private _rendered = false;

  constructor(
    private templateRef:        TemplateRef<unknown>,
    private viewContainerRef:   ViewContainerRef,
    private permissionService:  PermissionService,
  ) {}

  ngOnInit(): void {
    const allowed = this.anyOf.length > 0
      ? this.permissionService.canAny([this.permission, ...this.anyOf])
      : this.permissionService.can(this.permission);

    if (allowed && !this._rendered) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      this._rendered = true;
    } else if (!allowed && this._rendered) {
      this.viewContainerRef.clear();
      this._rendered = false;
    }
  }
}
