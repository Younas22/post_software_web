import { apiGet } from "@/lib/api/client";
import type { SubscriptionInfo } from "@/types";

export const subscriptionService = {
  get: () => apiGet<SubscriptionInfo>("/subscription"),
};
