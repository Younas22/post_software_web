"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Package, ShieldCheck, Trash2, User, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useActiveBranch } from "@/hooks/use-active-branch";
import { useTerms } from "@/hooks/use-branding";
import { useInstallmentMutations } from "@/hooks/use-installments";
import { useCustomerMutations } from "@/hooks/use-customers";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { IconButton } from "@/components/ui/icon-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { CustomerCombobox } from "@/components/shared/customer-combobox";
import { ProductCombobox } from "@/components/shared/product-combobox";
import { FREQUENCY_LABEL, InstallmentsGate } from "@/components/installments/installment-ui";
import { CustomerPhotoCapture } from "@/components/installments/customer-photo-capture";
import { customersService } from "@/services/customers.service";
import { employeesService } from "@/services/employees.service";
import { ApiClientError } from "@/lib/api/client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Customer, InstallmentFrequency, Product } from "@/types";

interface Line {
  product: Product;
  quantity: number;
  unitPrice: string;
  serial: string;
}

const COUNT_PRESETS = [3, 6, 9, 12, 18, 24];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseIso(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Mirrors InstallmentService::dueDate() (month steps never overflow into the next month). */
function addPeriod(start: string, frequency: InstallmentFrequency, steps: number): string {
  const base = parseIso(start);
  if (frequency === "weekly" || frequency === "biweekly") {
    base.setDate(base.getDate() + steps * (frequency === "weekly" ? 7 : 14));
    return isoDate(base);
  }
  const day = base.getDate();
  const target = new Date(base.getFullYear(), base.getMonth() + steps, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return isoDate(target);
}

export default function NewInstallmentPlanPage() {
  return (
    <InstallmentsGate>
      <NewPlanForm />
    </InstallmentsGate>
  );
}

function NewPlanForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { config } = useAuth();
  const terms = useTerms();
  const { branch, branchId } = useActiveBranch();
  const { create } = useInstallmentMutations();
  const customerMutations = useCustomerMutations();
  const methods = usePaymentMethods();
  const currency = config?.business?.currency ?? "USD";
  const money = (v: number) => formatCurrency(v, currency);

  const todayIso = isoDate(new Date());
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerCnic, setCustomerCnic] = useState("");
  const [guardianRelation, setGuardianRelation] = useState<"S/O" | "D/O" | "W/O">("S/O");
  const [guardianName, setGuardianName] = useState("");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [savedPhotoUrl, setSavedPhotoUrl] = useState<string | null>(null);
  const [officerId, setOfficerId] = useState<string>("");
  const { user, hasPermission } = useAuth();
  const staff = useQuery({
    queryKey: ["employees", "recovery-officers"],
    queryFn: () => employeesService.list({ per_page: 100, status: "active" }),
    enabled: hasPermission("users.view"),
    staleTime: 5 * 60_000,
  });

  // Picking a customer brings in what's on file: guardian + their saved photo.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuardianRelation(customer?.guardian_relation ?? "S/O");
    setGuardianName(customer?.guardian_name ?? "");
    setPhoto(null);
    setSavedPhotoUrl(null);
    if (!customer?.has_photo) return;
    let url: string | null = null;
    let cancelled = false;
    void customersService.photoObjectUrl(customer.id).then((u) => {
      url = u;
      if (!cancelled) setSavedPhotoUrl(u);
      else if (u) URL.revokeObjectURL(u);
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [customer]);
  const [lines, setLines] = useState<Line[]>([]);
  const [markup, setMarkup] = useState("0");
  const [downPayment, setDownPayment] = useState("0");
  const [methodId, setMethodId] = useState("");
  const [count, setCount] = useState(12);
  const [frequency, setFrequency] = useState<InstallmentFrequency>("monthly");
  const [startDate, setStartDate] = useState(todayIso);
  const [firstDue, setFirstDue] = useState(addPeriod(todayIso, "monthly", 1));
  const [firstDueTouched, setFirstDueTouched] = useState(false);
  const [guarantor, setGuarantor] = useState({ name: "", phone: "", cnic: "", address: "" });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateStart = (value: string, freq = frequency) => {
    setStartDate(value);
    if (!firstDueTouched && value) setFirstDue(addPeriod(value, freq, 1));
  };

  const updateFrequency = (value: InstallmentFrequency) => {
    setFrequency(value);
    if (!firstDueTouched && startDate) setFirstDue(addPeriod(startDate, value, 1));
  };

  const addProduct = (product: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { product, quantity: 1, unitPrice: String(Number(product.sale_price)), serial: "" }];
    });
  };

  const calc = useMemo(() => {
    const subtotal = Math.round(lines.reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * l.quantity, 0) * 100) / 100;
    const markupAmount = Math.round(subtotal * (Number(markup) || 0)) / 100;
    const total = Math.round((subtotal + markupAmount) * 100) / 100;
    const down = Number(downPayment) || 0;
    const financed = Math.max(0, Math.round((total - down) * 100) / 100);
    const n = Math.max(1, count || 1);
    const installment = Math.floor((financed / n) * 100) / 100;
    const last = Math.round((financed - installment * (n - 1)) * 100) / 100;
    const schedule = Array.from({ length: n }, (_, i) => ({
      sequence: i + 1,
      due: firstDue ? addPeriod(firstDue, frequency, i) : "",
      amount: i === n - 1 ? last : installment,
    }));
    return { subtotal, markupAmount, total, down, financed, installment, last, schedule };
  }, [lines, markup, downPayment, count, firstDue, frequency]);

  const submit = async () => {
    setError(null);
    setFieldErrors({});
    if (!branchId) return setError("Select a branch first (top bar).");
    if (!customer) return setError(`Choose the ${terms.customer.toLowerCase()} buying on installments.`);
    if (lines.length === 0) return setError(`Add at least one ${terms.product.toLowerCase()}.`);
    if (calc.down > calc.total) return setError("The down payment can't be more than the total price.");

    try {
      // Guardian (S/O ...) and photo belong to the customer record — the
      // same customer, not a copy — so every later receipt shows them.
      if ((customer.guardian_name ?? "") !== guardianName.trim() || (customer.guardian_relation ?? "S/O") !== guardianRelation) {
        await customersService.update(customer.id, {
          name: customer.name,
          status: customer.status,
          guardian_relation: guardianName.trim() ? guardianRelation : null,
          guardian_name: guardianName.trim() || null,
        });
      }
      if (photo) await customersService.uploadPhoto(customer.id, photo, "customer.jpg");

      const plan = await create.mutateAsync({
        branch_id: branchId,
        customer_id: customer.id,
        items: lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity, unit_price: Number(l.unitPrice) || 0, serial_number: l.serial || null })),
        markup_percent: Number(markup) || 0,
        down_payment: calc.down,
        payment_method_id: calc.down > 0 && methodId ? Number(methodId) : null,
        installments_count: count,
        frequency,
        start_date: startDate,
        first_due_date: firstDue,
        customer_cnic: customerCnic || null,
        recovery_officer_id: officerId ? Number(officerId) : null,
        guarantor_name: guarantor.name || null,
        guarantor_phone: guarantor.phone || null,
        guarantor_cnic: guarantor.cnic || null,
        guarantor_address: guarantor.address || null,
        notes: notes || null,
      });
      toast({ title: `Plan ${plan.plan_number} created`, variant: "success" });
      router.push(`/installments/${plan.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        const flat: Record<string, string> = {};
        Object.entries(err.errors).forEach(([k, v]) => (flat[k] = v[0]));
        setFieldErrors(flat);
        setError(Object.values(flat)[0] ?? err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Installment Plans", href: "/installments" }, { label: "New Plan" }]} />
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">New Installment Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hand over the goods today and split the price into easy {FREQUENCY_LABEL[frequency].toLowerCase()} payments
          {branch ? ` · ${branch.name}` : ""}.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          {/* Customer */}
          <Section icon={User} title={terms.customer} step={1}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={terms.customer} required error={fieldErrors.customer_id} className="sm:col-span-2">
                <CustomerCombobox
                  value={customer}
                  onSelect={setCustomer}
                  placeholder={`Search or add a ${terms.customer.toLowerCase()}…`}
                  onCreateNew={async (name) => {
                    try {
                      const created = await customerMutations.create.mutateAsync({ name, status: "active" });
                      setCustomer(created);
                      toast({ title: `${terms.customer} "${name}" added`, variant: "success" });
                    } catch (err) {
                      toast({ title: `Couldn't add ${terms.customer.toLowerCase()}`, description: err instanceof ApiClientError ? err.message : undefined, variant: "error" });
                    }
                  }}
                />
              </Field>
              {customer && (
                <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm sm:col-span-2">
                  <p className="font-semibold text-foreground">{customer.name}</p>
                  <p className="text-muted-foreground">{[customer.phone, customer.address].filter(Boolean).join(" · ") || "No phone / address on file"}</p>
                </div>
              )}
              <Field label="Relation" hint="Printed on the receipt as S/O, D/O or W/O">
                <Select value={guardianRelation} onValueChange={(v) => setGuardianRelation(v as "S/O" | "D/O" | "W/O")} disabled={!customer}>
                  <SelectTrigger aria-label="Relation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S/O">S/O — Son of</SelectItem>
                    <SelectItem value="D/O">D/O — Daughter of</SelectItem>
                    <SelectItem value="W/O">W/O — Wife of</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Father / Husband name">
                <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} maxLength={255} disabled={!customer} />
              </Field>
              <Field label="CNIC / ID number" hint="Optional — printed on the plan" error={fieldErrors.customer_cnic}>
                <Input value={customerCnic} onChange={(e) => setCustomerCnic(e.target.value)} placeholder="35202-1234567-1" maxLength={30} />
              </Field>
              <Field label="Recovery officer" hint="Collects this account's installments">
                <Select value={officerId || String(user?.id ?? "")} onValueChange={setOfficerId}>
                  <SelectTrigger aria-label="Recovery officer">
                    <SelectValue placeholder="Select officer" />
                  </SelectTrigger>
                  <SelectContent>
                    {user && <SelectItem value={String(user.id)}>{user.name} (me)</SelectItem>}
                    {(staff.data?.data ?? [])
                      .filter((e) => e.id !== user?.id)
                      .map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
              {customer && (
                <div className="sm:col-span-2">
                  <CustomerPhotoCapture savedUrl={savedPhotoUrl} value={photo} onChange={setPhoto} />
                </div>
              )}
            </div>
          </Section>

          {/* Products */}
          <Section icon={Package} title={terms.products} step={2}>
            <ProductCombobox onSelect={addProduct} currency={currency} placeholder={`Search ${terms.products.toLowerCase()} by name, SKU or barcode…`} />
            {lines.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No {terms.products.toLowerCase()} added yet.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-border rounded-xl border border-border">
                {lines.map((line, idx) => (
                  <div key={line.product.id} className="grid grid-cols-2 items-end gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_90px_130px_150px_auto]">
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <p className="truncate font-medium text-foreground">{line.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.product.sku}
                        {line.product.stock != null && line.product.type !== "service" ? ` · ${line.product.stock} in stock` : ""}
                      </p>
                    </div>
                    <Field label="Qty">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, quantity: Math.max(1, Number(e.target.value) || 1) } : l)))}
                      />
                    </Field>
                    <Field label="Cash price">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, unitPrice: e.target.value } : l)))}
                      />
                    </Field>
                    <Field label="Serial / IMEI">
                      <Input value={line.serial} maxLength={100} onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, serial: e.target.value } : l)))} />
                    </Field>
                    <IconButton aria-label={`Remove ${line.product.name}`} variant="ghost" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}>
                      <Trash2 />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Terms */}
          <Section icon={CalendarClock} title="Payment terms" step={3}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Markup %" hint="Profit added for selling on installments" error={fieldErrors.markup_percent}>
                <Input type="number" min={0} max={500} step="0.5" value={markup} onChange={(e) => setMarkup(e.target.value)} />
              </Field>
              <Field label="Down payment" hint="Received today" error={fieldErrors.down_payment}>
                <Input type="number" min={0} step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
              </Field>
              <Field label="Down payment via">
                <Select value={methodId} onValueChange={setMethodId} disabled={calc.down <= 0}>
                  <SelectTrigger aria-label="Down payment method">
                    <SelectValue placeholder="Cash" />
                  </SelectTrigger>
                  <SelectContent>
                    {(methods.data ?? []).map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Number of installments" required className="sm:col-span-2 lg:col-span-3" error={fieldErrors.installments_count}>
                <div className="flex flex-wrap items-center gap-2">
                  {COUNT_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={cn(
                        "h-10 min-w-12 rounded-xl border px-3 text-sm font-semibold transition-colors",
                        count === n ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card text-foreground hover:bg-muted"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={count}
                    onChange={(e) => setCount(Math.min(120, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-24"
                    aria-label="Custom number of installments"
                  />
                </div>
              </Field>

              <Field label="Frequency" required>
                <Select value={frequency} onValueChange={(v) => updateFrequency(v as InstallmentFrequency)}>
                  <SelectTrigger aria-label="Frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FREQUENCY_LABEL) as InstallmentFrequency[]).map((f) => (
                      <SelectItem key={f} value={f}>
                        {FREQUENCY_LABEL[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sale date" required error={fieldErrors.start_date}>
                <Input type="date" value={startDate} onChange={(e) => updateStart(e.target.value)} />
              </Field>
              <Field label="First installment due" required error={fieldErrors.first_due_date}>
                <Input
                  type="date"
                  value={firstDue}
                  min={startDate}
                  onChange={(e) => {
                    setFirstDue(e.target.value);
                    setFirstDueTouched(true);
                  }}
                />
              </Field>
            </div>
          </Section>

          {/* Guarantor */}
          <Section icon={ShieldCheck} title="Guarantor" step={4} optional>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={guarantor.name} onChange={(e) => setGuarantor({ ...guarantor, name: e.target.value })} maxLength={255} />
              </Field>
              <Field label="Phone">
                <Input value={guarantor.phone} onChange={(e) => setGuarantor({ ...guarantor, phone: e.target.value })} maxLength={30} />
              </Field>
              <Field label="CNIC / ID number">
                <Input value={guarantor.cnic} onChange={(e) => setGuarantor({ ...guarantor, cnic: e.target.value })} maxLength={30} />
              </Field>
              <Field label="Address">
                <Input value={guarantor.address} onChange={(e) => setGuarantor({ ...guarantor, address: e.target.value })} maxLength={255} />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
              </Field>
            </div>
          </Section>
        </div>

        {/* Live summary */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden">
            <div className="bg-brand p-5 text-brand-foreground">
              <p className="text-sm font-medium opacity-85">
                {count} × {FREQUENCY_LABEL[frequency].toLowerCase()} installment{count === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{money(calc.installment)}</p>
              {calc.last !== calc.installment && count > 1 && <p className="mt-1 text-xs opacity-85">Last installment {money(calc.last)}</p>}
            </div>
            <div className="space-y-2.5 p-5 text-sm">
              <Row label="Cash price" value={money(calc.subtotal)} />
              <Row label={`Markup (${Number(markup) || 0}%)`} value={`+ ${money(calc.markupAmount)}`} />
              <Row label="Installment price" value={money(calc.total)} strong />
              <Row label="Down payment" value={`− ${money(calc.down)}`} />
              <div className="border-t border-border pt-2.5">
                <Row label="To be paid in installments" value={money(calc.financed)} strong />
              </div>
            </div>
            <div className="border-t border-border px-5 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schedule preview</p>
              <ol className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-sm">
                {calc.schedule.map((row) => (
                  <li key={row.sequence} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      <span className="inline-block w-6 font-medium text-foreground">{row.sequence}.</span>
                      {row.due ? formatDate(row.due) : "—"}
                    </span>
                    <span className="font-medium text-foreground">{money(row.amount)}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex gap-2 border-t border-border p-5">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/installments">Cancel</Link>
              </Button>
              <Button className="flex-[2]" size="lg" onClick={submit} loading={create.isPending} disabled={lines.length === 0 || !customer}>
                <Wallet /> Create plan
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  step,
  optional,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  step: number;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Icon className="size-4.5" />
        </span>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Step {step}</p>
          <h2 className="text-base font-semibold text-foreground">
            {title} {optional && <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
          </h2>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={cn("tabular-nums", strong ? "font-semibold text-foreground" : "text-foreground")}>{value}</span>
    </div>
  );
}
