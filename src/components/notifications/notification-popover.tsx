"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { markNotificationsAsRead } from "@/server/actions/search-alerts";
import type { Notification } from "@/types";

type NotificationPopoverProps = {
  unreadCount: number;
  onMarkRead: () => void;
};

export function NotificationPopover({
  unreadCount,
  onMarkRead,
}: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (!res.ok) return;
        // We need a separate endpoint for the list — for now fetch from the page
        // Actually, let's use a simple approach: fetch all notifications via API
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [open]);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);

    if (isOpen && unreadCount > 0) {
      // Fetch recent notifications
      try {
        const res = await fetch("/api/notifications/recent");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);

          // Mark all as read
          const unreadIds = data.notifications
            .filter((n: Notification) => !n.readAt)
            .map((n: Notification) => n.id);
          if (unreadIds.length > 0) {
            await markNotificationsAsRead(unreadIds);
            onMarkRead();
          }
        }
      } catch {
        // ignore
      }
    } else if (isOpen) {
      try {
        const res = await fetch("/api/notifications/recent");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch {
        // ignore
      }
    }
  }

  function buildSearchUrl(notification: Notification): string {
    // Parse the notification to find related search alert info
    // For now, link to hakuvahdit page
    return "/hakuvahdit";
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 hover:text-white">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Ilmoitukset</h4>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Ei ilmoituksia
            </div>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                href="/hakuvahdit"
                className="block border-b px-4 py-3 hover:bg-muted transition-colors last:border-b-0"
                onClick={() => setOpen(false)}
              >
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.createdAt).toLocaleDateString("fi-FI")}
                </p>
              </Link>
            ))
          )}
        </div>
        <div className="border-t px-4 py-2">
          <Link
            href="/hakuvahdit"
            className="text-xs text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            Näytä kaikki hakuvahdit
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
