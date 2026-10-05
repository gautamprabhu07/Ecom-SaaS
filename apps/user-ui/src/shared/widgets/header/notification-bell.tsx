//path: apps/user-ui/src/shared/widgets/header/notification-bell.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import axiosInstance from "../../../utils/axiosInstance";
import { useNotifications, timeAgo } from "packages/libs/notifications/client";

const NotificationBell = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isPending, markRead, markAllRead } = useNotifications(
    axiosInstance,
    "/order/api/notifications",
  );

  //close when clicking elsewhere
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className="group relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-full text-neutral-200 hover:text-white hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
      >
        <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        <span className="text-[11px] leading-none">Alerts</span>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-2 bg-emerald-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 flex items-center justify-center rounded-full shadow-sm shadow-black/40">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] z-50 rounded-2xl bg-white text-neutral-800 shadow-xl shadow-black/30 border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={() => markAllRead()} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isPending ? (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-lg bg-neutral-100 animate-pulse" />)}
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-500">You're all caught up.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (n.status === "Unread") markRead(n.id);
                    if (n.redirect_link?.startsWith("/")) {
                      setOpen(false);
                      router.push(n.redirect_link);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-neutral-100 last:border-0 transition-colors hover:bg-emerald-50 ${n.status === "Unread" ? "bg-emerald-50/50" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {n.status === "Unread" && <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && <p className="text-xs text-neutral-500 mt-0.5">{n.message}</p>}
                      <p className="text-[11px] text-neutral-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
