import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Modal Component
 *
 * Reusable modal/dialog component for confirmations, alerts, and forms.
 * Supports custom header, body, footer with actions.
 *
 * Features:
 * - Backdrop overlay
 * - Close on backdrop click (optional)
 * - Close on ESC key
 * - Custom header with icon
 * - Flexible body content
 * - Customizable footer actions
 * - Warning/info styling variants
 *
 * @example
 * ```html
 * <app-modal
 *   [isOpen]="showModal"
 *   title="Confirm activation"
 *   [showIcon]="true"
 *   iconVariant="success"
 *   (closed)="onClose()">
 *
 *   <div body>
 *     <p>Are you sure you want to activate this cooperative?</p>
 *   </div>
 *
 *   <div footer>
 *     <app-button variant="ghost" (clicked)="onCancel()">Cancel</app-button>
 *     <app-button variant="primary" (clicked)="onConfirm()">Confirm</app-button>
 *   </div>
 * </app-modal>
 * ```
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent implements OnInit, OnDestroy {
  /**
   * Controls modal visibility
   */
  @Input() isOpen = false;

  /**
   * Modal title
   */
  @Input() title = '';

  /**
   * Modal subtitle/description
   */
  @Input() subtitle = '';

  /**
   * Show icon in header
   */
  @Input() showIcon = false;

  /**
   * Icon variant (affects color)
   */
  @Input() iconVariant: 'success' | 'warning' | 'danger' | 'info' = 'info';

  /**
   * Close modal when clicking backdrop
   */
  @Input() closeOnBackdrop = true;

  /**
   * Close modal when pressing ESC key
   */
  @Input() closeOnEsc = true;

  /**
   * Modal size
   */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Event emitted when modal is closed
   */
  @Output() closed = new EventEmitter<void>();

  ngOnInit(): void {
    // Listen for ESC key
    if (this.closeOnEsc) {
      document.addEventListener('keydown', this.handleEscKey);
    }
  }

  ngOnDestroy(): void {
    // Clean up event listener
    document.removeEventListener('keydown', this.handleEscKey);
  }

  /**
   * Handle ESC key press
   */
  private handleEscKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  };

  /**
   * Handle backdrop click
   */
  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  /**
   * Close modal
   */
  close(): void {
    this.closed.emit();
  }

  /**
   * Get modal container classes
   */
  get modalClasses(): string {
    return `modal-container modal-${this.size}`;
  }

  /**
   * Get icon classes based on variant
   */
  get iconClasses(): string {
    return `modal-icon modal-icon-${this.iconVariant}`;
  }
}
