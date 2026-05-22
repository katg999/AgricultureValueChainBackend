import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { FarmerListItem, FarmerService } from '../farmer.service';

@Component({
  selector: 'app-farmer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputComponent,
    StatCardComponent
  ],
  templateUrl: './farmer-list.component.html',
  styleUrl: './farmer-list.component.css',
})
export class FarmerListComponent {
  searchQuery = '';
  selectedBranch = 'All Branches';
  selectedStatus = 'All Statuses';
  selectedCommodity = 'All Commodities';
  selectedStage = 'All Stages';

  readonly statuses = ['All Statuses', 'Active', 'Pending', 'Rejected', 'Suspended'];
  readonly stages = ['All Stages', 'Registered', 'Verified', 'Financed'];

  readonly collectionProgress = 78;

  constructor(private router: Router, private farmerService: FarmerService) {}

  get farmers(): FarmerListItem[] {
    return this.farmerService.list();
  }

  get branches(): string[] {
    return ['All Branches', ...new Set(this.farmers.map(farmer => farmer.branch))];
  }

  get commodities(): string[] {
    return ['All Commodities', ...new Set(this.farmers.map(farmer => farmer.primaryCommodity))];
  }

  get totalRegisteredFarmers(): number {
    return this.farmers.length;
  }

  get newRegistrations(): string {
    return String(this.farmers.filter(farmer => farmer.status === 'Pending').length);
  }

  get portfolioAtRisk(): string {
    const totalRisk = this.farmers.reduce((sum, farmer) => {
      const numericBalance = Number(farmer.balance.replace(/,/g, ''));
      return sum + (Number.isFinite(numericBalance) ? numericBalance : 0);
    }, 0);

    return `${(totalRisk / 1_000_000).toFixed(1)}M`;
  }

  get filteredFarmers(): FarmerListItem[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.farmers.filter((farmer) => {
      const matchesSearch =
        !query ||
        farmer.id.toLowerCase().includes(query) ||
        farmer.name.toLowerCase().includes(query) ||
        farmer.branch.toLowerCase().includes(query) ||
        farmer.primaryCommodity.toLowerCase().includes(query);

      const matchesBranch = this.selectedBranch === 'All Branches' || farmer.branch === this.selectedBranch;
      const matchesStatus = this.selectedStatus === 'All Statuses' || farmer.status === this.selectedStatus;
      const matchesCommodity =
        this.selectedCommodity === 'All Commodities' || farmer.primaryCommodity === this.selectedCommodity;
      const matchesStage = this.selectedStage === 'All Stages' || farmer.stage === this.selectedStage;

      return matchesSearch && matchesBranch && matchesStatus && matchesCommodity && matchesStage;
    });
  }

  get visibleCount(): number {
    return this.filteredFarmers.length;
  }

  onAddFarmer(): void {
    this.router.navigate(['/farmers/register']);
  }
}
