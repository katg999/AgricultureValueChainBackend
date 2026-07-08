// core/services/price.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiResponse } from '../models/api-response.model';

export interface PriceResponse {
  id: string;
  commodityName: string;
  commodityCode: string;
  gradeName: string | null;
  gradeCode: string | null;
  branchName: string;
  currentPrice: number;
  newPrice: number;
  changePercent: number;
}

export interface FlatPricePayload {
  commodityId: string;
  pricePerKg: number;
  branchName: string;
}

export interface GradePricePayload {
  commodityId: string;
  gradeId: string;
  pricePerKg: number;
  branchName: string;
}

@Injectable({ providedIn: 'root' })
export class PriceService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<PriceResponse[]> {
    return this.http
      .get<ApiResponse<PriceResponse[]>>(API_ENDPOINTS.CONFIGURATION.PRICES_ALL)
      .pipe(map((res) => res.data));
  }

  setFlatPrice(payload: FlatPricePayload): Observable<PriceResponse> {
    return this.http
      .post<ApiResponse<PriceResponse>>(API_ENDPOINTS.CONFIGURATION.PRICE_FLAT, payload)
      .pipe(map((res) => res.data));
  }

  setGradePrice(payload: GradePricePayload): Observable<PriceResponse> {
    return this.http
      .post<ApiResponse<PriceResponse>>(API_ENDPOINTS.CONFIGURATION.PRICE_GRADE, payload)
      .pipe(map((res) => res.data));
  }
}
