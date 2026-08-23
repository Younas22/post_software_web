"use client";

import { RANGE_PRESET_LABELS, type RangePreset } from "@/hooks/use-date-range-preset";
import { DateRangePicker, type DateRange } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

const PRESETS: RangePreset[] = ["today", "yesterday", "7d", "30d", "this_month", "last_month", "custom"];

export function RangePresetTabs({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
  className,
}: {
  value: RangePreset;
  onChange: (preset: RangePreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
              value === preset ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {RANGE_PRESET_LABELS[preset]}
          </button>
        ))}
      </div>
      {value === "custom" && <DateRangePicker value={customRange} onChange={onCustomRangeChange} />}
    </div>
  );
}
