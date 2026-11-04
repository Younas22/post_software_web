"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Ban, CalendarClock, HandCoins, Phone, Printer, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useTerms } from "@/hooks/use-branding";
import { useInstallment, useInstallmentMutations } from "@/hooks/use-installments";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { CollectPaymentModal } from "@/components/installments/collect-payment-modal";
import { FREQUENCY_LABEL, InstallmentsGate, InstallmentStatusBadge, ProgressBar, relativeDue } from "@/components/installments/installment-ui";
import { ApiClientError } from "@/lib/api/client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { InstallmentPlan } from "@/types";

export default function InstallmentPlanPage() {
  return (
    <InstallmentsGate>
      <PlanDetail />
    </InstallmentsGate>
  );
}

function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const planId = Number(id);
  const { config, hasPermission } = useAuth();
  const terms = useTerms();
  const { toast } = useToast();
  const { confirm, dialog } = useConfirm();
  const { cancel } = useInstallmentMutations();
  const plan = useInstallment(Number.isFinite(planId) ? planId : undefined);
  const [collectOpen, setCollectOpen] = useState(false);
  const currency = config?.business?.currency ?? "USD";
  const money = (v: number | string) => formatCurrency(v, currency);

  // /installments/12?collect=1 (from the Collections desk) opens the modal straight away.
  const wantsCollect = searchParams.get("collect") === "1";
  useEffect(() => {
    if (wantsCollect && plan.data?.status === "active") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollectOpen(true);
    }
  }, [wantsCollect, plan.data?.status]);

  if (plan.isLoading) return <LoadingState label="Loading plan…" className="py-24" />;
  if (plan.isError || !plan.data) {
    return <EmptyState icon={CalendarClock} title="Plan not found" description="It may have been removed or belongs to another branch." className="py-24" />;
  }

  const p = plan.data;
  const overdue = Number(p.overdue_amount ?? 0);
  const canCollect = p.status === "active" && hasPermission("installments.collect");
  const canCancel = p.status === "active" && hasPermission("installments.cancel");

  const handleCancel = async () => {
    const ok = await confirm({
      title: `Cancel plan ${p.plan_number}?`,
      description: "The goods go back into stock. Payments already received stay on record.",
      confirmLabel: "Cancel plan",
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync(p.id);
      toast({ title: "Plan cancelled", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't cancel plan", description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {dialog}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: "Installment Plans", href: "/installments" }, { label: p.plan_number }]} />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{p.plan_number}</h1>
            <InstallmentStatusBadge status={p.status === "active" && overdue > 0 ? "overdue_plan" : p.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.customer?.name} · {p.installments_count} × {FREQUENCY_LABEL[p.frequency].toLowerCase()} · started {formatDate(p.start_date)}
            {p.branch ? ` · ${p.branch.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Print
          </Button>
          {canCancel && (
            <Button variant="outline" onClick={handleCancel} loading={cancel.isPending} className="text-error hover:text-error">
              <Ban /> Cancel plan
            </Button>
          )}
          {canCollect && (
            <Button onClick={() => setCollectOpen(true)} size="lg">
              <HandCoins /> Collect payment
            </Button>
          )}
        </div>
      </div>

      {overdue > 0 && p.status === "active" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error-soft px-4 py-3">
          <p className="text-sm font-medium text-error">{money(overdue)} is overdue on this plan.</p>
          {canCollect && (
            <Button size="sm" variant="danger" onClick={() => setCollectOpen(true)}>
              Collect now
            </Button>
          )}
        </div>
      )}

      {/* Money summary */}
      <Card className="p-5 sm:p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Installment price" value={money(p.total_amount)} hint={`${money(p.subtotal)} cash + ${Number(p.markup_percent)}% markup`} />
          <Metric label="Paid so far" value={money(p.paid_amount)} hint={`incl. ${money(p.down_payment)} down payment`} tone="success" />
          <Metric label="Balance" value={money(p.balance)} hint={`${p.paid_installments ?? 0} of ${p.installments_count} installments paid`} tone={overdue > 0 ? "error" : undefined} />
          <Metric
            label="Next due"
            value={p.status === "active" && p.next_due_date ? formatDate(p.next_due_date) : "—"}
            hint={p.status === "active" && p.next_due_date ? `${relativeDue(p.next_due_date)} · ${money(p.installment_amount)}` : p.status === "completed" ? "Fully paid 🎉" : undefined}
          />
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
            <span>Progress</span>
            <span className="text-foreground">{p.progress}%</span>
          </div>
          <ProgressBar value={p.progress} className="h-2.5" tone={p.status === "completed" ? "success" : overdue > 0 ? "error" : "brand"} />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Installment schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.schedules?.map((s) => (
                      <TableRow key={s.id} className={cn(s.status === "overdue" && p.status === "active" && "bg-error-soft/40")}>
                        <TableCell className="font-medium text-muted-foreground">{s.sequence}</TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground">{formatDate(s.due_date)}</p>
                          {s.status !== "paid" && p.status === "active" && <p className={cn("text-xs", s.status === "overdue" ? "text-error" : "text-muted-foreground")}>{relativeDue(s.due_date)}</p>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{money(s.amount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{Number(s.paid_amount) > 0 ? money(s.paid_amount) : "—"}</TableCell>
                        <TableCell>{p.status === "cancelled" && s.status !== "paid" ? <InstallmentStatusBadge status="cancelled" /> : <InstallmentStatusBadge status={s.status} />}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments received</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(p.payments?.length ?? 0) === 0 ? (
                <EmptyState icon={HandCoins} title="No payments yet" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Receipt</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Received by</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {p.payments?.map((pay) => (
                        <TableRow key={pay.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{pay.receipt_number}</p>
                            {(pay.is_down_payment || pay.reference) && (
                              <p className="text-xs text-muted-foreground">{pay.is_down_payment ? "Down payment" : `Ref ${pay.reference}`}</p>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(pay.payment_date)}</TableCell>
                          <TableCell className="text-muted-foreground">{pay.payment_method?.name ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{pay.user?.name ?? "—"}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-success">{money(pay.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <InfoCard icon={User} title={terms.customer}>
            <p className="font-semibold text-foreground">{p.customer?.name}</p>
            {p.customer?.phone && (
              <a href={`tel:${p.customer.phone}`} className="mt-1 flex items-center gap-1.5 text-brand hover:underline">
                <Phone className="size-3.5" /> {p.customer.phone}
              </a>
            )}
            {p.customer?.address && <p className="mt-1 text-muted-foreground">{p.customer.address}</p>}
            {p.customer_cnic && <p className="mt-1 text-muted-foreground">CNIC: {p.customer_cnic}</p>}
          </InfoCard>

          <InfoCard icon={ShieldCheck} title="Guarantor">
            {p.guarantor_name ? (
              <>
                <p className="font-semibold text-foreground">{p.guarantor_name}</p>
                {p.guarantor_phone && (
                  <a href={`tel:${p.guarantor_phone}`} className="mt-1 flex items-center gap-1.5 text-brand hover:underline">
                    <Phone className="size-3.5" /> {p.guarantor_phone}
                  </a>
                )}
                {p.guarantor_cnic && <p className="mt-1 text-muted-foreground">CNIC: {p.guarantor_cnic}</p>}
                {p.guarantor_address && <p className="mt-1 text-muted-foreground">{p.guarantor_address}</p>}
              </>
            ) : (
              <p className="text-muted-foreground">No guarantor recorded.</p>
            )}
          </InfoCard>

          <InfoCard icon={CalendarClock} title={terms.products}>
            <ul className="divide-y divide-border">
              {p.items?.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.product?.name ?? `#${item.product_id}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {money(item.unit_price)}
                      {item.serial_number ? ` · S/N ${item.serial_number}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">{money(item.line_total)}</span>
                </li>
              ))}
            </ul>
          </InfoCard>

          {p.notes && (
            <InfoCard icon={CalendarClock} title="Notes">
              <p className="whitespace-pre-line text-muted-foreground">{p.notes}</p>
            </InfoCard>
          )}
        </div>
      </div>

      {canCollect && <CollectPaymentModal plan={p} open={collectOpen} onOpenChange={setCollectOpen} currency={currency} />}

      <PrintableStatement plan={p} money={money} businessName={config?.business?.name ?? ""} customerLabel={terms.customer} />
    </div>
  );
}

function Metric({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "success" | "error" }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tracking-tight", tone === "success" ? "text-success" : tone === "error" ? "text-error" : "text-foreground")}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-4" /> {title}
      </p>
      <div className="text-sm">{children}</div>
    </Card>
  );
}

/** Hidden on screen; window.print() prints just this account statement. */
function PrintableStatement({
  plan: p,
  money,
  businessName,
  customerLabel,
}: {
  plan: InstallmentPlan;
  money: (v: number | string) => string;
  businessName: string;
  customerLabel: string;
}) {
  return (
    <div className="print-only" aria-hidden>
      <div id="print-area" style={{ padding: 32, fontFamily: "Arial, sans-serif", fontSize: 12, color: "#000" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{businessName}</h1>
        <p style={{ margin: "4px 0 16px" }}>Installment account statement — {p.plan_number}</p>
        <table style={{ width: "100%", marginBottom: 16 }}>
          <tbody>
            <tr>
              <td>
                <b>{customerLabel}:</b> {p.customer?.name} {p.customer?.phone ? `(${p.customer.phone})` : ""}
                {p.customer_cnic ? ` · CNIC ${p.customer_cnic}` : ""}
              </td>
              <td style={{ textAlign: "right" }}>
                <b>Date:</b> {formatDate(new Date())}
              </td>
            </tr>
            {p.guarantor_name && (
              <tr>
                <td colSpan={2}>
                  <b>Guarantor:</b> {p.guarantor_name} {p.guarantor_phone ? `(${p.guarantor_phone})` : ""}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={2}>
                <b>Items:</b> {p.items?.map((i) => `${i.product?.name ?? ""} × ${i.quantity}${i.serial_number ? ` [${i.serial_number}]` : ""}`).join(", ")}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <b>Total:</b> {money(p.total_amount)} · <b>Down payment:</b> {money(p.down_payment)} · <b>Paid:</b> {money(p.paid_amount)} · <b>Balance:</b> {money(p.balance)}
              </td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["#", "Due date", "Amount", "Paid", "Status"].map((h) => (
                <th key={h} style={{ border: "1px solid #000", padding: 4, textAlign: "left" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.schedules?.map((s) => (
              <tr key={s.id}>
                <td style={{ border: "1px solid #000", padding: 4 }}>{s.sequence}</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{formatDate(s.due_date)}</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{money(s.amount)}</td>
                <td style={{ border: "1px solid #000", padding: 4 }}>{money(s.paid_amount)}</td>
                <td style={{ border: "1px solid #000", padding: 4, textTransform: "capitalize" }}>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 40 }}>Signature: ____________________</p>
      </div>
    </div>
  );
}
