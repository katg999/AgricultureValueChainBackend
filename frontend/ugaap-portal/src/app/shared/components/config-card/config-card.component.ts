// shared/components/config-card/config-card.component.ts
//
// Hub-style card used on configuration landing pages.
// Accepts an icon slot, a footer slot, and standard title/description inputs.
// The `dark` flag flips the card to the deep-plum palette (notification card).

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-config-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './config-card.component.html',
  styleUrl: './config-card.component.css',
})
export class ConfigCardComponent {
  @Input() configId = '';
  @Input() title = '';
  @Input() subtitle = '';           // small label below title (e.g. FINANCIAL ALGORITHMS)
  @Input() description = '';
  @Input() iconBg: 'orange' | 'purple' | 'dark' = 'orange';
  @Input() dark = false;            // dark plum variant
}
