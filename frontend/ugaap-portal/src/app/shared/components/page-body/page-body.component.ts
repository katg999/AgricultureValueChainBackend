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
    }
  `],
})
export class PageBodyComponent {}
