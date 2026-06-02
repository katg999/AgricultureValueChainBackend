import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UGAAP Logo Component
 * 
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.css']
})
export class LogoComponent {
  // sm = 32px icon, md = 48px (auth default), lg = 56px
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  // show/hide the tagline below the wordmark
  @Input() showSubtitle = true;

  // sidebar variant: horizontal row, white text, "AGRI-FIN MANAGEMENT" sub-label
  // default variant: centered column layout for auth pages
  @Input() variant: 'default' | 'sidebar' = 'default';

  get logoClasses(): string {
    return [
      'logo-container',
      `logo-${this.size}`,
      this.variant === 'sidebar' ? 'logo-sidebar' : '',
    ].filter(Boolean).join(' ');
  }
}