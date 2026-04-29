import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-session-expired',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './session-expired.html',
  styleUrl: './session-expired.scss'
})
export class SessionExpiredComponent {
  inactivityTime = '30:00';
}