import { apiGet } from "@/lib/api/client";
import type { PaymentMethod } from "@/types";

export const paymentMethodsService = {
  list: () => apiGet<PaymentMethod[]>("/payment-methods"),
};
