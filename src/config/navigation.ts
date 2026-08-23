import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  ShoppingBag,
  Receipt,
  BarChart3,
  UserCog,
  Building2,
  Settings,
  CreditCard,
  ReceiptText,
  Undo2,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission slug required to see this item — undefined means "always visible once authenticated". */
  permission?: string;
  /** Feature flag slug (from GET /config's features[]) required, if any. */
  feature?: string;
  /** Shown in the compact mobile bottom bar. */
  primary?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view", primary: true },
      { label: "POS", href: "/pos", icon: ShoppingCart, permission: "sales.create", feature: "pos", primary: true },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Sales History", href: "/sales", icon: ReceiptText, permission: "sales.view" },
      { label: "Returns", href: "/returns", icon: Undo2, permission: "returns.view" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package, permission: "products.view", primary: true },
      { label: "Inventory", href: "/inventory", icon: Boxes, permission: "inventory.view" },
    ],
  },
  {
    label: "Relationships",
    items: [
      { label: "Customers", href: "/customers", icon: Users, permission: "customers.view" },
      { label: "Suppliers", href: "/suppliers", icon: Truck, permission: "suppliers.view" },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { label: "Purchases", href: "/purchases", icon: ShoppingBag, permission: "purchases.view" },
      { label: "Expenses", href: "/expenses", icon: Receipt, permission: "expenses.view" },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Reports", href: "/reports", icon: BarChart3, permission: "reports.view", feature: "reports" }],
  },
  {
    label: "Business",
    items: [
      { label: "Employees", href: "/employees", icon: UserCog, permission: "users.view" },
      { label: "Branches", href: "/branches", icon: Building2, permission: "businesses.view" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Subscription", href: "/subscription", icon: CreditCard },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** "More" bottom-nav sheet gets everything not already pinned to the bottom bar. */
export const PRIMARY_NAV_ITEMS = ALL_NAV_ITEMS.filter((i) => i.primary);
export const SECONDARY_NAV_ITEMS = ALL_NAV_ITEMS.filter((i) => !i.primary);
