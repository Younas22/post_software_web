"use client";

import { CreditCard, Users, Building2, Smartphone, CheckCircle2 } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SubscriptionPage() {
  const { data, isLoading } = useSubscription();

  if (isLoading) return <LoadingState label="Loading subscription…" />;

  if (!data || !data.subscription || !data.package) {
    return <EmptyState icon={CreditCard} title="No active subscription" description="Contact your administrator to set up a plan." className="py-24" />;
  }

  const { subscription, package: pkg, usage } = data;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Subscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your current plan, usage, and features.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">{pkg.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCurrency(pkg.price, "USD")} / {pkg.billing_cycle}
            </p>
          </div>
          <StatusBadge status={subscription.effective_status} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Status" value={subscription.effective_status} />
          <Info label="Start Date" value={subscription.starts_at ? formatDate(subscription.starts_at) : "—"} />
          <Info label="Expiry" value={subscription.ends_at ? formatDate(subscription.ends_at) : subscription.trial_ends_at ? formatDate(subscription.trial_ends_at) : "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar icon={Users} label="Users" used={usage.users.used} limit={usage.users.limit} />
          <UsageBar icon={Building2} label="Branches" used={usage.branches.used} limit={usage.branches.limit} />
          <UsageBar icon={Smartphone} label="Devices" used={usage.devices.used} limit={usage.devices.limit} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          {pkg.features.length === 0 ? (
            <p className="text-sm text-muted-foreground">No features listed for this plan.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                  <span className="capitalize">{f.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-foreground">{value}</p>
    </div>
  );
}

function UsageBar({ icon: Icon, label, used, limit }: { icon: typeof Users; label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <Icon className="size-4 text-muted-foreground" /> {label}
        </span>
        <span className="font-medium text-foreground">
          {used} / {limit ?? "∞"}
        </span>
      </div>
      {limit !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${pct >= 100 ? "bg-error" : pct >= 80 ? "bg-warning" : "bg-brand"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
