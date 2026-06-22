import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  templateUrl: './chart-card.component.html',
  styleUrls: ['./chart-card.component.css']
})
export class ChartCardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() height: number = 300;
}
