"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { formatDate } from "@/lib/utils";

/** Persistent strip warning about trial/expiring/expired subscription state — never blocks navigation, Laravel remains the real gate. */
export function SubscriptionBanner() {
  const { data } = useSubscription();

  const sub = data?.subscription;
  if (!sub) return null;

  if (sub.effective_status === "trial" && sub.trial_ends_at) {
    return (
      <Banner tone="warning">
        Your trial ends {formatDate(sub.trial_ends_at)}. <Link href="/subscription" className="underline font-medium">View plans</Link>
      </Banner>
    );
  }

  if (sub.effective_status === "expired") {
    return (
      <Banner tone="error">
        Your subscription has expired. <Link href="/subscription" className="underline font-medium">Renew now</Link>
      </Banner>
    );
  }

  if (sub.effective_status === "suspended") {
    return (
      <Banner tone="error">
        Your account is suspended. Contact your administrator or{" "}
        <Link href="/subscription" className="underline font-medium">view details</Link>.
      </Banner>
    );
  }

  return null;
}

function Banner({ tone, children }: { tone: "warning" | "error"; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-center text-sm font-medium sm:px-6"
      style={{
        background: tone === "warning" ? "var(--warning-soft)" : "var(--error-soft)",
        color: tone === "warning" ? "var(--warning)" : "var(--error)",
      }}
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      <span className="text-foreground">{children}</span>
    </div>
  );
}
