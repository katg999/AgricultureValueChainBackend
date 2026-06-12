import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  AfterViewChecked,
  SimpleChanges,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ModalComponent — shared reusable dialog
 *
 * Content projection slots:
 *   <div body>   — form / message content
 *   <div footer> — action buttons (optional)
 *
 * If no [footer] content is projected, built-in Cancel/Confirm buttons render
 * automatically. Detection uses a post-render DOM query so that no extra import
 * is required from consumers.
 *
 * @example — two-way binding (recommended — no (closed) handler needed)
 * ```html
 * <app-modal [(isOpen)]="show" title="Delete record" iconVariant="danger">
 *   <div body>Are you sure? This cannot be undone.</div>
 *   <div footer>
 *     <app-button variant="ghost" (clicked)="show = false">Cancel</app-button>
 *     <app-button variant="danger" (clicked)="onDelete()">Delete</app-button>
 *   </div>
 * </app-modal>
 * ```
 *
 * @example — built-in footer with two-way binding
 * ```html
 * <app-modal [(isOpen)]="show" title="Add Delivery"
 *            [confirmDisabled]="form.invalid" [loading]="saving"
 *            (confirmed)="onSubmit()">
 *   <div body><form [formGroup]="form">...</form></div>
 * </app-modal>
 * ```
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements OnChanges, OnDestroy, AfterViewChecked {

  /** Controls modal open/closed state */
  @Input() isOpen = false;

  //  Header 
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showIcon = false;
  @Input() iconVariant: 'success' | 'warning' | 'danger' | 'info' = 'info';

  //  Behaviour 
  @Input() closeOnBackdrop = true;
  @Input() closeOnEsc = true;

  // Layout 
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  // Built-in footer (used when no [footer] slot is projected) 
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmDisabled = false;
  @Input() loading = false;

  // Events
  /** Emitted on close: X button, backdrop click, ESC, or Cancel */
  @Output() closed = new EventEmitter<void>();

  /** Enables [(isOpen)] two-way binding — always emits false on close */
  @Output() isOpenChange = new EventEmitter<boolean>();

  /** Emitted when the built-in Confirm button is clicked */
  @Output() confirmed = new EventEmitter<void>();

  // Internal state 
  visible = false;
  animating = false;
  hasCustomFooter = false;

  private closeTimer?: ReturnType<typeof setTimeout>;
  private animationFrameId?: number;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      this.isOpen ? this._open() : this._close();
    }
  }

  ngAfterViewChecked(): void {
    this.detectProjectedFooter();
  }

  ngOnDestroy(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    if (this.animationFrameId !== undefined) cancelAnimationFrame(this.animationFrameId);
    document.body.style.overflow = '';
  }

  private _open(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.visible = true;
    this.animationFrameId = requestAnimationFrame(() => {
      this.animating = true;
      this.cdr.detectChanges();
    });
    document.body.style.overflow = 'hidden';
  }

  private _close(): void {
    this.animating = false;
    this.closeTimer = setTimeout(() => {
      this.visible = false;
      document.body.style.overflow = '';
      this.cdr.detectChanges();
    }, 250);
  }

  // Queries the host element for any projected [footer] content. Runs after
  // each view check so it stays in sync even when the footer is toggled
  // dynamically by the parent (e.g. *ngIf on the footer div).
  private detectProjectedFooter(): void {
    const hasFooter = !!this.host.nativeElement.querySelector('[footer]');
    if (hasFooter !== this.hasCustomFooter) {
      this.hasCustomFooter = hasFooter;
      this.cdr.detectChanges();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (
      this.closeOnBackdrop &&
      (event.target as HTMLElement).classList.contains('modal-backdrop')
    ) {
      this.close();
    }
  }

  onConfirm(): void {
    if (!this.confirmDisabled && !this.loading) {
      this.confirmed.emit();
    }
  }

  close(): void {
    this.closed.emit();
    this.isOpenChange.emit(false);
  }

  @HostListener('document:keydown.escape')
  onEscKey(): void {
    if (this.isOpen && this.closeOnEsc) {
      this.close();
    }
  }

  get modalClasses(): string {
    return `modal-container modal-${this.size}`;
  }

  get iconClasses(): string {
    return `modal-icon modal-icon-${this.iconVariant}`;
  }
}
