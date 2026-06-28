import { Component } from '@angular/core';

@Component({
  selector: 'app-page-body',
  standalone: true,
  template: `<ng-content></ng-content>`,
  styles: [`
    :host {
      display: block;
      padding: 16px;
      box-sizing: border-box;
      background: var(--surface-low);
      min-height: 100%;
      font-family: var(--font-human);
    }
  `],
})
export class PageBodyComponent {}
