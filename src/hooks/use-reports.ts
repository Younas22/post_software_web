import { useQuery } from "@tanstack/react-query";
import { reportsService, type ReportFilters } from "@/services/reports.service";

export function useSalesReport(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "sales", filters],
    queryFn: () => reportsService.sales(filters),
    enabled,
  });
}

export function usePurchasesReport(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "purchases", filters],
    queryFn: () => reportsService.purchases(filters),
    enabled,
  });
}

export function useExpensesReport(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "expenses", filters],
    queryFn: () => reportsService.expenses(filters),
    enabled,
  });
}

export function useInventoryReport(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "inventory", filters],
    queryFn: () => reportsService.inventory(filters),
    enabled,
  });
}

export function useProductsReport(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "products", filters],
    queryFn: () => reportsService.products(filters),
    enabled,
  });
}

export function useCustomersReport(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "customers", filters],
    queryFn: () => reportsService.customers(filters),
    enabled,
  });
}

export function useProfitReport(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: ["reports", "profit", filters],
    queryFn: () => reportsService.profit(filters),
    enabled,
  });
}
