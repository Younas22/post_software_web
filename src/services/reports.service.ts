import { apiGet } from "@/lib/api/client";
import type { ListParams } from "@/lib/api/types";
import type { Purchase, Sale } from "@/types";

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

export const reportsService = {
  sales: (params?: ReportFilters) =>
    apiGet<{
      summary: { transaction_count: number; subtotal: number; discount: number; tax: number; total: number };
      sales: { data: Sale[]; meta: unknown };
    }>("/reports/sales", { params }),
  purchases: (params?: ReportFilters) =>
    apiGet<{
      summary: { purchase_count: number; subtotal: number; discount: number; tax: number; total: number };
      purchases: { data: Purchase[]; meta: unknown };
    }>("/reports/purchases", { params }),
  expenses: (params?: ReportFilters) =>
    apiGet<{
      summary: { expense_count: number; total: number };
      by_category: { category: string; expense_count: number; total: number }[];
      expenses: { data: unknown[]; meta: unknown };
    }>("/reports/expenses", { params }),
  inventory: (params?: ReportFilters) =>
    apiGet<{
      summary: { total_units: number; stock_value: number; low_stock_count: number };
      inventory: { data: unknown[]; meta: unknown };
    }>("/reports/inventory", { params }),
  products: (params?: ReportFilters) =>
    apiGet<{ products: { data: { product_id: number; quantity_sold: number; revenue: number; product: { id: number; name: string; sku: string } }[]; meta: unknown } }>(
      "/reports/products",
      { params }
    ),
  customers: (params?: ReportFilters) =>
    apiGet<{ customers: { data: { customer_id: number; transaction_count: number; total_spent: number; customer: { id: number; name: string; phone: string } }[]; meta: unknown } }>(
      "/reports/customers",
      { params }
    ),
  profit: (params?: ReportFilters) =>
    apiGet<{ revenue: number; estimated_cost: number; estimated_gross_profit: number }>("/reports/profit", { params }),
};
