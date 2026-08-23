import { apiDelete, apiGet, apiGetList, apiPost, apiPut } from "./client";
import type { ListParams } from "./types";

/**
 * Standard index/show/store/update/destroy service for a resource that
 * follows the platform's common REST shape (every Category/Brand/Customer/
 * Supplier-style controller in post_software). Module-specific services
 * still get their own file for anything beyond this (custom actions,
 * different field sets) — this only removes the boilerplate for the plain
 * CRUD part.
 */
export function createCrudService<T, CreatePayload = Partial<T>, UpdatePayload = CreatePayload>(basePath: string) {
  return {
    list: (params?: ListParams) => apiGetList<T>(basePath, { params }),
    get: (id: number | string) => apiGet<T>(`${basePath}/${id}`),
    create: (payload: CreatePayload) => apiPost<T>(basePath, payload),
    update: (id: number | string, payload: UpdatePayload) => apiPut<T>(`${basePath}/${id}`, payload),
    remove: (id: number | string) => apiDelete<null>(`${basePath}/${id}`),
  };
}
