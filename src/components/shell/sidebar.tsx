"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
import { useVisibleNav } from "@/hooks/use-visible-nav";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ResolvedNavGroup } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { BusinessBrand } from "./business-brand";

const COLLAPSE_KEY = "pos_sidebar_collapsed";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/** True when `pathname` is this item's page (or one of its sub-pages) — and not a more specific sibling's. */
function isActive(pathname: string, href: string, groups: ResolvedNavGroup[]) {
  if (pathname !== href && !pathname.startsWith(`${href}/`)) return false;
  return !groups.some((g) => g.items.some((i) => i.href !== href && i.href.startsWith(`${href}/`) && pathname.startsWith(i.href)));
}

/**
 * Desktop sidebar: business brand, a primary quick action, the business
 * type's own nav (renamed via its terminology) as large, easy-to-hit
 * buttons, and the signed-in user. Collapses to an icon rail.
 */
export function Sidebar() {
  // The (app) layout only renders the shell once the session has loaded on
  // the client, so reading localStorage in the initializer is safe here.
  const [collapsed, setCollapsed] = useState<boolean>(() => (typeof window === "undefined" ? false : readCollapsed()));

  const toggle = () => {
    setCollapsed((prev) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !prev;
    });
  };

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[84px]" : "w-[276px]"
      )}
    >
      <div className={cn("flex h-[72px] shrink-0 items-center", collapsed ? "justify-center px-2" : "px-5")}>
        <Link href="/dashboard" aria-label="Go to dashboard" className="min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BusinessBrand showName={!collapsed} />
        </Link>
      </div>

      <QuickAction collapsed={collapsed} />

      <SidebarNav collapsed={collapsed} className="flex-1 overflow-y-auto px-3 pb-4 pt-2" />

      <SidebarFooter collapsed={collapsed} onToggle={toggle} />
    </aside>
  );
}

function QuickAction({ collapsed }: { collapsed: boolean }) {
  const { hasPermission, hasFeature } = useAuth();
  const { terms, hasModule } = useBranding();

  const action =
    hasModule("installments") && hasPermission("installments.create")
      ? { href: "/installments/new", label: "New Installment Plan" }
      : hasPermission("sales.create") && hasFeature("pos")
        ? { href: "/pos", label: `Open ${terms.pos}` }
        : null;

  if (!action) return null;

  const button = (
    <Link
      href={action.href}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        "[[data-sidebar=brand]_&]:bg-white [[data-sidebar=brand]_&]:text-[var(--brand-deep)] [[data-sidebar=brand]_&]:hover:bg-white/90",
        collapsed ? "w-11" : "w-full px-4"
      )}
      aria-label={action.label}
    >
      <Plus className="size-5 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{action.label}</span>}
    </Link>
  );

  return (
    <div className={cn("shrink-0 pb-3", collapsed ? "flex justify-center px-2" : "px-4")}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">{action.label}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </div>
  );
}

/** The nav list itself — shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({
  collapsed = false,
  onNavigate,
  className,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const groups = useVisibleNav();
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-6", className)} aria-label="Primary">
      {groups.map((group, i) => (
        <div key={i}>
          {group.label &&
            (collapsed ? (
              <div className="mx-auto mb-2 h-px w-8 bg-sidebar-border" aria-hidden />
            ) : (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">{group.label}</p>
            ))}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href, groups);
              const Icon = item.icon;
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex h-11 items-center gap-3 rounded-xl text-[15px] font-medium transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    collapsed ? "mx-auto w-12 justify-center" : "px-3.5",
                    active
                      ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", !active && "opacity-80 group-hover:opacity-100")} aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user } = useAuth();
  const role = user?.is_super_admin ? "Super Admin" : user?.roles[0]?.replace(/-/g, " ");

  return (
    <div className="shrink-0 border-t border-sidebar-border p-3">
      {user && !collapsed && (
        <Link
          href="/settings/profile"
          className="mb-2 flex items-center gap-3 rounded-xl bg-sidebar-card p-2.5 transition-colors hover:bg-sidebar-hover"
        >
          <Avatar name={user.name} size="md" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{user.name}</p>
            {role && <p className="truncate text-xs capitalize text-sidebar-muted">{role}</p>}
          </div>
        </Link>
      )}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-10 items-center gap-2 rounded-xl text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          collapsed ? "mx-auto w-12 justify-center" : "w-full px-3.5"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
        {!collapsed && "Collapse"}
      </button>
    </div>
  );
}
