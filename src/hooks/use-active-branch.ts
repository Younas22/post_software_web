import { useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranchStore } from "@/store/branch-store";
import { useBranches } from "./use-branches";
import type { Branch } from "@/types";

/**
 * Resolves the branch a user is currently working in. A user pinned to one
 * branch (Manager/Cashier — branch_id set on their account) always uses
 * that; anyone else (Client Owner/Business Admin) picks via the Topbar
 * branch switcher, persisted in useBranchStore, defaulting to their
 * business's main branch (or the first one) the first time it's unset.
 *
 * A pinned actor's branch comes from `GET /config`'s `branch` field, not
 * `GET /branches` — a Cashier has no `businesses.view` permission, so the
 * branches *list* endpoint 403s for them (found via live Cashier testing);
 * `/config` resolves the caller's own branch permission-free instead. The
 * branches list is only ever fetched for an unpinned actor, who by
 * definition holds a role that does carry `businesses.view`.
 */
export function useActiveBranch() {
  const { user, config } = useAuth();
  const pinned = user?.branch_id ?? null;
  const { activeBranchId, setActiveBranchId } = useBranchStore();
  const branchesQuery = useBranches(!pinned && !!user);

  const allBranches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);
  const branches = useMemo(() => (pinned ? [] : allBranches), [allBranches, pinned]);

  useEffect(() => {
    if (pinned || activeBranchId || branches.length === 0) return;
    const main = branches.find((b) => b.is_main) ?? branches[0];
    setActiveBranchId(main.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned, activeBranchId, branches.length]);

  const branchId = pinned ?? activeBranchId;

  // Cheap to recompute each render — not worth the memoization (and the
  // React Compiler already handles this automatically where it helps).
  const pinnedBranch: Branch | null =
    pinned && config?.branch && config.branch.id === pinned
      ? {
          id: config.branch.id,
          business_id: user?.business_id ?? 0,
          name: config.branch.name,
          code: null,
          address: null,
          phone: null,
          is_main: config.branch.is_main,
          status: "active",
        }
      : null;

  const activeBranch: Branch | null = pinned ? pinnedBranch : allBranches.find((b) => b.id === branchId) ?? null;

  return {
    branchId,
    branch: activeBranch,
    /** For an unpinned actor: every branch (for the switcher). For a pinned actor: just their own (for pickers that expect a list). */
    branches: pinned ? (pinnedBranch ? [pinnedBranch] : []) : branches,
    isPinned: pinned !== null,
    isLoading: pinned ? !config : branchesQuery.isLoading,
    setActiveBranchId,
  };
}
