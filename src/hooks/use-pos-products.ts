import { useQuery } from "@tanstack/react-query";
import { productsService } from "@/services/products.service";

export function usePosProducts({
  search,
  categoryId,
  page,
}: {
  search: string;
  categoryId: number | null;
  page: number;
}) {
  return useQuery({
    queryKey: ["pos", "products", search, categoryId, page],
    queryFn: () =>
      productsService.list({
        search: search || undefined,
        category_id: categoryId ?? undefined,
        status: "active",
        page,
        per_page: 24,
      }),
    placeholderData: (prev) => prev,
  });
}
