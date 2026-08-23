import { apiGetList, apiPatch } from "@/lib/api/client";
import type { AppNotification } from "@/types";

export const notificationsService = {
  list: (params?: { unread_only?: boolean; page?: number; per_page?: number }) =>
    apiGetList<AppNotification>("/notifications", { params }),
  markRead: (id: string) => apiPatch<null>(`/notifications/${id}/read`),
  markAllRead: () => apiPatch<null>("/notifications/read-all"),
};
