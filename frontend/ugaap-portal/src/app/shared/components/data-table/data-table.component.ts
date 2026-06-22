import {
  Component, Input, Output, EventEmitter,
  ContentChildren, QueryList, TemplateRef, AfterContentInit, OnChanges, OnInit, SimpleChanges,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CellDirective } from './cell.directive';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

export interface TableColumn {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  class?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, FormsModule, EmptyStateComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent implements AfterContentInit, OnInit, OnChanges {

  @Input() columns: TableColumn[] = [];
  @Input() rows: unknown[] = [];
  @Input() clickable = false;

  @Input() paginate = false;
  @Input() defaultPageSize = 10;

  @Input() emptyIcon  = 'list';
  @Input() emptyTitle = 'No data found';
  @Input() emptyMessage = '';
  @Input() emptyActionLabel?: string;
  @Input() emptyRoute?: string;

  @Output() rowClick = new EventEmitter<unknown>();

  @ContentChildren(CellDirective) private cellDefs!: QueryList<CellDirective>;
  private cellMap = new Map<string, TemplateRef<{ $implicit: unknown }>>();

  currentPage = 1;
  selectedPageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  ngOnInit(): void {
    this.selectedPageSize = this.defaultPageSize;
  }

  ngAfterContentInit(): void {
    this.cellDefs.changes.subscribe(() => this.buildMap());
    this.buildMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset to page 1 when rows change (new search/filter), but never touch selectedPageSize
    if (changes['rows'] && !changes['rows'].firstChange) {
      this.currentPage = 1;
    }
    if (changes['defaultPageSize']) {
      this.selectedPageSize = this.defaultPageSize;
    }
  }

  private buildMap(): void {
    this.cellMap.clear();
    this.cellDefs.forEach(d => this.cellMap.set(d.key, d.tpl));
  }

  get displayedRows(): unknown[] {
    if (!this.paginate) return this.rows;
    const start = (this.currentPage - 1) * this.selectedPageSize;
    return this.rows.slice(start, start + this.selectedPageSize);
  }

  get totalRows(): number { return this.rows.length; }
  get totalPages(): number { return Math.max(Math.ceil(this.totalRows / this.selectedPageSize), 1); }
  get startIndex(): number { return this.totalRows === 0 ? 0 : (this.currentPage - 1) * this.selectedPageSize + 1; }
  get endIndex(): number { return Math.min(this.currentPage * this.selectedPageSize, this.totalRows); }

  get pagesArray(): number[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    const start = Math.max(2, this.currentPage - 1);
    const end   = Math.min(total - 1, this.currentPage + 1);
    if (start > 2) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(-1);
    pages.push(total);
    return pages;
  }

  goToPage(page: number): void { if (page > 0) this.currentPage = page; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  onPageSizeChange(): void { this.currentPage = 1; }

  tpl(key: string): TemplateRef<{ $implicit: unknown }> | null {
    return this.cellMap.get(key) ?? null;
  }

  cellValue(row: unknown, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  onRowClick(row: unknown): void {
    if (this.clickable) this.rowClick.emit(row);
  }
}
