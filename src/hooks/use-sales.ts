import { useQuery } from "@tanstack/react-query";
import { salesService } from "@/services/sales.service";
import type { ListParams } from "@/lib/api/types";

export function useSales(params?: ListParams) {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: () => salesService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useSale(id: number | undefined) {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: () => salesService.get(id!),
    enabled: !!id,
  });
}

export function useSaleReceipt(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ["sales", id, "receipt"],
    queryFn: () => salesService.receipt(id!),
    enabled: !!id && enabled,
  });
}
