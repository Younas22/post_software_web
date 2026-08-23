"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const VARIANT_CLASS: Record<ToastVariant, string> = {
  default: "border-border bg-card text-card-foreground [&_svg]:text-muted-foreground",
  success: "border-success/20 bg-success-soft text-foreground [&_svg]:text-success",
  error: "border-error/20 bg-error-soft text-foreground [&_svg]:text-error",
  warning: "border-warning/20 bg-warning-soft text-foreground [&_svg]:text-warning",
  info: "border-info/20 bg-info-soft text-foreground [&_svg]:text-info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, variant: "default", duration: 5000, ...options }]);
      const duration = options.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function Toaster({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);
  // createPortal needs document.body, unavailable during SSR — this flips
  // true on the client only, after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (typeof document === "undefined" || !mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const Icon = VARIANT_ICON[t.variant ?? "default"];
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg toast-enter",
              VARIANT_CLASS[t.variant ?? "default"]
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{t.title}</p>
              {t.description && (
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
