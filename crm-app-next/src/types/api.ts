// ============================================================
// API Request/Response Types
// ============================================================

export type SortDirection = "asc" | "desc";

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface FilterParams {
  [key: string]: string | string[] | number | boolean | undefined;
}

export interface SearchParams extends PaginationParams {
  search?: string;
  sort?: SortParams;
  filters?: FilterParams;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string[]>;
}

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

export interface MutationResponse<T> {
  data: T;
  message: string;
}
