"use client";

import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";
import { installmentsService } from "@/services/installments.service";
import { renderInstallmentReceiptHtml } from "@/lib/installment-receipt-template";
import { ApiClientError } from "@/lib/api/client";

/** Self-hosted Urdu Nastaliq font (public/fonts) — no CDN, so receipts print the same offline / on a LAN install. */
function receiptFonts() {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return {
    urduRegular: `${origin}/fonts/noto-nastaliq-urdu-400.woff2`,
    urduBold: `${origin}/fonts/noto-nastaliq-urdu-700.woff2`,
  };
}

/**
 * Print preview of an installment RECOVERY receipt (one payment) — the
 * shared receipt template rendered in an isolated iframe, printed with the
 * browser's own print dialog (which also offers "Save as PDF").
 */
export function ReceiptPreviewModal({
  planId,
  paymentId,
  open,
  onOpenChange,
  autoPrint = false,
}: {
  planId: number;
  paymentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoPrint?: boolean;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open || !paymentId) return;
    let cancelled = false;
    // Reset for a new receipt; the fetch below fills it in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHtml(null);
    setError(null);
    setReady(false);
    installmentsService
      .receipt(planId, paymentId)
      .then((data) => {
        if (!cancelled) setHtml(renderInstallmentReceiptHtml(data, receiptFonts()));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiClientError ? err.message : "Couldn't load the receipt.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, planId, paymentId]);

  const print = async () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    // The Urdu font must be loaded before printing, or the first print shows a fallback face.
    await win.document.fonts?.ready;
    win.focus();
    win.print();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="full" className="max-w-[min(860px,calc(100vw-2rem))]">
        <ModalHeader>
          <ModalTitle>Installment receipt</ModalTitle>
          <ModalDescription>Print, reprint or save as PDF from the print dialog.</ModalDescription>
        </ModalHeader>

        {error ? (
          <Alert variant="error">{error}</Alert>
        ) : !html ? (
          <LoadingState label="Preparing receipt…" />
        ) : (
          <iframe
            ref={frameRef}
            title="Receipt preview"
            srcDoc={html}
            className="h-[60vh] w-full rounded-lg border border-border bg-[#e9e9e9]"
            onLoad={async () => {
              await frameRef.current?.contentWindow?.document.fonts?.ready;
              setReady(true);
              if (autoPrint) void print();
            }}
          />
        )}

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => void print()} disabled={!ready}>
            <Printer /> Print
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
