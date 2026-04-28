import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyUgx',
})
export class CurrencyUgxPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
