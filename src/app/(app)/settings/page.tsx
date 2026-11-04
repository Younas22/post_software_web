"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useBusiness, useBusinessMutations, useLocaleOptions } from "@/hooks/use-business";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useToast } from "@/components/ui/toast";
import { ApiClientError, storageUrl } from "@/lib/api/client";
import { BrandAssetPicker, type AssetValue } from "@/components/settings/brand-asset-picker";

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("settings.update") || hasPermission("businesses.update");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your business profile and preferences.</p>
      </div>

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="receipt">Receipt &amp; Tax</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="business">
          <BusinessTab readOnly={!canManage} />
        </TabsContent>
        <TabsContent value="receipt">
          <ReceiptTaxTab readOnly={!canManage} />
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">Choose how POS looks on this device.</p>
              </div>
              <ThemeToggle />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BusinessTab({ readOnly }: { readOnly: boolean }) {
  const { data: business, isLoading } = useBusiness();
  const { data: locale } = useLocaleOptions();
  const { update } = useBusinessMutations();
  const { refresh } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", currency: "", timezone: "" });
  const emptyAsset: AssetValue = { file: null, remove: false };
  const [logo, setLogo] = useState<AssetValue>(emptyAsset);
  const [favicon, setFavicon] = useState<AssetValue>(emptyAsset);
  const [error, setError] = useState<string | null>(null);

  // Seeds the local form once the business record loads (arrives async, not
  // known at first render).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (business) {
      setForm({
        name: business.name ?? "",
        phone: business.phone ?? "",
        email: business.email ?? "",
        address: business.address ?? "",
        currency: business.currency ?? "USD",
        timezone: business.timezone ?? "UTC",
      });
    }
  }, [business]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isLoading) return <LoadingState label="Loading business…" />;

  const submit = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        ...form,
        logo: logo.file,
        favicon: favicon.file,
        remove_logo: logo.remove || undefined,
        remove_favicon: favicon.remove || undefined,
      });
      setLogo(emptyAsset);
      setFavicon(emptyAsset);
      // Currency, timezone, name and logo live in the session config that
      // the whole app (sidebar brand, money/date formatting) reads from.
      await refresh();
      toast({ title: "Business updated", variant: "success" });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong.");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {error && <Alert variant="error">{error}</Alert>}
        <div>
          <p className="text-sm font-semibold text-foreground">Branding</p>
          <p className="text-xs text-muted-foreground">Your logo and browser-tab icon appear across the whole system for everyone in your business.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <BrandAssetPicker
              kind="logo"
              savedUrl={business?.logo_url ?? storageUrl(business?.logo) ?? null}
              value={logo}
              onChange={setLogo}
              businessName={form.name}
              disabled={readOnly}
            />
            <BrandAssetPicker
              kind="favicon"
              savedUrl={business?.favicon_url ?? null}
              value={favicon}
              onChange={setFavicon}
              businessName={form.name}
              fallbackUrl={logo.remove ? null : (business?.logo_url ?? null)}
              disabled={readOnly}
            />
          </div>
        </div>
        <p className="border-t border-border pt-4 text-sm font-semibold text-foreground">Business details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" required className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={readOnly} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={readOnly} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={readOnly} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={readOnly} />
          </Field>
          <Field label="Currency" required hint="Used for prices, totals and receipts">
            <Select value={form.currency} onValueChange={(currency) => setForm({ ...form, currency })} disabled={readOnly || !locale}>
              <SelectTrigger aria-label="Currency">
                <SelectValue placeholder={locale ? "Select currency" : "Loading…"} />
              </SelectTrigger>
              <SelectContent>
                {(locale?.currencies ?? []).map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Timezone" required hint="Dates & times are shown in this timezone">
            <Select value={form.timezone} onValueChange={(timezone) => setForm({ ...form, timezone })} disabled={readOnly || !locale}>
              <SelectTrigger aria-label="Timezone">
                <SelectValue placeholder={locale ? "Select timezone" : "Loading…"} />
              </SelectTrigger>
              <SelectContent>
                {(locale?.timezones ?? []).map((tz) => (
                  <SelectItem key={tz.id} value={tz.id}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {!readOnly && (
          <div className="flex justify-end border-t border-border pt-4">
            <Button onClick={submit} loading={update.isPending}>
              Save changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReceiptTaxTab({ readOnly }: { readOnly: boolean }) {
  const { data: business } = useBusiness();
  const { updateSettings } = useBusinessMutations();
  const { toast } = useToast();
  const [taxRate, setTaxRate] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await updateSettings.mutateAsync({
        tax_rate: taxRate ? Number(taxRate) : null,
        invoice_prefix: invoicePrefix || null,
        receipt_footer: receiptFooter || null,
      });
      toast({ title: "Settings saved", variant: "success" });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong.");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default tax rate (%)" hint="Applied when a product has no tax rate of its own">
            <Input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} disabled={readOnly} />
          </Field>
          <Field label="Invoice prefix">
            <Input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} disabled={readOnly} />
          </Field>
          <Field label="Receipt footer" className="sm:col-span-2" hint={`Shown at the bottom of every receipt for ${business?.name ?? "your business"}`}>
            <Input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} disabled={readOnly} />
          </Field>
        </div>
        {!readOnly && (
          <div className="flex justify-end border-t border-border pt-4">
            <Button onClick={submit} loading={updateSettings.isPending}>
              Save changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
