"use client";

import { createPortal } from "react-dom";
import { CheckCircle2, Printer, Plus } from "lucide-react";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Receipt } from "@/components/receipt/receipt";
import { formatCurrency } from "@/lib/utils";
import { useTerms } from "@/hooks/use-branding";
import type { Receipt as ReceiptData } from "@/services/sales.service";

export function SaleSuccess({
  receipt,
  currency,
  onNewSale,
}: {
  receipt: ReceiptData;
  currency: string;
  onNewSale: () => void;
}) {
  const terms = useTerms();
  return (
    <Modal open onOpenChange={(open) => !open && onNewSale()}>
      <ModalContent size="sm" hideClose onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="size-7" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{terms.sale} completed</p>
            <p className="text-sm text-muted-foreground">{receipt.invoice_number}</p>
          </div>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(receipt.total, currency)}</p>

          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                window.print();
              }}
            >
              <Printer /> Print Receipt
            </Button>
            <Button className="flex-1" onClick={onNewSale}>
              <Plus /> New {terms.sale}
            </Button>
          </div>
        </div>
      </ModalContent>

      {/*
       * Portaled directly to document.body — NOT rendered inside
       * ModalContent's subtree. ModalContent (Radix Dialog) is
       * `position:fixed` with a CSS transform and `overflow-y-auto`,
       * which clips/repositions descendants independently of the
       * .print-only/#print-area visibility trick (see globals.css) — a
       * transform on an ancestor also redirects where any nested
       * position:fixed element resolves itself. Portaling out from under
       * that ancestor is what actually makes the print pick up the
       * receipt content instead of a blank/mispositioned page.
       */}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="print-only">
            <Receipt data={receipt} currency={currency} />
          </div>,
          document.body
        )}
    </Modal>
  );
}
