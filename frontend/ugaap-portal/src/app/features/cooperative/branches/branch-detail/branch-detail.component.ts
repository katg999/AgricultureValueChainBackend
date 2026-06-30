import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ToastService } from '../../../../core/services/toast.service';
import { CollectionHubsService, CollectionHub } from '../../collection-hubs/collection-hubs.service';
import { MOCK_FARMER_LIST } from '../../../../core/mock/mock-farmer';
import type { FarmerListItem } from '../../../../core/models/farmer.model';

interface Branch {
  id: number;
  name: string;
  location: string;
  farmers: number;
  centres: number;
  status: 'ACTIVE' | 'PENDING';
  branchCode: string;
}

// Mirrors the seed in branch-dash.component.ts; branchCode links to FarmerListItem.branchId
export const BRANCH_SEED: Branch[] = [
  { id: 1,  name: 'Kampala Central Hub',    location: 'Kampala, Central Region', farmers: 1240, centres: 5, status: 'ACTIVE',  branchCode: 'BR-KLA' },
  { id: 2,  name: 'Gulu Northern Branch',   location: 'Gulu, Northern Uganda',   farmers: 876,  centres: 3, status: 'ACTIVE',  branchCode: 'BR-GUL' },
  { id: 3,  name: 'Mbarara Dairy Centre',   location: 'Mbarara, Western',        farmers: 2034, centres: 6, status: 'ACTIVE',  branchCode: 'BR-MBA' },
  { id: 4,  name: 'Jinja East Office',      location: 'Jinja, Eastern',          farmers: 567,  centres: 2, status: 'PENDING', branchCode: 'BR-JIN' },
  { id: 5,  name: 'Fort Portal Collection', location: 'Fort Portal, West',       farmers: 342,  centres: 1, status: 'ACTIVE',  branchCode: 'BR-FPT' },
  { id: 6,  name: 'Mbale Highlands Branch', location: 'Mbale, Eastern',          farmers: 985,  centres: 4, status: 'ACTIVE',  branchCode: 'BR-MBL' },
  { id: 7,  name: 'Soroti Regional',        location: 'Soroti, Teso',            farmers: 428,  centres: 2, status: 'PENDING', branchCode: 'BR-SOR' },
  { id: 8,  name: 'Arua West Nile',         location: 'Arua, West Nile',         farmers: 763,  centres: 3, status: 'ACTIVE',  branchCode: 'BR-ARU' },
  { id: 9,  name: 'Masaka Green',           location: 'Masaka, Central',         farmers: 592,  centres: 2, status: 'ACTIVE',  branchCode: 'BR-MSK' },
  { id: 10, name: 'Lira Cooperative',       location: 'Lira, Lango',             farmers: 311,  centres: 1, status: 'ACTIVE',  branchCode: 'BR-LIR' },
];

interface BranchEditForm {
  name: string;
  location: string;
  status: 'ACTIVE' | 'PENDING';
}

type TabId = 'overview' | 'farmers' | 'hubs';

@Component({
  selector: 'app-branch-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent, ModalComponent],
  templateUrl: './branch-detail.component.html',
  styleUrls: ['./branch-detail.component.css'],
})
export class BranchDetailComponent implements OnInit {
  branch: Branch | null = null;
  farmers: FarmerListItem[] = [];
  hubs: CollectionHub[] = [];

  activeTab: TabId = 'overview';
  showEditModal = false;
  editForm: BranchEditForm = { name: '', location: '', status: 'ACTIVE' };

  farmerSearch = '';
  hubSearch = '';

  private toast = inject(ToastService);
  private hubsService = inject(CollectionHubsService);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.branch = BRANCH_SEED.find(b => b.id === id) ?? null;

    if (!this.branch) {
      this.router.navigate(['/cooperative/branches/dashboard']);
      return;
    }

    // Match farmers by branchId (e.g. 'BR-KLA')
    this.farmers = MOCK_FARMER_LIST.filter(f => f.branchId === this.branch!.branchCode);

    // Match hubs by the first word of the branch name against hub branchName
    // e.g. "Gulu Northern Branch" → keyword "gulu" → matches "Gulu North" hub
    const keyword = this.branch.name.split(' ')[0].toLowerCase();
    this.hubsService.list().subscribe(hubs => {
      this.hubs = hubs.filter(h => h.branchName.toLowerCase().includes(keyword));
    });
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
  }

  get filteredFarmers(): FarmerListItem[] {
    const q = this.farmerSearch.trim().toLowerCase();
    if (!q) return this.farmers;
    return this.farmers.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q) ||
      f.primaryCommodity.toLowerCase().includes(q) ||
      f.status.toLowerCase().includes(q),
    );
  }

  get filteredHubs(): CollectionHub[] {
    const q = this.hubSearch.trim().toLowerCase();
    if (!q) return this.hubs;
    return this.hubs.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.hubCode.toLowerCase().includes(q) ||
      h.location.toLowerCase().includes(q),
    );
  }

  openEdit(): void {
    if (!this.branch) return;
    this.editForm = { name: this.branch.name, location: this.branch.location, status: this.branch.status };
    this.showEditModal = true;
  }

  saveEdit(): void {
    if (!this.branch) return;
    this.branch = { ...this.branch, ...this.editForm };
    this.showEditModal = false;
    this.toast.success('Branch updated', `${this.branch.name} has been saved.`);
  }

  goBack(): void {
    this.router.navigate(['/cooperative/branches/dashboard']);
  }

  statusClass(status: string): string {
    return status === 'ACTIVE' ? 'badge-active' : 'badge-pending';
  }

  farmerStatusClass(status: string): string {
    const map: Record<string, string> = {
      Active: 'pill-active', Pending: 'pill-pending',
      Rejected: 'pill-rejected', Suspended: 'pill-suspended',
    };
    return map[status] ?? '';
  }

  hubLoadPercent(hub: CollectionHub): number {
    return hub.capacity > 0 ? Math.round((hub.currentLoad / hub.capacity) * 100) : 0;
  }

  hubLoadClass(hub: CollectionHub): string {
    const pct = this.hubLoadPercent(hub);
    if (pct >= 80) return 'load-critical';
    if (pct >= 50) return 'load-warning';
    return 'load-ok';
  }
}
