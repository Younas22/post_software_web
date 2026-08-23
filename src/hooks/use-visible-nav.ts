import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { NAV_GROUPS, type NavGroup } from "@/config/navigation";

/** Filters the static nav config down to what this user's permissions + this business's enabled features actually allow. */
export function useVisibleNav(): NavGroup[] {
  const { hasPermission, hasFeature } = useAuth();

  return useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => (!item.permission || hasPermission(item.permission)) && (!item.feature || hasFeature(item.feature))
        ),
      })).filter((group) => group.items.length > 0),
    [hasPermission, hasFeature]
  );
}
