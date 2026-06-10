import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface CreateCooperativeRequest {
  name: string;
  registrationNumber: string;
  address: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  poBox?: string;
  websiteUrl?: string;
  country: string;
  defaultBranchName: string;
  defaultBranchLocation?: string;
}

@Injectable({ providedIn: 'root' })
export class CooperativeService {
  constructor(private http: HttpClient) {}

  createCooperative(payload: CreateCooperativeRequest): Observable<any> {
    return this.http.post(API_ENDPOINTS.PLATFORM.COOPERATIVES, payload);
  }
}
