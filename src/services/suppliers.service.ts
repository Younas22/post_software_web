import { createCrudService } from "@/lib/api/crud-factory";
import type { Supplier } from "@/types";

export interface SupplierPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status: "active" | "inactive";
}

export const suppliersService = createCrudService<Supplier, SupplierPayload>("/suppliers");
