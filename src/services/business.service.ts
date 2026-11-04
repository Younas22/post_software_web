import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Business, LocaleOptions } from "@/types";

export interface UpdateBusinessPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  currency: string;
  timezone: string;
  logo?: File | null;
  /** Browser-tab icon (PNG / ICO / JPG / WebP). */
  favicon?: File | null;
  remove_logo?: boolean;
  remove_favicon?: boolean;
}

export const businessService = {
  get: () => apiGet<Business>("/business"),
  localeOptions: () => apiGet<LocaleOptions>("/business/locale-options"),
  update: (payload: UpdateBusinessPayload) => {
    if (payload.logo || payload.favicon) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === "boolean") {
          form.append(key, value ? "1" : "0");
          return;
        }
        form.append(key, value instanceof File ? value : String(value));
      });
      // Sent as POST + _method=PUT: PHP only parses multipart bodies on POST,
      // so a real multipart PUT would arrive with no fields/files at all.
      form.append("_method", "PUT");
      return apiPost<Business>("/business", form, { headers: { "Content-Type": "multipart/form-data" } });
    }
    const { logo: _logo, favicon: _favicon, ...rest } = payload;
    void _logo;
    void _favicon;
    return apiPut<Business>("/business", rest);
  },
  updateSettings: (settings: Record<string, string | number | boolean | null>) =>
    apiPut<Record<string, unknown>>("/business/settings", settings),
};
