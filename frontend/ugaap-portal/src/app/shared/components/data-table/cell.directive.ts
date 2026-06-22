import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appCell]',
  standalone: true,
})
export class CellDirective {
  @Input('appCell') key = '';
  constructor(public readonly tpl: TemplateRef<{ $implicit: unknown }>) {}
}
