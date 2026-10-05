//Path: packages/libs/notifications/client.ts
//browser-side notification hook shared by user-ui and seller-ui. Styling stays in each app's own bell component.
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface NotificationItem {
  id: string;
  title: string;
  message: string | null;
  redirect_link: string | null;
  status: "Unread" | "Read" | string;
  createdAt: string;
}

interface Http {
  get: (url: string) => Promise<{ data: any }>;
  patch: (url: string, body?: any) => Promise<{ data: any }>;
}

//basePath is "/order/api/notifications"; pass enabled=false while signed out so nothing is fetched
export const useNotifications = (http: Http, basePath: string, enabled = true) => {
  const queryClient = useQueryClient();
  const key = [basePath];

  const query = useQuery({
    queryKey: key,
    enabled,
    refetchInterval: 60_000,
    queryFn: async () => (await http.get(`${basePath}?page=1&limit=20`)).data as { notifications: NotificationItem[]; unreadCount: number },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });
  const markRead = useMutation({ mutationFn: (id: string) => http.patch(`${basePath}/${id}/read`), onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: () => http.patch(`${basePath}/read-all`), onSuccess: invalidate });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isPending: query.isPending && enabled,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
  };
};

export const timeAgo = (iso: string, now: number = Date.now()): string => {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
