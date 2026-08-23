import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BranchState {
  activeBranchId: number | null;
  setActiveBranchId: (id: number | null) => void;
}

/**
 * The branch currently "in focus" for a user who isn't pinned to one
 * (Client Owner/Business Admin/Manager without a fixed branch_id) — drives
 * the branch selector in the Topbar and every branch-scoped query (POS,
 * Inventory, Dashboard, Reports). A user with a fixed branch_id on their
 * account ignores this entirely (see useActiveBranch()).
 */
export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      activeBranchId: null,
      setActiveBranchId: (id) => set({ activeBranchId: id }),
    }),
    { name: "pos_active_branch" }
  )
);
