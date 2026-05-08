import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css'
})
export class StatCardComponent {

  @Input() label = '';
  @Input() value = '';
  @Input() trend = '';
  @Input() trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
  @Input() variant: 'default' | 'warning' | 'danger' | 'success' = 'default';
  @Input() loading = false;
}