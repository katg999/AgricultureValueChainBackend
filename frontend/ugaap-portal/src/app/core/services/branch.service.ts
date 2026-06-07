// core/services/branch.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface BranchCreatePayload {
  name: string;
  tenantId: string;
  registrationNumber: string;
  location: string;
  region: string;
  country: string;
  establishedDate: string;
  address: string;
  poBox: string;
  websiteUrl: string;
}

export interface BranchResponse {
  branchId: string;
  name: string;
  tenantId: string;
  location: string;
  branchCode: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  constructor(private http: HttpClient) {}

  createBranch(payload: BranchCreatePayload): Observable<BranchResponse> {
    return this.http.post<BranchResponse>(API_ENDPOINTS.BRANCHES.CREATE, payload);
  }

  listBranches(tenantId: string): Observable<BranchResponse[]> {
    return this.http.get<BranchResponse[]>(API_ENDPOINTS.BRANCHES.LIST(tenantId));
  }

  getBranch(branchId: string): Observable<BranchResponse> {
    return this.http.get<BranchResponse>(API_ENDPOINTS.BRANCHES.BY_ID(branchId));
  }
}
