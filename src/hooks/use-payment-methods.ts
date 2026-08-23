import { useQuery } from "@tanstack/react-query";
import { paymentMethodsService } from "@/services/payment-methods.service";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentMethodsService.list(),
    staleTime: 10 * 60_000,
  });
}
