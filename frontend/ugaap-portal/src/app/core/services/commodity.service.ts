// core/services/commodity.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiResponse } from '../models/api-response.model';

export interface CommodityResponse {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
}

export interface CommodityCreatePayload {
  name: string;
  code: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CommodityService {
  constructor(private http: HttpClient) {}

  list(): Observable<CommodityResponse[]> {
    return this.http
      .get<ApiResponse<CommodityResponse[]>>(API_ENDPOINTS.CONFIGURATION.COMMODITIES)
      .pipe(map((res) => res.data));
  }

  create(payload: CommodityCreatePayload): Observable<CommodityResponse> {
    return this.http
      .post<ApiResponse<CommodityResponse>>(API_ENDPOINTS.CONFIGURATION.COMMODITIES, payload)
      .pipe(map((res) => res.data));
  }
}
