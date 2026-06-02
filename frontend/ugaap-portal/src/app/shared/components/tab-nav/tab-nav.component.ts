import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
}

@Component({
  selector: 'app-tab-nav',
  standalone: true,
  templateUrl: './tab-nav.component.html',
  styleUrls: ['./tab-nav.component.css']
})
export class TabNavComponent {
  @Input() tabs: TabItem[] = [];
  @Input() activeTab: string = '';
  @Output() tabChanged = new EventEmitter<string>();

  selectTab(tabId: string): void {
    this.tabChanged.emit(tabId);
  }
}
