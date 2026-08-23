import { createCrudService } from "@/lib/api/crud-factory";
import type { Brand } from "@/types";

export interface BrandPayload {
  name: string;
  status: "active" | "inactive";
}

export const brandsService = createCrudService<Brand, BrandPayload>("/brands");
