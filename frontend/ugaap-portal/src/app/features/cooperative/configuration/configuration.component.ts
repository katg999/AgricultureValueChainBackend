// features/cooperative/configuration/configuration.component.ts
//
// Landing page that links out to all configuration sub-sections.
// No HTTP call needed here — it's purely a navigation hub.

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { ConfigCardComponent } from '../../../shared/components/config-card/config-card.component';
import { ButtonComponent }     from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfigCardComponent, ButtonComponent],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
})
export class ConfigurationComponent {

  private router = inject(Router);


  openGrading():       void { this.router.navigate(['/cooperative/grade-config']); }
  openRolesUsers():    void { this.router.navigate(['/cooperative/users']); }
  openRoles():         void { this.router.navigate(['/cooperative/roles']); }
  openNotifications(): void { alert('Notification preferences — coming soon.'); }
  
  openPaymentRules():  void { alert('Payment Rules — coming soon.'); }
  openCreditRules():   void { alert('Credit Rules — coming soon.'); }
  openSessions():     void { this.router.navigate(['/cooperative/sessions']); }
  openMakerChecker():  void { alert('Maker-Checker Approvals — coming soon.'); }

}
