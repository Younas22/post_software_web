"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useInstallmentSummary } from "@/hooks/use-installments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { relativeDue } from "./installment-ui";

/** Dashboard block for installment businesses: collection health at a glance + who to chase first. */
export function InstallmentsDashboardCard({ branchId, currency }: { branchId: number | null; currency: string }) {
  const summary = useInstallmentSummary(branchId);
  const s = summary.data;
  const money = (v: number | string) => formatCurrency(v, currency);

  const metrics = [
    { label: "Outstanding", value: s?.outstanding ?? 0, tone: "" },
    { label: "Overdue", value: s?.overdue_amount ?? 0, tone: s && Number(s.overdue_amount) > 0 ? "text-error" : "" },
    { label: "Due today", value: s?.due_today ?? 0, tone: s && Number(s.due_today) > 0 ? "text-warning" : "" },
    { label: "Collected today", value: s?.collected_today ?? 0, tone: "text-success" },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Installment collections</CardTitle>
        <Link href="/collections" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
          Collection desk <ArrowRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
              {summary.isLoading ? <Skeleton className="mt-2 h-6 w-24" /> : <p className={cn("mt-1 text-lg font-bold tabular-nums text-foreground", m.tone)}>{money(m.value)}</p>}
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chase first</p>
          {summary.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : (s?.overdue.length ?? 0) + (s?.upcoming.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nothing overdue or due this week.</p>
          ) : (
            <ul className="space-y-1.5">
              {[...(s?.overdue ?? []), ...(s?.upcoming ?? [])].slice(0, 5).map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/installments/${row.installment_plan_id}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{row.customer?.name ?? row.plan_number}</p>
                      <p className={cn("text-xs", row.status === "overdue" ? "font-medium text-error" : "text-muted-foreground")}>
                        {row.plan_number} · {relativeDue(row.due_date)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums">{money(row.remaining)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
