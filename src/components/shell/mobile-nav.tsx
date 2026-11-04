"use client";

import { Menu } from "lucide-react";
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
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
