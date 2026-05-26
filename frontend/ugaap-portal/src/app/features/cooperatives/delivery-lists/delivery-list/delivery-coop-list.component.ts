import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state;

import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { BranchDeliveryService } from '../delivery-coop-service';
import { BranchDelivery, DeliveryFilter } from '../delivery-coop-model';

@Component({
  selector: 'app-delivery-coop-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    EmptyStateComponent],
  templateUrl: './delivery-coop-list.component.html',
  styleUrls: ['./delivery-coop-list.component.css']
})
export class DeliveryCoopListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private service = inject(BranchDeliveryService);

  deliveries: BranchDelivery[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Filters
  searchTerm = '';
  selectedBranch = 'All';
  selectedCategory = 'All';

  private filterSubject = new Subject<DeliveryFilter>();

  ngOnInit() {
    this.loadDeliveries();

    // Debounced filtering
    this.filterSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filters => this.loadDeliveries(filters));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDeliveries(filters?: DeliveryFilter) {
    this.isLoading = true;
    this.hasError = false;

    this.service.getDeliveries(filters).subscribe({
      next: (data) => {
        this.deliveries = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.hasError = true;
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  onFilterChange() {
    const filters: DeliveryFilter = {
      searchTerm: this.searchTerm.trim() || undefined,
      branchId: this.selectedBranch !== 'All' ? this.selectedBranch : undefined,
      category: this.selectedCategory
    };
    this.filterSubject.next(filters);
  }

  refresh() {
    this.loadDeliveries({
      searchTerm: this.searchTerm,
      branchId: this.selectedBranch !== 'All' ? this.selectedBranch : undefined,
      category: this.selectedCategory
    });
  }
}