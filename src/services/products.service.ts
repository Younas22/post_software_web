import { apiDelete, apiGet, apiGetList, apiPost } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { Product, ProductType } from "@/types";

export interface ProductPayload {
  name: string;
  sku: string;
  barcode?: string | null;
  category_id?: number | null;
  brand_id?: number | null;
  /** Defaults to "product" server-side when omitted. */
  type?: ProductType;
  purchase_price: number;
  sale_price: number;
  tax_rate?: number | null;
  unit?: string;
  minimum_stock?: number;
  status: "active" | "inactive";
  description?: string | null;
  image?: File | null;
}

function toFormData(payload: ProductPayload): FormData {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) {
      form.append(key, value);
    } else {
      form.append(key, String(value));
    }
  });
  return form;
}

export const productsService = {
  list: (params?: ListParams) => apiGetList<Product>("/products", { params }),
  get: (id: number) => apiGet<Product>(`/products/${id}`),
  create: (payload: ProductPayload) =>
    apiPost<Product>("/products", toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // POST + _method=PUT (Laravel form-method spoofing) — a genuine PUT with
  // a multipart body is unreliable across browsers/axios, so updates that
  // may include a new image use the same spoofing convention Laravel's own
  // web forms use for file-bearing updates.
  update: (id: number, payload: ProductPayload) => {
    const form = toFormData(payload);
    form.append("_method", "PUT");
    return apiPost<Product>(`/products/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  remove: (id: number) => apiDelete<null>(`/products/${id}`),
};
