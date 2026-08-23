import { apiGetList, apiPost } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { Inventory, StockMovement } from "@/types";

export interface AdjustStockPayload {
  branch_id: number;
  product_id: number;
  quantity: number;
  notes?: string | null;
}

export const inventoryService = {
  list: (params?: ListParams) => apiGetList<Inventory>("/inventory", { params }),
  lowStock: (params?: ListParams) => apiGetList<Inventory>("/inventory/low-stock", { params }),
  adjust: (payload: AdjustStockPayload) => apiPost<Inventory>("/inventory/adjust", payload),
  productMovements: (productId: number, params?: ListParams) =>
    apiGetList<StockMovement>(`/products/${productId}/movements`, { params }),
  movements: (params?: ListParams) => apiGetList<StockMovement>("/stock-movements", { params }),
};
