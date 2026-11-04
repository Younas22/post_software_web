import { apiGet } from "@/lib/api/client";
import type { BusinessTypeBranding } from "@/types";

export const brandingService = {
  /** Public (no token) — the business type behind a /login/{slug} URL. */
  get: (slug: string) => apiGet<BusinessTypeBranding>(`/public/branding/${encodeURIComponent(slug)}`),
};
