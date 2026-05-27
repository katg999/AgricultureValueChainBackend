import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

interface Farmer {
  id: string;
  name: string;
  phone: string;
  availableCredit: number;
}

interface InputType {
  name: string;
  unit: string;
  unitPrice: number;
}

interface IssueStockForm {
  inputType: string;
  quantity: string;
  season: string;
  acknowledged: boolean;
}

interface RecentIssuance {
  id: string;
  farmerName: string;
  farmerId: string;
  initials: string;
  avatarColor: string;
  item: string;
  quantity: string;
  value: number;
  time: string;
}

@Component({
  selector: 'app-issue-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AlertComponent,
    ButtonComponent,
    InputComponent,
    PageHeaderComponent,
  ],
  templateUrl: './issue-stock.component.html',
  styleUrl: './issue-stock.component.css',
})
export class IssueStockComponent {
  farmerSearch = '';
  selectedFarmer: Farmer | null = null;
  searchResults: Farmer[] = [];
  calculatedValue = 0;

  readonly farmers: Farmer[] = [
    {
      id: 'F-1001',
      name: 'Amina Nakato',
      phone: '+256 701 234 567',
      availableCredit: 1500000,
    },
    {
      id: 'F-1002',
      name: 'Moses Okello',
      phone: '+256 772 456 103',
      availableCredit: 900000,
    },
    {
      id: 'F-1003',
      name: 'Sarah Namutebi',
      phone: '+256 755 761 450',
      availableCredit: 2100000,
    },
  ];

  readonly inputTypes: InputType[] = [
    { name: 'NPK Fertilizer', unit: 'Bags', unitPrice: 180000 },
    { name: 'Maize Seeds', unit: 'Kgs', unitPrice: 15000 },
    { name: 'Animal Feed', unit: 'Sacks', unitPrice: 120000 },
    { name: 'Spray Pump', unit: 'Units', unitPrice: 130000 },
  ];

  readonly seasons = ['2024 Season A', '2024 Season B', '2025 Season A'];

  form: IssueStockForm = {
    inputType: '',
    quantity: '',
    season: '',
    acknowledged: false,
  };

  recentIssuances: RecentIssuance[] = [
    {
      id: 'ISS-1001',
      farmerName: 'Amina Nakato',
      farmerId: 'F-1001',
      initials: 'AN',
      avatarColor: '#f25d27',
      item: 'NPK Fertilizer',
      quantity: '4 Bags',
      value: 720000,
      time: '09:14',
    },
    {
      id: 'ISS-1002',
      farmerName: 'Moses Okello',
      farmerId: 'F-1002',
      initials: 'MO',
      avatarColor: '#22a65a',
      item: 'Maize Seeds',
      quantity: '30 Kgs',
      value: 450000,
      time: '10:05',
    },
  ];

  constructor(private readonly router: Router) {}

  get currentUnit(): string {
    return this.selectedInputType?.unit ?? 'Units';
  }

  private get selectedInputType(): InputType | undefined {
    return this.inputTypes.find(input => input.name === this.form.inputType);
  }

  searchFarmers(): void {
    const query = this.farmerSearch.trim().toLowerCase();

    if (!query) {
      this.searchResults = [];
      return;
    }

    this.searchResults = this.farmers.filter(
      farmer =>
        farmer.name.toLowerCase().includes(query) ||
        farmer.id.toLowerCase().includes(query) ||
        farmer.phone.includes(query),
    );
  }

  selectFarmer(farmer: Farmer): void {
    this.selectedFarmer = farmer;
    this.farmerSearch = `${farmer.name} (${farmer.id})`;
    this.searchResults = [];
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }

  recalculateValue(): void {
    const quantity = Number(this.form.quantity) || 0;
    this.calculatedValue = this.selectedInputType ? quantity * this.selectedInputType.unitPrice : 0;
  }

  canSubmit(): boolean {
    return Boolean(
      this.selectedFarmer &&
        this.form.inputType &&
        this.form.season &&
        Number(this.form.quantity) > 0 &&
        this.form.acknowledged,
    );
  }

  issueInput(): void {
    if (!this.canSubmit() || !this.selectedFarmer) return;

    const quantity = Number(this.form.quantity);
    const issuance: RecentIssuance = {
      id: `ISS-${Date.now()}`,
      farmerName: this.selectedFarmer.name,
      farmerId: this.selectedFarmer.id,
      initials: this.getInitials(this.selectedFarmer.name),
      avatarColor: '#533c59',
      item: this.form.inputType,
      quantity: `${quantity} ${this.currentUnit}`,
      value: this.calculatedValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.recentIssuances = [issuance, ...this.recentIssuances];
    this.resetForm();
  }

  cancel(): void {
    this.router.navigate(['/inventory/current-stock']);
  }

  trackById(_: number, row: RecentIssuance): string {
    return row.id;
  }

  private resetForm(): void {
    this.farmerSearch = '';
    this.selectedFarmer = null;
    this.searchResults = [];
    this.calculatedValue = 0;
    this.form = {
      inputType: '',
      quantity: '',
      season: '',
      acknowledged: false,
    };
  }
}
