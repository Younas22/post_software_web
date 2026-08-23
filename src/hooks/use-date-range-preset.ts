import { useState } from "react";
import { format, subDays } from "date-fns";

export type RangePreset = "today" | "yesterday" | "7d" | "30d" | "this_month" | "last_month" | "custom";

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "7 Days",
  "30d": "30 Days",
  this_month: "This Month",
  last_month: "Last Month",
  custom: "Custom",
};

function iso(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/** Resolves a named preset (or an explicit custom range) into date_from/date_to strings for the reports API. */
export function resolvePresetRange(preset: RangePreset, custom?: { from?: Date; to?: Date }) {
  const now = new Date();
  switch (preset) {
    case "today":
      return { date_from: iso(now), date_to: iso(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { date_from: iso(y), date_to: iso(y) };
    }
    case "7d":
      return { date_from: iso(subDays(now, 6)), date_to: iso(now) };
    case "30d":
      return { date_from: iso(subDays(now, 29)), date_to: iso(now) };
    case "this_month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { date_from: iso(from), date_to: iso(now) };
    }
    case "last_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { date_from: iso(from), date_to: iso(to) };
    }
    case "custom":
      return {
        date_from: custom?.from ? iso(custom.from) : undefined,
        date_to: custom?.to ? iso(custom.to) : undefined,
      };
  }
}

export function useDateRangePreset(initial: RangePreset = "7d") {
  const [preset, setPreset] = useState<RangePreset>(initial);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const range = resolvePresetRange(preset, customRange);

  return { preset, setPreset, customRange, setCustomRange, range };
}
