import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { NAV_GROUPS, resolveLabel, type ResolvedNavGroup } from "@/config/navigation";
import { useBranding } from "./use-branding";

/**
 * Filters the static nav config down to what this user's permissions, this
 * business's enabled features and its business type's modules allow — and
 * renames items in the trade's own words ("Patients", "Menu", "Orders").
 */
export function useVisibleNav(): ResolvedNavGroup[] {
  const { hasPermission, hasFeature } = useAuth();
  const { terms, hasModule, isHidden } = useBranding();

  return useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        label: group.label ? resolveLabel(group.label, terms) : undefined,
        items: group.items
          .filter(
            (item) =>
              (!item.permission || hasPermission(item.permission)) &&
              (!item.feature || hasFeature(item.feature)) &&
              (!item.hideable || !isHidden(item.hideable)) &&
              (!item.module || hasModule(item.module))
          )
          .map((item) => ({ ...item, label: resolveLabel(item.label, terms) })),
      })).filter((group) => group.items.length > 0),
    [hasPermission, hasFeature, terms, hasModule, isHidden]
  );
}
