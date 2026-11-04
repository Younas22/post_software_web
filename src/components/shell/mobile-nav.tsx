"use client";

import Link from "next/link";
import { LifeBuoy, Menu } from "lucide-react";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody } from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/icon-button";
import { BusinessBrand } from "./business-brand";
import { SidebarNav } from "./sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <IconButton aria-label="Open menu" variant="ghost" className="lg:hidden" onClick={() => setOpen(true)}>
        <Menu />
      </IconButton>
      <DrawerContent side="left" size="sm" className="border-sidebar-border bg-sidebar text-sidebar-foreground">
        <DrawerHeader className="border-sidebar-border">
          <DrawerTitle>
            <BusinessBrand size="sm" />
          </DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="px-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
          <Link
            href="/support"
            onClick={() => setOpen(false)}
            className="mt-6 flex h-11 items-center gap-3 rounded-xl border border-sidebar-border px-3.5 text-[15px] font-medium text-sidebar-foreground/85 hover:bg-sidebar-hover"
          >
            <LifeBuoy className="size-5" aria-hidden /> Support
          </Link>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
