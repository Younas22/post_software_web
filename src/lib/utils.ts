import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names safely, resolving conflicts (last wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as currency using the business currency (fallback USD). */
export function formatCurrency(
  value: number | string,
  currency: string = "USD",
  locale: string = "en-US"
) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "-";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    }).format(num);
  } catch {
    return num.toFixed(2);
  }
}

/** Format a number with thousands separators. */
export function formatNumber(value: number | string, locale = "en-US") {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * The business's own timezone (from the session config) — every date/time
 * on screen is shown in it rather than the browser's, so a branch and its
 * owner abroad see the same clock. Set by AuthProvider on session load.
 */
let displayTimeZone: string | undefined;

export function setDisplayTimeZone(timeZone: string | null | undefined) {
  if (!timeZone) {
    displayTimeZone = undefined;
    return;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    displayTimeZone = timeZone;
  } catch {
    displayTimeZone = undefined;
  }
}

/** Format a date string/Date into a readable, locale-aware date. */
export function formatDate(value: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  // A bare calendar date ("2026-11-03") is not an instant — JS parses it as
  // UTC midnight, so render it in UTC to keep the same day everywhere.
  const dateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const timeZone = dateOnly ? "UTC" : displayTimeZone;
  return new Intl.DateTimeFormat("en-US", { ...(opts ?? { year: "numeric", month: "short", day: "numeric" }), timeZone }).format(date);
}

/** Format a date/time string into a readable date + time. */
export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Debounce a value change - used with useState/useEffect for search inputs. */
export function debounce<T extends (...args: never[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Get initials from a name for avatar fallbacks. */
export function getInitials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}
