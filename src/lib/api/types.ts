/**
 * Mirrors App\Support\ApiResponse exactly (see
 * docs/LARAVEL_API_DISCOVERY.md §17) — every /api/v1/* response, success or
 * error, uses this envelope. Never invent a different shape.
 */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  [key: string]: unknown;
}

export interface ApiCollection<T> {
  success: true;
  message: string;
  data: T[];
  meta: PaginationMeta | Record<string, never>;
}

export interface ApiError {
  success: false;
  message: string;
  errors: Record<string, string[]> | Record<string, never>;
}

export type ListParams = {
  search?: string;
  page?: number;
  per_page?: number;
  [key: string]: string | number | boolean | undefined;
};
