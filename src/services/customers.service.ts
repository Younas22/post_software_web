import { createCrudService } from "@/lib/api/crud-factory";
import type { Customer } from "@/types";

export interface CustomerPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status: "active" | "inactive";
}

export const customersService = createCrudService<Customer, CustomerPayload>("/customers");
