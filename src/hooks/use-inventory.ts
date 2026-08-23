import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory.service";
import type { ListParams } from "@/lib/api/types";

export function useLowStock(params?: ListParams, enabled = true) {
  return useQuery({
    queryKey: ["inventory", "low-stock", params],
    queryFn: () => inventoryService.lowStock(params),
    enabled,
  });
}

export function useInventoryList(params?: ListParams, enabled = true) {
  return useQuery({
    queryKey: ["inventory", "list", params],
    queryFn: () => inventoryService.list(params),
    enabled,
  });
}
