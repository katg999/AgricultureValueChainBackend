import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-account-locked',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account-locked.html',
  styleUrl: './account-locked.scss'
})
export class AccountLockedComponent {
  failedAttempts = 5;
  unlockMinutes = 30;
}