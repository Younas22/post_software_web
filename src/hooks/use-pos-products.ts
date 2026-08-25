import { useQuery } from "@tanstack/react-query";
import { productsService } from "@/services/products.service";
import type { ProductType } from "@/types";

export function usePosProducts({
  search,
  categoryId,
  type,
  page,
}: {
  search: string;
  categoryId: number | null;
  /** undefined = both products and services (the POS default). */
  type?: ProductType;
  page: number;
}) {
  return useQuery({
    queryKey: ["pos", "products", search, categoryId, type, page],
    queryFn: () =>
      productsService.list({
        search: search || undefined,
        category_id: categoryId ?? undefined,
        type,
        status: "active",
        page,
        per_page: 24,
      }),
    // Reuse the previous page's data as a placeholder only when the Product/
    // Service filter hasn't changed — carrying it across a `type` switch
    // would flash the *other* type's cards (wrongly tagged Product/Service)
    // under the new filter pill while the real request is still in flight,
    // which is exactly the kind of mis-tagged card this filter exists to
    // prevent someone from adding to the cart.
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[4] === type ? prev : undefined),
  });
}
