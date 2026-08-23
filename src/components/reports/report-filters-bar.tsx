"use client";

import { RangePresetTabs } from "@/components/shared/range-preset-tabs";
import { FilterBar, FilterSelect } from "@/components/ui/filter";
import { useActiveBranch } from "@/hooks/use-active-branch";
import type { RangePreset } from "@/hooks/use-date-range-preset";
import type { DateRange } from "@/components/ui/date-picker";

/** Shared date-range + branch filter row used by every report tab. */
export function ReportFiltersBar({
  preset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
  branchId,
  onBranchChange,
  extra,
}: {
  preset: RangePreset;
  onPresetChange: (p: RangePreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (r: DateRange) => void;
  branchId?: string;
  onBranchChange?: (v: string | undefined) => void;
  extra?: React.ReactNode;
}) {
  const { branches, isPinned } = useActiveBranch();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <RangePresetTabs value={preset} onChange={onPresetChange} customRange={customRange} onCustomRangeChange={onCustomRangeChange} />
      {onBranchChange && !isPinned && branches.length > 1 && (
        <FilterBar>
          <FilterSelect
            label="Branch"
            placeholder="All branches"
            value={branchId}
            onChange={onBranchChange}
            options={branches.map((b) => ({ label: b.name, value: String(b.id) }))}
          />
          {extra}
        </FilterBar>
      )}
    </div>
  );
}
