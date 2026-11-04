import { useQuery } from "@tanstack/react-query";
import { brandingService } from "@/services/branding.service";

/** The POS company's public profile & support contacts — rarely changes, cached for 10 min. */
export function usePlatformInfo() {
  return useQuery({
    queryKey: ["public-platform"],
    queryFn: () => brandingService.platform(),
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

/** A dialable tel: href — keeps the leading "+" and digits only. */
export function telHref(value: string) {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

/**
 * International digits for wa.me links. A local Pakistani number
 * ("0300 1234567") becomes "923001234567"; "+92…" / "0092…" are kept.
 */
export function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  return digits;
}
