import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss'
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() color: 'white' | 'orange' | 'grey' = 'orange';

  get classes(): string {
    return `spinner spinner-${this.size} spinner-${this.color}`;
  }
}