import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class MakerCheckerService {
  constructor(private http: HttpClient) {}

  setup(payload: any, makerPhoto?: File | null, checkerPhoto?: File | null): Observable<any> {
    const formData = new FormData();

    // Append JSON data as a string part named "data"
    const { makerPhoto: _, checkerPhoto: __, ...data } = payload;
    formData.append('data', JSON.stringify(data));

    // Append photos if provided
    if (makerPhoto) {
      formData.append('makerPhoto', makerPhoto);
    }
    if (checkerPhoto) {
      formData.append('checkerPhoto', checkerPhoto);
    }

    // Do NOT set Content-Type — browser sets it automatically with the boundary
    return this.http.post(API_ENDPOINTS.MAKER_CHECKER.SETUP, formData);
  }
}