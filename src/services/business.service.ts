import { apiGet, apiPut } from "@/lib/api/client";
import type { Business, LocaleOptions } from "@/types";

export interface UpdateBusinessPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  currency: string;
  timezone: string;
  logo?: File | null;
}

export const businessService = {
  get: () => apiGet<Business>("/business"),
  localeOptions: () => apiGet<LocaleOptions>("/business/locale-options"),
  update: (payload: UpdateBusinessPayload) => {
    if (payload.logo) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        form.append(key, value instanceof File ? value : String(value));
      });
      form.append("_method", "PUT");
      return apiPut<Business>("/business", form, { headers: { "Content-Type": "multipart/form-data" } });
    }
    const { logo: _logo, ...rest } = payload;
    void _logo;
    return apiPut<Business>("/business", rest);
  },
  updateSettings: (settings: Record<string, string | number | boolean | null>) =>
    apiPut<Record<string, unknown>>("/business/settings", settings),
};
