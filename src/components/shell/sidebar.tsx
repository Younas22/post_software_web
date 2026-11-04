"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVisibleNav } from "@/hooks/use-visible-nav";
import { cn } from "@/lib/utils";
import { BusinessBrand } from "./business-brand";

export function Sidebar() {
  const groups = useVisibleNav();
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <Link href="/dashboard" className="flex h-16 items-center px-5" aria-label="Go to dashboard">
        <BusinessBrand />
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Primary">
        {groups.map((group, i) => (
          <div key={i}>
            {group.label && (
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-brand-soft text-brand"
                          : "text-sidebar-foreground/80 hover:bg-black/[0.03] hover:text-sidebar-foreground dark:hover:bg-white/[0.05]"
                      )}
                    >
                      <Icon className="size-4.5 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
