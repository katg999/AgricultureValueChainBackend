import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Column definition for table
 */
export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  template?: TemplateRef<any>;
}

/**
 * Table Component
 * 
 * Reusable data table with sorting, pagination, and custom cell templates.
 * Used for cooperative lists, user lists, and other tabular data.
 * 
 * Features:
 * - Column configuration
 * - Custom cell templates
 * - Sortable columns
 * - Row click events
 * - Empty state
 * - Loading state
 * - Responsive design
 * 
 * @example
 * ```typescript
 * columns: TableColumn[] = [
 *   { key: 'name', label: 'ORGANISATION NAME', sortable: true },
 *   { key: 'country', label: 'COUNTRY', sortable: true },
 *   { key: 'status', label: 'STATUS' }
 * ];
 * 
 * data = [
 *   { name: 'Banyankole Kweterana', country: 'Uganda', status: 'ACTIVE' }
 * ];
 * ```
 * 
 * ```html
 * <app-table 
 *   [columns]="columns" 
 *   [data]="data"
 *   (rowClicked)="onRowClick($event)">
 * </app-table>
 * ```
 */
@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent {
  /**
   * Column definitions
   */
  @Input() columns: TableColumn[] = [];

  /**
   * Table data (array of objects)
   */
  @Input() data: any[] = [];

  /**
   * Show loading state
   */
  @Input() loading = false;

  /**
   * Empty state message
   */
  @Input() emptyMessage = 'No data available';

  /**
   * Enable row hover effect
   */
  @Input() hoverable = true;

  /**
   * Enable row click
   */
  @Input() clickable = false;

  /**
   * Event emitted when row is clicked
   */
  @Output() rowClicked = new EventEmitter<any>();

  /**
   * Event emitted when column header is clicked for sorting
   */
  @Output() sortChanged = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();

  /**
   * Current sort state
   */
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  /**
   * Handle row click
   */
  onRowClick(row: any): void {
    if (this.clickable) {
      this.rowClicked.emit(row);
    }
  }

  /**
   * Handle column sort
   */
  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    // Toggle sort direction
    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.sortChanged.emit({
      column: column.key,
      direction: this.sortDirection
    });
  }

  /**
   * Get cell value from row data
   */
  getCellValue(row: any, column: TableColumn): any {
    return row[column.key];
  }

  /**
   * Get table row classes
   */
  getRowClasses(): string {
    const classes = [];
    if (this.hoverable) classes.push('table-row-hoverable');
    if (this.clickable) classes.push('table-row-clickable');
    return classes.join(' ');
  }
}
