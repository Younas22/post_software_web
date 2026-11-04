import { apiGet } from "@/lib/api/client";
import type { BusinessTypeBranding, PlatformInfo } from "@/types";

export const brandingService = {
  /** Public (no token) — the business type behind a /login/{slug} URL. */
  get: (slug: string) => apiGet<BusinessTypeBranding>(`/public/branding/${encodeURIComponent(slug)}`),

  /** Public (no token) — the POS company's name, office and support contacts. */
  platform: () => apiGet<PlatformInfo>("/public/platform"),
};
