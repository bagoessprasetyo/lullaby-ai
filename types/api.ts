import { ApiError } from "./error";

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiConfig {
  baseUrl: string;
  version: string;
  timeout: number;
  retryAttempts: number;
}