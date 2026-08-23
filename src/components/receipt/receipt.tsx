import { formatCurrency, formatDateTime } from "@/lib/utils";
import { storageUrl } from "@/lib/api/client";
import type { Receipt as ReceiptData } from "@/services/sales.service";
import { cn } from "@/lib/utils";

export type ReceiptSize = "58mm" | "80mm" | "a4";

const WIDTH: Record<ReceiptSize, string> = {
  "58mm": "max-w-[58mm] text-[11px]",
  "80mm": "max-w-[80mm] text-xs",
  a4: "max-w-2xl text-sm",
};

/**
 * Reusable receipt layout — used by the POS success screen, Sales History
 * "view receipt", and print. Renders inside #print-area (see globals.css's
 * @media print rules) so only this shows when the browser prints.
 */
export function Receipt({ data, size = "80mm", currency = "USD" }: { data: ReceiptData; size?: ReceiptSize; currency?: string }) {
  const money = (v: number) => formatCurrency(v, currency);

  return (
    <div id="print-area" className={cn("mx-auto w-full space-y-3 bg-card p-4 font-mono text-foreground", WIDTH[size])}>
      <div className="space-y-1 text-center">
        {data.business.logo && (
          // eslint-disable-next-line @next/next/no-img-element -- receipt print output, not a Next-optimizable asset
          <img src={storageUrl(data.business.logo)} alt="" className="mx-auto mb-1 max-h-12 object-contain" />
        )}
        <p className="text-sm font-bold">{data.business.name}</p>
        {data.branch.name && <p>{data.branch.name}</p>}
        {data.branch.address && <p>{data.branch.address}</p>}
        {(data.business.phone || data.branch.phone) && <p>{data.branch.phone ?? data.business.phone}</p>}
      </div>

      <div className="border-t border-dashed border-border" />

      <div className="space-y-0.5">
        <Row label="Invoice" value={data.invoice_number} />
        <Row label="Date" value={formatDateTime(data.sale_date)} />
        <Row label="Cashier" value={data.cashier.name} />
        {data.customer && <Row label="Customer" value={data.customer.name} />}
      </div>

      <div className="border-t border-dashed border-border" />

      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th className="pb-1 font-normal">Item</th>
            <th className="pb-1 text-right font-normal">Qty</th>
            <th className="pb-1 text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} className="align-top">
              <td className="py-0.5 pr-1">
                {item.product_name}
                <div className="text-[0.9em] opacity-70">{money(item.unit_price)} each</div>
              </td>
              <td className="py-0.5 text-right">{item.quantity}</td>
              <td className="py-0.5 text-right">{money(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-border" />

      <div className="space-y-0.5">
        <Row label="Subtotal" value={money(data.subtotal)} />
        {data.discount > 0 && <Row label="Discount" value={`-${money(data.discount)}`} />}
        {data.tax > 0 && <Row label="Tax" value={money(data.tax)} />}
        <Row label="Total" value={money(data.total)} bold />
      </div>

      <div className="border-t border-dashed border-border" />

      <div className="space-y-0.5">
        {data.payments.map((p, i) => (
          <Row key={i} label={p.method} value={money(p.amount)} />
        ))}
      </div>

      <p className="pt-2 text-center text-[0.9em] opacity-70">Thank you for your business!</p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", bold && "font-bold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
