import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-export-dropdown',
  standalone: true,
  templateUrl: './export-dropdown.component.html',
  styleUrls: ['./export-dropdown.component.css']
})
export class ExportDropdownComponent {
  @Input() loading = false;
  @Output() export = new EventEmitter<'excel' | 'pdf' | 'csv' | 'print'>();

  isOpen = false;

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  onExport(type: 'excel' | 'pdf' | 'csv' | 'print', event: MouseEvent): void {
    event.stopPropagation();
    this.export.emit(type);
    this.isOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isOpen = false;
  }
}
