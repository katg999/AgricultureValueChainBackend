import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

/** Settlement details for farmer payment disbursements */
export interface CooperativeBankDetails {
  bankName: string;
  bankBranch?: string;
  accountName: string;
  accountNumber: string;
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
}

export interface CooperativeAdminRequest {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  nationalId?: string;
  gender?: string;
  photoBase64?: string | null;
}

export interface CreateCooperativeRequest {
  name: string;
  registrationNumber: string;
  address: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  poBox?: string;
  websiteUrl?: string;
  country: string;
  defaultBranchName: string;
  defaultBranchLocation?: string;
  bankDetails?: CooperativeBankDetails;
  admin1?: CooperativeAdminRequest;
  admin2?: CooperativeAdminRequest;
}

@Injectable({ providedIn: 'root' })
export class CooperativeService {
  constructor(private http: HttpClient) {}

  createCooperative(payload: CreateCooperativeRequest): Observable<any> {
    return this.http.post(API_ENDPOINTS.PLATFORM.COOPERATIVES, payload);
  }
}
