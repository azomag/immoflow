"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import type { NotificationRecord } from "@/lib/api";
import { backendRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relativeTime } from "@/components/dashboard/workspace-utils";

export function NotificationsPopover({
  token,
  userId,
  notifications,
  onOpenMessages,
}: {
  token: string;
  userId: number;
  notifications: NotificationRecord[];
  onOpenMessages: () => void;
}) {
  const [items, setItems] = useState<NotificationRecord[]>(notifications);
  const [busyIds, setBusyIds] = useState<number[]>([]);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  const unreadCount = useMemo(
    () => items.filter((item) => item.recipient.id === userId && !item.read_at).length,
    [items, userId],
  );

  async function markRead(item: NotificationRecord) {
    if (item.recipient.id !== userId || item.read_at || busyIds.includes(item.id)) {
      return;
    }

    setBusyIds((current) => [...current, item.id]);
    try {
      await backendRequest(
        `/api/notifications/${item.id}/read`,
        { method: "PATCH" },
        token,
      );
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, read_at: new Date().toISOString() }
            : entry,
        ),
      );
    } finally {
      setBusyIds((current) => current.filter((id) => id !== item.id));
    }
  }

  const recentItems = items.slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[var(--border)] text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:text-[var(--foreground)] hover:border-[var(--border-strong)]">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <>
              <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[var(--danger)] px-1 text-[10px] font-semibold leading-4 text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--danger)] border-2 border-white" />
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="px-4 py-3">
          <div className="text-sm font-semibold text-[var(--foreground)]">
            Notifications
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {unreadCount} unread
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[360px] overflow-y-auto">
          {recentItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No notifications yet.
            </div>
          ) : (
            recentItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="block cursor-default px-4 py-3"
                onSelect={(event) => event.preventDefault()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {item.subject}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                      {item.message}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                      {item.sender.name} • {relativeTime(item.created_at)}
                    </div>
                  </div>
                  {item.recipient.id === userId && !item.read_at ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 rounded-lg"
                      onClick={() => void markRead(item)}
                      disabled={busyIds.includes(item.id)}
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={onOpenMessages}
          >
            Open messages
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
