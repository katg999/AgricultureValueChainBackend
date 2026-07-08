// core/services/grade.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiResponse } from '../models/api-response.model';

export interface GradeResponse {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class GradeService {
  constructor(private http: HttpClient) {}

  list(): Observable<GradeResponse[]> {
    return this.http
      .get<ApiResponse<GradeResponse[]>>(API_ENDPOINTS.CONFIGURATION.GRADES)
      .pipe(map((res) => res.data));
  }
}
