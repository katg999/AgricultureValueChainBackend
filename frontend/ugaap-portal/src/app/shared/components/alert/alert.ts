import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.scss'
})
export class AlertComponent {

  @Input() variant: 'info' | 'warning' | 'danger' | 'success' = 'info';
  @Input() title = '';
  @Input() dismissible = false;

  @Output() dismissed = new EventEmitter<void>();

  visible = true;

  dismiss(): void {
    this.visible = false;
    this.dismissed.emit();
  }
}