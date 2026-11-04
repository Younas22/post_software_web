"use client";

import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useBranding } from "@/hooks/use-branding";
import { cn } from "@/lib/utils";
import type { InstallmentFrequency, InstallmentPlanStatus, InstallmentScheduleStatus } from "@/types";

const STATUS: Record<InstallmentPlanStatus | InstallmentScheduleStatus | "overdue_plan", { variant: BadgeProps["variant"]; label: string }> = {
  active: { variant: "info", label: "Active" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "neutral", label: "Cancelled" },
  paid: { variant: "success", label: "Paid" },
  partial: { variant: "warning", label: "Partial" },
  overdue: { variant: "error", label: "Overdue" },
  overdue_plan: { variant: "error", label: "Overdue" },
  due: { variant: "warning", label: "Due today" },
  upcoming: { variant: "neutral", label: "Upcoming" },
};

export function InstallmentStatusBadge({ status }: { status: keyof typeof STATUS }) {
  const entry = STATUS[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export const FREQUENCY_LABEL: Record<InstallmentFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "error" | "success" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tone === "error" ? "bg-error" : tone === "success" ? "bg-success" : "bg-brand")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Renders children only when the business type has the installments module switched on. */
export function InstallmentsGate({ children }: { children: ReactNode }) {
  const { hasModule } = useBranding();
  if (!hasModule("installments")) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Installments aren't enabled"
        description="This module is available for business types that sell on installments. Ask your administrator to enable it for your business type."
        className="py-24"
      />
    );
  }
  return <>{children}</>;
}

/** Days between today and `date` (negative = in the past). */
export function daysFromToday(date: string): number {
  const today = new Date();
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - utcToday) / 86_400_000);
}

export function relativeDue(date: string): string {
  const days = daysFromToday(date);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `In ${days} days`;
  if (days === -1) return "1 day late";
  return `${Math.abs(days)} days late`;
}
