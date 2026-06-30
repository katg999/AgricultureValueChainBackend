import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ToastService } from '../../../../core/services/toast.service';
import { BranchService, CooperativeBranch } from '../../../../core/services/branch.service';
import { CollectionHubsService, CollectionHub } from '../../collection-hubs/collection-hubs.service';
import { MOCK_FARMER_LIST } from '../../../../core/mock/mock-farmer';
import type { FarmerListItem } from '../../../../core/models/farmer.model';

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
  branch: CooperativeBranch | null = null;
  farmers: FarmerListItem[] = [];
  hubs: CollectionHub[] = [];

  activeTab: TabId = 'overview';
  showEditModal = false;
  editForm: BranchEditForm = { name: '', location: '', status: 'ACTIVE' };

  farmerSearch = '';
  hubSearch = '';

  private toast = inject(ToastService);
  private branchService = inject(BranchService);
  private hubsService = inject(CollectionHubsService);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.branchService.getCooperativeBranchById(id).subscribe(branch => {
      if (!branch) {
        this.router.navigate(['/cooperative/branches/dashboard']);
        return;
      }
      this.branch = branch;

      // Filter farmers by branchCode (e.g. 'BR-KLA')
      this.farmers = MOCK_FARMER_LIST.filter(f => f.branchId === branch.branchCode);

      // Filter hubs by first word of branch name (e.g. "Gulu" matches "Gulu North" hub)
      const keyword = branch.name.split(' ')[0].toLowerCase();
      this.hubsService.list().subscribe(hubs => {
        this.hubs = hubs.filter(h => h.branchName.toLowerCase().includes(keyword));
      });
    });
  }

  setTab(tab: TabId): void { this.activeTab = tab; }

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

  goBack(): void { this.router.navigate(['/cooperative/branches/dashboard']); }

  statusClass(status: string): string { return status === 'ACTIVE' ? 'badge-active' : 'badge-pending'; }

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
