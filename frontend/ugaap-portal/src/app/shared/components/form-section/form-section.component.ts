// Shared numbered-section component for every form in the app.
// Renders a coloured icon badge, section number + title, optional grey
// description, and projects the fields via <ng-content>.
//
// The border-bottom on :host creates dividers between sections.
// The parent app-form-shell's overflow:hidden clips the last section's
// border at the card's rounded corners, removing any double-border.
//
// Usage:
//   <app-form-section [number]="1" title="Personal Details"
//                     iconName="user" desc="Identity and contact info">
//     <div class="fields-grid cols-4">…</div>
//   </app-form-section>
//
// Supported iconName values:
//   user · users · building · location · home · phone ·
//   card · lock · shield · check · globe · briefcase · list

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-header">
      <div class="section-icon" [ngSwitch]="iconName" aria-hidden="true">

        <!-- user: single person -->
        <svg *ngSwitchCase="'user'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>

        <!-- users: two people -->
        <svg *ngSwitchCase="'users'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>

        <!-- building: office block -->
        <svg *ngSwitchCase="'building'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M6 19h.01
                   M10 11h.01M10 15h.01M10 19h.01M14 11h.01M14 15h.01
                   M14 19h.01M18 11h.01M18 15h.01M18 19h.01M3 7l9-4 9 4"/>
        </svg>

        <!-- location: map pin -->
        <svg *ngSwitchCase="'location'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>

        <!-- home: house with door -->
        <svg *ngSwitchCase="'home'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>

        <!-- phone: handset -->
        <svg *ngSwitchCase="'phone'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
                   A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1.18
                   h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91
                   a16 16 0 0 0 6 6l1-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7
                   A2 2 0 0 1 21.73 16.92z"/>
        </svg>

        <!-- card: credit card -->
        <svg *ngSwitchCase="'card'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M2 10h20"/>
        </svg>

        <!-- lock: padlock -->
        <svg *ngSwitchCase="'lock'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>

        <!-- shield: security badge -->
        <svg *ngSwitchCase="'shield'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>

        <!-- check: checkmark in circle -->
        <svg *ngSwitchCase="'check'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>

        <!-- globe: world / production -->
        <svg *ngSwitchCase="'globe'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10
                   15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>

        <!-- briefcase: assignment / work -->
        <svg *ngSwitchCase="'briefcase'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>

        <!-- list: bullet list / permissions -->
        <svg *ngSwitchCase="'list'" width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>

        <!-- default fallback: generic circle with dot -->
        <svg *ngSwitchDefault width="17" height="17" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
        </svg>

      </div>

      <h2 class="section-title">{{ number }}. {{ title }}</h2>
      <span class="section-desc" *ngIf="desc">{{ desc }}</span>
    </div>

    <!-- Field content projected from the parent form -->
    <ng-content></ng-content>
  `,
  styles: [`
    /* Each section is a direct child of the sections-card div in app-form-shell.
       The bottom border acts as a divider; :last-child removes it on the final section
       so it doesn't double up with the card's own border. */
    :host {
      display: block;
      padding: 28px 32px;
      border-bottom: 1px solid #E8E6ED;
    }

    :host(:last-child) { border-bottom: none; }

    /* ── Section header row ── */
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
    }

    /* Orange-tinted badge that frames the icon */
    .section-icon {
      width: 34px;
      height: 34px;
      min-width: 34px;
      background: rgba(242, 93, 39, 0.10);
      color: var(--primary, #F25D27);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--secondary, #200B26);
      margin: 0;
      white-space: nowrap;
    }

    /* Pushed to the far right with margin-left: auto */
    .section-desc {
      font-size: 12px;
      color: #9B9BAB;
      margin-left: auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 680px) {
      :host { padding: 20px; }
      .section-desc { display: none; }
    }
  `],
})
export class FormSectionComponent {
  /** Section number shown before the title (e.g. "1. Personal Details") */
  @Input() number: number = 1;

  /** Section heading */
  @Input() title: string = '';

  /** Optional grey description shown on the right of the header */
  @Input() desc?: string;

  /** Icon name — see supported values in the component comment above */
  @Input() iconName?: string;
}
