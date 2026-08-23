"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { notificationsService } from "@/services/notifications.service";
import { IconButton } from "@/components/ui/icon-button";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications", "bell"],
    queryFn: () => notificationsService.list({ per_page: 8 }),
    refetchInterval: 60_000,
  });

  const notifications = data?.data ?? [];
  const unreadCount = (data?.meta as { unread_count?: number } | undefined)?.unread_count ?? 0;

  const markAllRead = async () => {
    await notificationsService.markAllRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <IconButton aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`} variant="ghost" className="relative">
          <Bell />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-error" aria-hidden />
          )}
        </IconButton>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownLabel className="p-0 text-sm font-semibold text-foreground">Notifications</DropdownLabel>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-medium text-brand hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <DropdownSeparator className="mx-0" />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState title="No notifications" description="You're all caught up." className="py-8" />
          ) : (
            notifications.map((n) => {
              const payload = n.data as { title?: string; message?: string };
              return (
                <DropdownItem key={n.id} className={cn("flex-col items-start gap-0.5 py-2.5", !n.read_at && "bg-brand-soft/40")}>
                  <span className="text-sm font-medium text-foreground">{payload.title ?? n.type}</span>
                  {payload.message && <span className="text-xs text-muted-foreground">{payload.message}</span>}
                  <span className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span>
                </DropdownItem>
              );
            })
          )}
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
