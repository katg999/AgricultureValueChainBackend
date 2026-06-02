import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {

  @Input() variant:
    'active' |
    'pending' |
    'inactive' |
    'suspended' |
    'overdue' |
    'settled' |
    'partial' |
    'verified' |
    'failed' |
    'draft' |
    'open' |
    'closed' |
    'healthy' |
    'low' |
    'info' = 'info';

  @Input() dot = false;

  get classes(): string {
    return [
      'badge',
      `badge-${this.variant}`,
      this.dot ? 'badge-dot' : ''
    ].filter(Boolean).join(' ');
  }
}