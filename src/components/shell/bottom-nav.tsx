"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { PRIMARY_NAV_ITEMS } from "@/config/navigation";
import { useVisibleNav } from "@/hooks/use-visible-nav";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/** Bottom tab bar for mobile: Home / POS / Products / More — spec's exact set, permission-filtered. */
export function BottomNav() {
  const pathname = usePathname();
  const { hasPermission, hasFeature } = useAuth();
  const groups = useVisibleNav();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = PRIMARY_NAV_ITEMS.filter(
    (item) => (!item.permission || hasPermission(item.permission)) && (!item.feature || hasFeature(item.feature))
  );
  const moreItems = groups.flatMap((g) => g.items).filter((item) => !primary.includes(item));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Primary"
      >
        {primary.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium",
                active ? "text-brand" : "text-muted-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        {moreItems.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium text-muted-foreground"
          >
            <MoreHorizontal className="size-5" aria-hidden />
            More
          </button>
        )}
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent side="right" size="sm">
          <DrawerHeader>
            <DrawerTitle>More</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <ul className="space-y-0.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Icon className="size-5" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
