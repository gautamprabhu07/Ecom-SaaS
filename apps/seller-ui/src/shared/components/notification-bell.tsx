//path: apps/seller-ui/src/shared/components/notification-bell.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { useNotifications, timeAgo } from "packages/libs/notifications/client";

const NotificationBell = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isPending, markRead, markAllRead } = useNotifications(
    axiosInstance,
    "/order/api/notifications",
  );

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
        className="relative w-10 h-10 rounded-full bg-white border border-[#E7E5E4] text-[#78716C] flex items-center justify-center transition-all duration-200 hover:text-[#059669] hover:border-[#059669]/30 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] z-50 rounded-2xl bg-white border border-[#E7E5E4] shadow-[0_10px_30px_-6px_rgba(120,53,15,0.18)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F4]">
            <p className="text-sm font-bold text-[#292524]">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={() => markAllRead()} className="text-xs font-medium text-[#059669] hover:text-[#047857]">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isPending ? (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-lg bg-[#F5F5F4] animate-pulse" />)}
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#78716C]">You're all caught up.</p>
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
                  className={`w-full text-left px-4 py-3 border-b border-[#F5F5F4] last:border-0 transition-colors hover:bg-[#FAF8F3] ${n.status === "Unread" ? "bg-[#D1FAE5]/40" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {n.status === "Unread" && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#059669] shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#292524]">{n.title}</p>
                      {n.message && <p className="text-xs text-[#78716C] mt-0.5">{n.message}</p>}
                      <p className="text-[11px] text-[#A8A29E] mt-1">{timeAgo(n.createdAt)}</p>
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
