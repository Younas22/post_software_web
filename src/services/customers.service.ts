import { createCrudService } from "@/lib/api/crud-factory";
import { apiDelete, apiPost, http } from "@/lib/api/client";
import type { Customer } from "@/types";

export interface CustomerPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status: "active" | "inactive";
}

export const customersService = {
  ...createCrudService<Customer, CustomerPayload & { guardian_relation?: string | null; guardian_name?: string | null }>("/customers"),

  /** Upload / replace the customer's photo (JPG, PNG or WebP). */
  uploadPhoto: (id: number, file: Blob, filename = "photo.jpg") => {
    const form = new FormData();
    form.append("photo", file, filename);
    return apiPost<Customer>(`/customers/${id}/photo`, form, { headers: { "Content-Type": "multipart/form-data" } });
  },

  removePhoto: (id: number) => apiDelete<Customer>(`/customers/${id}/photo`),

  /**
   * The photo is private (no public URL): fetched with the session's token
   * and handed back as an object URL for <img>. Caller revokes it.
   */
  photoObjectUrl: async (id: number): Promise<string | null> => {
    try {
      const res = await http.get(`/customers/${id}/photo`, { responseType: "blob" });
      return URL.createObjectURL(res.data as Blob);
    } catch {
      return null;
    }
  },
};
