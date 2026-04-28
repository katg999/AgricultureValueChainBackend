import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from '../spinner/spinner';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './button.html',
  styleUrl: './button.scss'
})
export class ButtonComponent {

  // Type of button
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' = 'primary';

  // Size of button
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  // Whether button takes full width
  @Input() fullWidth = false;

  // Loading state
  @Input() loading = false;

  // Disabled state
  @Input() disabled = false;

  // Button type for forms
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  // Icon on the left
  @Input() iconLeft = '';

  // Icon on the right
  @Input() iconRight = '';

  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }

  get classes(): string {
    return [
      'btn',
      `btn-${this.variant}`,
      `btn-${this.size}`,
      this.fullWidth ? 'btn-full' : '',
      this.loading ? 'btn-loading' : '',
      this.disabled ? 'btn-disabled' : ''
    ].filter(Boolean).join(' ');
  }
}