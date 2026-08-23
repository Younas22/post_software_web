import { apiGet } from "@/lib/api/client";
import type { ConfigBootstrap } from "@/types";

export const configService = {
  get: () => apiGet<ConfigBootstrap>("/config"),
};
