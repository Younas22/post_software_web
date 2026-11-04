"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck, CalendarClock, HandCoins, Phone, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useInstallmentSummary } from "@/hooks/use-installments";
import { useTerms } from "@/hooks/use-branding";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { InstallmentsGate, InstallmentStatusBadge, relativeDue } from "@/components/installments/installment-ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { InstallmentDueRow } from "@/types";

/**
 * The daily collection desk for an installment business: who is late, who
 * is due this week, with one tap to call them or collect.
 */
export default function CollectionsPage() {
  return (
    <InstallmentsGate>
      <CollectionsDesk />
    </InstallmentsGate>
  );
}

function CollectionsDesk() {
  const { config, hasPermission } = useAuth();
  const terms = useTerms();
  const { branchId } = useActiveBranch();
  const summary = useInstallmentSummary(branchId);
  const s = summary.data;
  const currency = config?.business?.currency ?? "USD";
  const money = (v: number | string) => formatCurrency(v, currency);
  const canCollect = hasPermission("installments.collect");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Collections</h1>
        <p className="mt-1 text-sm text-muted-foreground">Today&apos;s follow-ups — overdue accounts first, then what falls due this week.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Overdue" value={money(s?.overdue_amount ?? 0)} icon={AlertTriangle} tone={s && Number(s.overdue_amount) > 0 ? "error" : "default"} isLoading={summary.isLoading} hint={s ? `${s.overdue_plans} ${terms.customers.toLowerCase()} late` : undefined} />
        <StatCard label="Due today" value={money(s?.due_today ?? 0)} icon={CalendarCheck} tone="warning" isLoading={summary.isLoading} />
        <StatCard label="Due in next 7 days" value={money(s?.due_this_week ?? 0)} icon={CalendarClock} tone="brand" isLoading={summary.isLoading} />
        <StatCard label="Collected today" value={money(s?.collected_today ?? 0)} icon={HandCoins} tone="success" isLoading={summary.isLoading} hint={s ? `${money(s.collected_this_month)} this month` : undefined} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DueList
          title="Overdue"
          tone="error"
          rows={s?.overdue ?? []}
          isLoading={summary.isLoading}
          money={money}
          canCollect={canCollect}
          emptyTitle="Nobody is late"
          emptyDescription="Every installment due so far has been paid. 👏"
        />
        <DueList
          title="Due this week"
          tone="brand"
          rows={s?.upcoming ?? []}
          isLoading={summary.isLoading}
          money={money}
          canCollect={canCollect}
          emptyTitle="Nothing due this week"
          emptyDescription="No installments fall due in the next 7 days."
        />
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{money(s?.outstanding ?? 0)} outstanding</p>
            <p className="text-sm text-muted-foreground">Across {s?.active_count ?? 0} active plans</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/installments">View all plans</Link>
        </Button>
      </Card>
    </div>
  );
}

function DueList({
  title,
  tone,
  rows,
  isLoading,
  money,
  canCollect,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  tone: "error" | "brand";
  rows: InstallmentDueRow[];
  isLoading: boolean;
  money: (v: number | string) => string;
  canCollect: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", tone === "error" ? "bg-error" : "bg-brand")} />
          {title}
        </CardTitle>
        {!isLoading && <span className="text-sm text-muted-foreground">{rows.length} shown</span>}
      </CardHeader>
      {isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:flex-nowrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/installments/${row.installment_plan_id}`} className="truncate font-semibold text-foreground hover:text-brand">
                    {row.customer?.name ?? "—"}
                  </Link>
                  <InstallmentStatusBadge status={row.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.plan_number} · Installment #{row.sequence} · {formatDate(row.due_date)} ·{" "}
                  <span className={row.status === "overdue" ? "font-medium text-error" : ""}>{relativeDue(row.due_date)}</span>
                </p>
              </div>
              <p className="text-base font-bold tabular-nums text-foreground">{money(row.remaining)}</p>
              <div className="flex gap-1.5">
                {row.customer?.phone && (
                  <Button variant="outline" size="icon" asChild aria-label={`Call ${row.customer.name}`}>
                    <a href={`tel:${row.customer.phone}`}>
                      <Phone />
                    </a>
                  </Button>
                )}
                {canCollect && (
                  <Button asChild size="md">
                    <Link href={`/installments/${row.installment_plan_id}?collect=1`}>Collect</Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
