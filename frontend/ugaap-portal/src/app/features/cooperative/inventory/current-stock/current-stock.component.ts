import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

export type StockStatus = 'healthy' | 'low' | 'out';

export interface StockItem {
  id: number;
  name: string;
  category: string;
  categoryClass: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  stockStatus: StockStatus;
  branches: string;
  branchNames: string[];
  season: string;
  updatedAt: string;
}

export interface StockSummary {
  totalTypes: number;
  healthy: number;
  low: number;
  outOfStock: number;
  totalValue: number;
}

const THRESHOLD_MULTIPLIER = 4;
const TOTAL_STOCK_VALUE = 48200000;
const ALL_BRANCHES = [
  'Kampala Central',
  'Jinja Branch',
  'Mbarara Branch',
  'Gulu Branch',
  'Mbale Branch',
];

@Component({
  selector: 'app-current-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AlertComponent,
    ButtonComponent,
    PageHeaderComponent,
    StatCardComponent,
  ],
  templateUrl: './current-stock.component.html',
  styleUrls: ['./current-stock.component.css'],
})
export class CurrentStockComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  filterBranch = '';
  filterStatus: '' | StockStatus = '';
  filterSeason = '';
  searchQuery = '';

  alertMessage = '';
  importMessage = '';
  isImporting = false;

  summary: StockSummary = {
    totalTypes: 11,
    healthy: 7,
    low: 3,
    outOfStock: 1,
    totalValue: TOTAL_STOCK_VALUE,
  };

  branches: string[] = ALL_BRANCHES;

  allItems: StockItem[] = [
    {
      id: 1,
      name: 'NPK Fertilizer',
      category: 'FERTILIZER',
      categoryClass: 'fertilizer',
      quantity: 1250,
      unit: 'Bags',
      minThreshold: 200,
      stockStatus: 'healthy',
      branches: '4',
      branchNames: ['Kampala Central', 'Jinja Branch', 'Mbarara Branch', 'Mbale Branch'],
      season: '2024A',
      updatedAt: '12/05/24',
    },
    {
      id: 2,
      name: 'Animal Feed (Layer)',
      category: 'POULTRY',
      categoryClass: 'poultry',
      quantity: 85,
      unit: 'Sacks',
      minThreshold: 100,
      stockStatus: 'low',
      branches: '2',
      branchNames: ['Kampala Central', 'Jinja Branch'],
      season: '2024B',
      updatedAt: '14/05/24',
    },
    {
      id: 3,
      name: 'Jute Sacks (100kg)',
      category: 'PACKAGING',
      categoryClass: 'packaging',
      quantity: 0,
      unit: 'Units',
      minThreshold: 500,
      stockStatus: 'out',
      branches: 'All',
      branchNames: ALL_BRANCHES,
      season: '2024A',
      updatedAt: '08/05/24',
    },
    {
      id: 4,
      name: 'Hand Hoes (Galvanized)',
      category: 'TOOLS',
      categoryClass: 'tools',
      quantity: 420,
      unit: 'Pieces',
      minThreshold: 50,
      stockStatus: 'healthy',
      branches: '3',
      branchNames: ['Kampala Central', 'Mbarara Branch', 'Gulu Branch'],
      season: '2023B',
      updatedAt: '10/05/24',
    },
    {
      id: 5,
      name: 'Urea Fertilizer',
      category: 'FERTILIZER',
      categoryClass: 'fertilizer',
      quantity: 112,
      unit: 'Bags',
      minThreshold: 100,
      stockStatus: 'low',
      branches: '1',
      branchNames: ['Kampala Central'],
      season: '2024B',
      updatedAt: '15/05/24',
    },
    {
      id: 6,
      name: 'Maize Seeds (Longe 5)',
      category: 'SEEDS',
      categoryClass: 'seeds',
      quantity: 2400,
      unit: 'Kgs',
      minThreshold: 500,
      stockStatus: 'healthy',
      branches: '5',
      branchNames: ALL_BRANCHES,
      season: '2024A',
      updatedAt: '11/05/24',
    },
    {
      id: 7,
      name: 'Spray Pumps (20L)',
      category: 'EQUIPMENT',
      categoryClass: 'equipment',
      quantity: 12,
      unit: 'Units',
      minThreshold: 15,
      stockStatus: 'low',
      branches: '2',
      branchNames: ['Mbarara Branch', 'Gulu Branch'],
      season: '2023B',
      updatedAt: '09/05/24',
    },
    {
      id: 8,
      name: 'DAP Fertilizer',
      category: 'FERTILIZER',
      categoryClass: 'fertilizer',
      quantity: 680,
      unit: 'Bags',
      minThreshold: 100,
      stockStatus: 'healthy',
      branches: '4',
      branchNames: ['Kampala Central', 'Jinja Branch', 'Mbarara Branch', 'Mbale Branch'],
      season: '2024A',
      updatedAt: '07/05/24',
    },
    {
      id: 9,
      name: 'Bean Seeds (K132)',
      category: 'SEEDS',
      categoryClass: 'seeds',
      quantity: 950,
      unit: 'Kgs',
      minThreshold: 200,
      stockStatus: 'healthy',
      branches: '3',
      branchNames: ['Jinja Branch', 'Gulu Branch', 'Mbale Branch'],
      season: '2024B',
      updatedAt: '06/05/24',
    },
    {
      id: 10,
      name: 'Cattle Dip (2L)',
      category: 'MEDICINE',
      categoryClass: 'medicine',
      quantity: 340,
      unit: 'Bottles',
      minThreshold: 80,
      stockStatus: 'healthy',
      branches: '2',
      branchNames: ['Kampala Central', 'Mbarara Branch'],
      season: '2023B',
      updatedAt: '05/05/24',
    },
    {
      id: 11,
      name: 'Poultry Supplement',
      category: 'SUPPLEMENT',
      categoryClass: 'supplement',
      quantity: 220,
      unit: 'Bags',
      minThreshold: 60,
      stockStatus: 'healthy',
      branches: 'All',
      branchNames: ALL_BRANCHES,
      season: '2024A',
      updatedAt: '04/05/24',
    },
  ];

  filteredItems: StockItem[] = [];

  ngOnInit(): void {
    this.recomputeSummary();
    this.applyFilters();
  }

  applyFilters(): void {
    let items = [...this.allItems];

    if (this.filterBranch) {
      items = items.filter(item => item.branchNames.includes(this.filterBranch));
    }

    if (this.filterStatus) {
      items = items.filter(item => item.stockStatus === this.filterStatus);
    }

    if (this.filterSeason) {
      items = items.filter(item => item.season === this.filterSeason);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      items = items.filter(
        item => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q),
      );
    }

    this.filteredItems = items;
  }

  getBarPercent(item: StockItem): number {    //GET BETTER LOGIC FOR THIS
    if (item.stockStatus === 'out' || item.quantity <= 0) return 0;

    const percent = (item.quantity / (item.minThreshold * THRESHOLD_MULTIPLIER)) * 100;
    return Math.min(Math.round(percent), 100);
  }

  addStock(): void {
    this.router.navigate(['../add-stock-item'], { relativeTo: this.route });
  }

  importStock(): void {
    this.isImporting = true;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept =
      '.csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];

      if (file) {
        this.importMessage = `Selected ${file.name} for stock import.`;
      }

      this.isImporting = false;
      fileInput.remove();
    });

    fileInput.addEventListener('cancel', () => {
      this.isImporting = false;
      fileInput.remove();
    });

    document.body.appendChild(fileInput);
    fileInput.click();
  }

  reviewLowStock(): void {
    this.filterStatus = 'low';
    this.applyFilters();
  }

  markAsRestocked(item: StockItem): void {
    item.stockStatus = 'healthy';
    this.recomputeSummary();
    this.applyFilters();
  }

  private buildAlertMessage(): string {
    const { low, outOfStock } = this.summary;

    if (low === 0 && outOfStock === 0) return '';

    const parts: string[] = [];

    if (low > 0) {
      parts.push(`${low} item${low > 1 ? 's are' : ' is'} below minimum threshold`);
    }

    if (outOfStock > 0) {
      parts.push(`${outOfStock} item${outOfStock > 1 ? 's are' : ' is'} out of stock`);
    }

    return parts.join(' and ') + '. Review and restock immediately.';
  }

  private recomputeSummary(): void {
    const low = this.allItems.filter(item => item.stockStatus === 'low').length;
    const outOfStock = this.allItems.filter(item => item.stockStatus === 'out').length;

    this.summary = {
      totalTypes: this.allItems.length,
      healthy: this.allItems.filter(item => item.stockStatus === 'healthy').length,
      low,
      outOfStock,
      totalValue: TOTAL_STOCK_VALUE,
    };

    this.alertMessage = this.buildAlertMessage();
  }
}
