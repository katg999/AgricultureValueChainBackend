// Shared page wrapper for every numbered-section form in the app.
// Replaces the old two-column wizard shell.
//
// Renders the page title/subtitle above a white bordered card.
// Place <app-form-section> elements inside as projected content.
//
// Usage:
//   <form [formGroup]="myForm" (ngSubmit)="submit()">
//     <app-form-shell title="Register Agent" subtitle="Fill in all sections…">
//       <app-form-section [number]="1" title="Agent Details" iconName="user">
//         … fields …
//       </app-form-section>
//     </app-form-shell>
//     <div class="form-actions">…</div>
//   </form>

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header" *ngIf="title">
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
    </div>

    <!-- White card that visually groups all sections.
         overflow:hidden clips app-form-section borders to the card's rounded corners. -->
    <div class="sections-card">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 1040px;
      margin: 0 auto;
      padding: 40px 32px 0;
      font-family: var(--font-human, 'Inter', sans-serif);
    }

    .page-header { margin-bottom: 28px; }

    .page-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--secondary, #200B26);
      margin: 0 0 4px;
      line-height: 1.2;
    }

    .page-subtitle {
      font-size: 13px;
      color: #6B6B7B;
      margin: 0;
      line-height: 1.5;
    }

    .sections-card {
      border: 1px solid #E8E6ED;
      border-radius: 14px;
      overflow: hidden;
      background: #ffffff;
      margin-bottom: 28px;
    }

    @media (max-width: 680px) {
      :host { padding: 24px 16px 0; }
    }
  `],
})
export class FormShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
