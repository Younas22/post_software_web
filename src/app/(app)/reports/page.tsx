"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";
import { SalesReportTab } from "@/components/reports/sales-report-tab";
import { PurchasesReportTab } from "@/components/reports/purchases-report-tab";
import { ExpensesReportTab } from "@/components/reports/expenses-report-tab";
import { InventoryReportTab } from "@/components/reports/inventory-report-tab";
import { ProductsReportTab } from "@/components/reports/products-report-tab";
import { CustomersReportTab } from "@/components/reports/customers-report-tab";
import { ProfitReportTab } from "@/components/reports/profit-report-tab";

export default function ReportsPage() {
  const { hasFeature, config } = useAuth();
  const currency = config?.business?.currency ?? "USD";

  if (!hasFeature("reports")) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Reports are not enabled"
        description="The Reports feature isn't enabled for your business plan. Contact your administrator."
        className="py-24"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real business data, filterable by date and branch.</p>
      </div>

      <Tabs defaultValue="sales">
        <div className="no-scrollbar overflow-x-auto">
          <TabsList>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="profit">Profit</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="sales">
          <SalesReportTab currency={currency} />
        </TabsContent>
        <TabsContent value="purchases">
          <PurchasesReportTab currency={currency} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesReportTab currency={currency} />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryReportTab currency={currency} />
        </TabsContent>
        <TabsContent value="products">
          <ProductsReportTab currency={currency} />
        </TabsContent>
        <TabsContent value="customers">
          <CustomersReportTab currency={currency} />
        </TabsContent>
        <TabsContent value="profit">
          <ProfitReportTab currency={currency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
