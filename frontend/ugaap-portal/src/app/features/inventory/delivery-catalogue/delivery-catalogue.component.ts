import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../../shared/components/button/button.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

interface DeliveryItem {
  id: number;
  farmerName: string;
  cropType: 'MAIZE' | 'COFFEE' | 'BEANS' | 'LIVESTOCK';
  quantity: number;
  unitOfMeasure: string;
  batchNumber: string;
  deliveryDate: Date;
  grading: string;
  price: number;
  isVerified: boolean;
}

interface DeliverySummary {
  totalDeliveries: number;
  totalVolume: number;
  pendingVerify: number;
  verifiedBatches: number;
  rejectedCount: number;
}

@Component({
  selector: 'app-delivery-catalogue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    PageHeaderComponent,
    StatCardComponent,
  ],
  templateUrl: './delivery-catalogue.component.html',
  styleUrl: './delivery-catalogue.component.css',
})
export class DeliveryCatalogueComponent implements OnInit {
  // Pagination & Tabs State
  readonly PAGE_SIZE = 4;
  currentPage = 1;
  
  // Tab selection
  activeTab: string = 'Crops'; 

  // Summary Metrics Card Data
  summary: DeliverySummary = {
    totalDeliveries: 48,
    totalVolume: 125400,
    pendingVerify: 12,
    verifiedBatches: 34,
    rejectedCount: 2
  };

  // Raw Mock Data
  deliveryData: DeliveryItem[] = [
    {
      id: 1,
      farmerName: 'John Doe',
      cropType: 'MAIZE',
      quantity: 1200,
      unitOfMeasure: 'KG',
      batchNumber: 'MZ-2026-004',
      deliveryDate: new Date('2026-05-10'),
      isVerified: true,
      grading: 'Grade A',
      price: 1500
    },
    {
      id: 2,
      farmerName: 'Jane Smith',
      cropType: 'COFFEE',
      quantity: 850,
      unitOfMeasure: 'KG',
      batchNumber: 'CF-2026-089',
      deliveryDate: new Date('2026-05-12'),
      isVerified: false,
      grading: 'Grade A',
      price: 4500,
    },
    {
      id: 3,
      farmerName: 'Alex Green',
      cropType: 'BEANS',
      quantity: 600,
      unitOfMeasure: 'KG',
      batchNumber: 'BN-2026-012',
      deliveryDate: new Date('2026-05-14'),
      isVerified: false,
      grading: 'Grade B',
      price: 1200,
    },
    {
      id: 4,
      farmerName: 'Sema Farms',
      cropType: 'LIVESTOCK',
      quantity: 15,
      unitOfMeasure: 'HEAD',
      batchNumber: 'LV-2026-001',
      deliveryDate: new Date('2026-05-15'),
      isVerified: true,
      grading: 'Healthy',
      price: 25000,
    },
    {
      id: 5,
      farmerName: 'Maria Lopez',
      cropType: 'MAIZE',
      quantity: 950,
      unitOfMeasure: 'KG',
      batchNumber: 'MZ-2026-005',
      deliveryDate: new Date('2026-05-16'),
      isVerified: true,
      grading: 'Grade A',
      price: 1600,
    },
    {
      id: 6,
      farmerName: 'Peter Okonkwo',
      cropType: 'COFFEE',
      quantity: 720,
      unitOfMeasure: 'KG',
      batchNumber: 'CF-2026-090',
      deliveryDate: new Date('2026-05-17'),
      isVerified: false,
      grading: 'Grade B',
      price: 4200,
    },
    {
      id: 7,
      farmerName: 'Grace Mutua',
      cropType: 'BEANS',
      quantity: 480,
      unitOfMeasure: 'KG',
      batchNumber: 'BN-2026-013',
      deliveryDate: new Date('2026-05-18'),
      isVerified: true,
      grading: 'Grade A',
      price: 1300,
    },
    {
      id: 8,
      farmerName: 'Kampala Livestock Ltd',
      cropType: 'LIVESTOCK',
      quantity: 22,
      unitOfMeasure: 'HEAD',
      batchNumber: 'LV-2026-002',
      deliveryDate: new Date('2026-05-19'),
      isVerified: false,
      grading: 'Healthy',
      price: 28000,
    }
  ];

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    console.log('Delivery Catalogue Component Initialized');
  }

  /**
   * Getter to filter data dynamically depending on selected tab
   */
  get filteredDeliveries(): DeliveryItem[] {
    const filtered = this.deliveryData.filter(item => {
      if (this.activeTab === 'Crops') {
        return item.cropType !== 'LIVESTOCK';
      } else {
        return item.cropType === 'LIVESTOCK';
      }
    });

    const startIndex = (this.currentPage - 1) * this.PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + this.PAGE_SIZE);
  }

  /**
   * Calculate total deliveries for current tab
   */
  get totalDeliveries(): number {
    return this.deliveryData.filter(item => 
      this.activeTab === 'Crops' ? item.cropType !== 'LIVESTOCK' : item.cropType === 'LIVESTOCK'
    ).length;
  }

  /**
   * Action: Switch tabs smoothly and reset pagination
   */
  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    console.log(`Tab changed to: ${tab}`);
  }

  /**
   * Action: Toggle verification status of a delivery
   */
  onToggleVerify(delivery: DeliveryItem): void {
    delivery.isVerified = !delivery.isVerified;
    
    if (delivery.isVerified) {
      this.summary.verifiedBatches++;
      if (this.summary.pendingVerify > 0) this.summary.pendingVerify--;
    } else {
      this.summary.pendingVerify++;
      if (this.summary.verifiedBatches > 0) this.summary.verifiedBatches--;
    }
    
    console.log(`Delivery ${delivery.batchNumber} verification toggled to: ${delivery.isVerified}`);
  }

  /**
   * Action: Handle pagination
   */
  onPageChange(page: number): void {
    if (page < 1) return;
    const maxPage = Math.ceil(this.totalDeliveries / this.PAGE_SIZE);
    if (page > maxPage) return;
    
    this.currentPage = page;
    console.log(`Page changed to: ${page}`);
  }

  /**
   * Action: Export all delivery records as CSV/Excel
   */
  onExportDeliveries(): void {
    console.log('Exporting delivery records...');
    
    try {
      const headers = ['Batch Number', 'Farmer Name', 'Type', 'Quantity', 'Unit', 'Grade', 'Price', 'Date', 'Status'];
      const rows = this.deliveryData.map(item => [
        item.batchNumber,
        item.farmerName,
        item.cropType,
        item.quantity,
        item.unitOfMeasure,
        item.grading,
        item.price,
        new Date(item.deliveryDate).toLocaleDateString(),
        item.isVerified ? 'Verified' : 'Pending'
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `delivery-records-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✓ Delivery records exported successfully');
    } catch (error) {
      console.error('Error exporting records:', error);
      alert('Failed to export records. Please try again.');
    }
  }

  /**
   * Action: Save all batch verification states
   */
  onSaveDeliveries(): void {
    console.log('Saving batch tracking and verification metrics...');
    
    try {
      const batchesToSave = {
        timestamp: new Date().toISOString(),
        summary: this.summary,
        deliveries: this.deliveryData.map(item => ({
          batchNumber: item.batchNumber,
          farmerName: item.farmerName,
          isVerified: item.isVerified,
          lastModified: new Date().toISOString()
        }))
      };

      // Simulate API call (replace with actual API service in production)
      console.log('Batch data to save:', batchesToSave);
      
      // Mock API response
      setTimeout(() => {
        console.log('✓ Batch states saved successfully');
        alert('✓ All deliveries and verification states have been saved successfully!');
      }, 500);

    } catch (error) {
      console.error('Error saving records:', error);
      alert('Failed to save records. Please try again.');
    }
  }

  /**
   * Navigation: Add new delivery
   */
  navigateToAddDelivery(): void {
    this.router.navigate(['/inventory/delivery/add-new-delivery']);
  }
}