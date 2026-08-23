import { createCrudService } from "@/lib/api/crud-factory";
import type { Category } from "@/types";

export interface CategoryPayload {
  name: string;
  status: "active" | "inactive";
}

export const categoriesService = createCrudService<Category, CategoryPayload>("/categories");
