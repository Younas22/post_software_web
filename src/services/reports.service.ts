import { apiGet } from "@/lib/api/client";
import type { ListParams, PaginationMeta } from "@/lib/api/types";
import type { Expense, Inventory, Purchase, Sale } from "@/types";

export interface ReportFilters extends ListParams {
  branch_id?: number;
  cashier_id?: number;
  customer_id?: number;
  category_id?: number;
  payment_method_id?: number;
  supplier_id?: number;
  category?: string;
  date_from?: string;
  date_to?: string;
}

type Meta = PaginationMeta | Record<string, never>;

export interface ProductPerformanceRow {
  product_id: number;
  quantity_sold: number;
  revenue: number;
  product: { id: number; name: string; sku: string };
}

export interface CustomerSpendRow {
  customer_id: number;
  transaction_count: number;
  total_spent: number;
  customer: { id: number; name: string; phone: string };
}

export const reportsService = {
  sales: (params?: ReportFilters) =>
    apiGet<{
      summary: { transaction_count: number; subtotal: number; discount: number; tax: number; total: number };
      sales: { data: Sale[]; meta: Meta };
    }>("/reports/sales", { params }),
  purchases: (params?: ReportFilters) =>
    apiGet<{
      summary: { purchase_count: number; subtotal: number; discount: number; tax: number; total: number };
      purchases: { data: Purchase[]; meta: Meta };
    }>("/reports/purchases", { params }),
  expenses: (params?: ReportFilters) =>
    apiGet<{
      summary: { expense_count: number; total: number };
      by_category: { category: string; expense_count: number; total: number }[];
      expenses: { data: Expense[]; meta: Meta };
    }>("/reports/expenses", { params }),
  inventory: (params?: ReportFilters) =>
    apiGet<{
      summary: { total_units: number; stock_value: number; low_stock_count: number; out_of_stock_count: number; product_count: number };
      inventory: { data: Inventory[]; meta: Meta };
    }>("/reports/inventory", { params }),
  products: (params?: ReportFilters) =>
    apiGet<{ products: { data: ProductPerformanceRow[]; meta: Meta } }>("/reports/products", { params }),
  customers: (params?: ReportFilters) =>
    apiGet<{ customers: { data: CustomerSpendRow[]; meta: Meta } }>("/reports/customers", { params }),
  profit: (params?: ReportFilters) =>
    apiGet<{ revenue: number; estimated_cost: number; estimated_gross_profit: number }>("/reports/profit", { params }),
};
