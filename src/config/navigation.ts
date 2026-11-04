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
  CalendarClock,
  HandCoins,
} from "lucide-react";
import type { HideableModule, OptionalModule, Terminology } from "@/types";

/** A label is either fixed text or derived from the business type's terminology. */
export type NavLabel = string | ((t: Terminology) => string);

export interface NavItem {
  label: NavLabel;
  href: string;
  icon: LucideIcon;
  /** Permission slug required to see this item — undefined means "always visible once authenticated". */
  permission?: string;
  /** Feature flag slug (from GET /config's features[]) required, if any. */
  feature?: string;
  /** Hidden when the business type hides this module (Admin → Business Types → Modules). */
  hideable?: HideableModule;
  /** Only shown when the business type enables this optional module. */
  module?: OptionalModule;
  /** Shown in the compact mobile bottom bar. */
  primary?: boolean;
}

export interface NavGroup {
  label?: NavLabel;
  items: NavItem[];
}

/** A nav item with its label already resolved for the current business type. */
export interface ResolvedNavItem extends Omit<NavItem, "label"> {
  label: string;
}

export interface ResolvedNavGroup {
  label?: string;
  items: ResolvedNavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view", primary: true },
      { label: (t) => t.pos, href: "/pos", icon: ShoppingCart, permission: "sales.create", feature: "pos", primary: true },
    ],
  },
  {
    label: "Installments",
    items: [
      { label: "Installment Plans", href: "/installments", icon: CalendarClock, permission: "installments.view", module: "installments", primary: true },
      { label: "Collections", href: "/collections", icon: HandCoins, permission: "installments.view", module: "installments" },
    ],
  },
  {
    label: (t) => t.sales,
    items: [
      { label: (t) => (t.sales === "Sales" ? "Sales History" : t.sales), href: "/sales", icon: ReceiptText, permission: "sales.view" },
      { label: "Returns", href: "/returns", icon: Undo2, permission: "returns.view", hideable: "returns" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: (t) => t.products, href: "/products", icon: Package, permission: "products.view", primary: true },
      { label: (t) => t.inventory, href: "/inventory", icon: Boxes, permission: "inventory.view", hideable: "inventory" },
    ],
  },
  {
    label: "Relationships",
    items: [
      { label: (t) => t.customers, href: "/customers", icon: Users, permission: "customers.view" },
      { label: (t) => t.suppliers, href: "/suppliers", icon: Truck, permission: "suppliers.view", hideable: "suppliers" },
    ],
  },
  {
    label: "Money",
    items: [
      { label: (t) => t.purchases, href: "/purchases", icon: ShoppingBag, permission: "purchases.view", hideable: "purchases" },
      { label: "Expenses", href: "/expenses", icon: Receipt, permission: "expenses.view", hideable: "expenses" },
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

export function resolveLabel(label: NavLabel, terms: Terminology): string {
  return typeof label === "function" ? label(terms) : label;
}
