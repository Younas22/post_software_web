import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { resolveTerms, resolveTheme } from "@/lib/branding";
import type { HideableModule, OptionalModule } from "@/types";

/**
 * The signed-in business's trade branding (from GET /config → business_type):
 * theme, terminology ("Patients" vs "Customers") and module switches.
 */
export function useBranding() {
  const { config } = useAuth();
  const branding = config?.business_type ?? null;

  return useMemo(() => {
    const hidden = new Set<HideableModule>(branding?.modules.hidden ?? []);
    const enabled = new Set<OptionalModule>(branding?.modules.enabled ?? []);
    return {
      branding,
      typeName: branding?.name ?? null,
      terms: resolveTerms(branding),
      theme: resolveTheme(branding),
      /** An optional module (e.g. installments) switched on for this business type. */
      hasModule: (module: OptionalModule) => enabled.has(module),
      /** A standard screen this business type hides from its sidebar. */
      isHidden: (module: HideableModule) => hidden.has(module),
    };
  }, [branding]);
}

/** Shorthand for just the terminology. */
export function useTerms() {
  return useBranding().terms;
}
