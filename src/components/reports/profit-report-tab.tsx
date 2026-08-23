"use client";

import { useState } from "react";
import { TrendingUp, DollarSign, Wallet } from "lucide-react";
import { useProfitReport } from "@/hooks/use-reports";
import { useDateRangePreset } from "@/hooks/use-date-range-preset";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { ReportFiltersBar } from "./report-filters-bar";
import { StatCard } from "@/components/shared/stat-card";
import { Alert } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";

export function ProfitReportTab({ currency }: { currency: string }) {
  const { preset, setPreset, customRange, setCustomRange, range } = useDateRangePreset("30d");
  const { branchId: activeBranchId } = useActiveBranch();
  const [branchId, setBranchId] = useState<string | undefined>();

  const report = useProfitReport({ ...range, branch_id: branchId ? Number(branchId) : undefined }, !!activeBranchId);

  return (
    <div className="space-y-4">
      <ReportFiltersBar preset={preset} onPresetChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} branchId={branchId} onBranchChange={setBranchId} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Revenue" value={formatCurrency(report.data?.revenue ?? 0, currency)} icon={DollarSign} tone="brand" isLoading={report.isLoading} />
        <StatCard label="Estimated Cost" value={formatCurrency(report.data?.estimated_cost ?? 0, currency)} icon={Wallet} isLoading={report.isLoading} />
        <StatCard
          label="Estimated Gross Profit"
          value={formatCurrency(report.data?.estimated_gross_profit ?? 0, currency)}
          icon={TrendingUp}
          tone={report.data && report.data.estimated_gross_profit >= 0 ? "success" : "error"}
          isLoading={report.isLoading}
        />
      </div>
      <Alert variant="info">
        Cost is estimated from each product&apos;s <em>current</em> purchase price, not the historical cost at the
        time of sale — the backend does not currently snapshot per-sale cost, so this is a documented approximation.
      </Alert>
    </div>
  );
}
