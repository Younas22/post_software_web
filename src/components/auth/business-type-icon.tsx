import {
  Briefcase,
  CalendarClock,
  Hammer,
  Pill,
  Scissors,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Stethoscope,
  Store,
  UtensilsCrossed,
  Warehouse,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/**
 * The icon a Super Admin set on a business type (a Lucide icon name). A
 * curated map — not lucide's full `icons` registry — so the login page
 * doesn't ship every icon in the library; unknown names fall back to Store.
 */
const ICONS: Record<string, LucideIcon> = {
  "shopping-basket": ShoppingBasket,
  "utensils-crossed": UtensilsCrossed,
  pill: Pill,
  smartphone: Smartphone,
  shirt: Shirt,
  scissors: Scissors,
  hammer: Hammer,
  briefcase: Briefcase,
  warehouse: Warehouse,
  stethoscope: Stethoscope,
  "calendar-clock": CalendarClock,
  store: Store,
};

export function BusinessTypeIcon({ name, ...props }: Omit<LucideProps, "name"> & { name?: string | null }) {
  const Icon = (name && ICONS[name]) || Store;
  return <Icon {...props} />;
}
