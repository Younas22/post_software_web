"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { BusinessBrand } from "./business-brand";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody } from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/icon-button";
import { useVisibleNav } from "@/hooks/use-visible-nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const groups = useVisibleNav();
  const pathname = usePathname();

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <IconButton
        aria-label="Open menu"
        variant="ghost"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </IconButton>
      <DrawerContent side="left" size="sm">
        <DrawerHeader>
          <DrawerTitle>
            <BusinessBrand size="sm" />
          </DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-5">
          {groups.map((group, i) => (
            <div key={i}>
              {group.label && (
                <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active ? "bg-brand-soft text-brand" : "text-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
