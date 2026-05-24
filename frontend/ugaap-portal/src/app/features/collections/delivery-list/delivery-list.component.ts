import { Component, OnInit, OnDestroy, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';

// RxJS Core Observables and Creators
import { Subject, combineLatest } from 'rxjs';

// RxJS Operational Pipe Transformers
import { startWith, takeUntil, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Shared Global UI Components
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

// Root Feature Service Asset
import { DeliveryService } from '../farmer-delivery.service';
import { DeliveryRecord } from '../farmer-delivery.model';

@Component({
  selector: 'app-delivery-list',
  templateUrl: './delivery-list.component.html',
  styleUrls: ['./delivery-list.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    PageHeaderComponent, 
    ButtonComponent
  ]
})
export class DeliveryListComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('', { nonNullable: true });
  categoryFilter = new FormControl('all', { nonNullable: true });
  filteredDeliveries: DeliveryRecord[] = []; 
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    @Inject(DeliveryService) private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeFiltersPipeline();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFiltersPipeline(): void {
    const search$ = this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(200), 
      distinctUntilChanged()
    );

    const category$ = this.categoryFilter.valueChanges.pipe(
      startWith(this.categoryFilter.value),
      distinctUntilChanged()
    );

    const dataStream$ = this.deliveryService.getDeliveriesStream();

    combineLatest([search$, category$, dataStream$])
    .pipe(
      takeUntil(this.destroy$),
      map(([searchTerm, selectedCategory, realTimeDeliveries]) => {
        const cleanSearch = searchTerm.toLowerCase().trim();
        const cleanCategory = selectedCategory.toLowerCase().trim();

        return realTimeDeliveries.filter(delivery => {
          const farmerName = (delivery.farmerName || '').toLowerCase();
          const deliveryId = (delivery.id || '').toLowerCase();
          const commodityCategory = (delivery.commodityCategory || '').toLowerCase();
          
          // Matches search against Farmer Name string or Generated ID tag
          const matchesSearch = farmerName.includes(cleanSearch) || deliveryId.includes(cleanSearch);
          
          // Fallback parsing handling for global "all" dropdown selection state resets
          const matchesCategory = 
            !cleanCategory || 
            cleanCategory === 'all' || 
            cleanCategory === 'all categories' || 
            commodityCategory === cleanCategory;

          return matchesSearch && matchesCategory; 
        });
      })
    )
    .subscribe({
      next: (results) => {
        this.filteredDeliveries = results;
        
        // Forces Angular to run instant change detection cycles to push lazy view loads immediately
        this.cdr.detectChanges(); 
      },
      error: (err: unknown) => console.error('Delivery sync system error:', err)
    });
  }

  getRepaymentLabel(rule: string | undefined | null): string {
    if (!rule) return 'No Linked Recovery Rule (0%)';
    
    const labels: Record<string, string> = {
      standard: 'Standard Post-Harvest Deduction (15%)',
      accelerated: 'Priority Recovery Deduction (25%)',
      deferred: 'No Linked Recovery Rule (0%)'
    };
    return labels[rule] || 'Standard Post-Harvest Deduction (15%)';
  }

  navigateToCreate(): void {
    this.router.navigate(['/collections/farmer-delivery/create']);
  }

  onView(id: string): void {
    this.router.navigate(['/collections/farmer-delivery', id]);
  }

  onEdit(id: string): void {
    this.router.navigate(['/collections/farmer-delivery', id, 'edit']);
  }
}
