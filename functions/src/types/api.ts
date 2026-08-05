// src/types/api.ts
export interface ApiSuccess<T> {
  data: T | null;
  error: null;
}

export interface ApiError {
  code: string;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | { data: null; error: ApiError };
