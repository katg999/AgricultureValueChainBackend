// core/models/api-response.model.ts
export interface ApiResponse<T> {
  message: string;
  data: T;
}
